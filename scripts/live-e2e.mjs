// Temporary end-to-end check: real Supabase, real HTTP through the Express app.
// Creates disposable data, exercises the Phase 2 flow, then removes everything.
import "dotenv/config";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildTextPdf } from "../src/tests/helpers/pdfFixture.js";

const url = process.env.SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const app = createApp();

const stamp = Date.now();
const adminEmail = `e2e-admin-${stamp}@example.com`;
const studentEmail = `e2e-student-${stamp}@example.com`;
const password = "Sm0ke-Test!Aa12345";
let adminId;
let studentId;
let institutionId;
let noticeId;

const call = async (method, path, token, body) => {
  const req = request(app)[method](path).set("Authorization", `Bearer ${token}`);
  const res = body === undefined ? await req : await req.send(body);
  return res;
};

const expectOk = (res, label, status = 200) => {
  assert.equal(res.status, status, `${label}: expected ${status}, got ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
};

try {
  const { error: institutionError } = await admin.from("institutions")
    .insert({ id: undefined, name: "E2E University", slug: `e2e-university-${stamp}` });
  assert.equal(institutionError, null, `institution: ${institutionError?.message}`);
  const { data: institution } = await admin.from("institutions").select("id").eq("slug", `e2e-university-${stamp}`).single();
  institutionId = institution.id;

  const { data: department, error: departmentError } = await admin.from("departments")
    .insert({ name: "Computer Science", institution_id: institutionId }).select("id").single();
  assert.equal(departmentError, null, `department: ${departmentError?.message}`);

  const { data: adminUser, error: adminUserError } = await admin.auth.admin.createUser({ email: adminEmail, password, email_confirm: true });
  assert.equal(adminUserError, null, `admin user: ${adminUserError?.message}`);
  adminId = adminUser.user.id;
  const { data: studentUser, error: studentUserError } = await admin.auth.admin.createUser({ email: studentEmail, password, email_confirm: true });
  assert.equal(studentUserError, null, `student user: ${studentUserError?.message}`);
  studentId = studentUser.user.id;

  const { error: adminProfileError } = await admin.from("profiles")
    .update({ name: "E2E Admin", role: "ADMIN", institution_id: institutionId }).eq("id", adminId);
  assert.equal(adminProfileError, null, `admin profile: ${adminProfileError?.message}`);

  const { error: studentProfileError } = await admin.from("profiles")
    .update({ name: "E2E Student", institution_id: institutionId }).eq("id", studentId);
  assert.equal(studentProfileError, null, `student profile: ${studentProfileError?.message}`);

  const { error: studentDetailsError } = await admin.from("student_profiles").insert({
    user_id: studentId, department_id: department.id, branch: "CSE", semester: 6, cpi: 8.5,
    graduation_year: 2027, active_backlogs: 0
  });
  assert.equal(studentDetailsError, null, `student details: ${studentDetailsError?.message}`);

  const { data: adminSession } = await anon.auth.signInWithPassword({ email: adminEmail, password });
  const { data: studentSession } = await anon.auth.signInWithPassword({ email: studentEmail, password });
  const adminToken = adminSession.session.access_token;
  const studentToken = studentSession.session.access_token;
  console.log("1. institution, department, admin and student accounts ready");

  const deadline = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
  const created = expectOk(await call("post", "/api/v1/admin/notices", adminToken, {
    title: "E2E Placement Drive", description: "Software engineer hiring for final year students.",
    category: "PLACEMENT", deadline
  }), "create notice", 201);
  noticeId = created.data.id;
  assert.equal(created.data.status, "DRAFT");
  assert.equal(created.data.review_status, "NOT_REVIEWED");
  console.log("2. admin created notice", noticeId);

  const pdf = buildTextPdf("E2E Placement Drive. CSE students with CPI 7 and no backlogs. Deadline soon.");
  const upload = expectOk(await request(app)
    .post(`/api/v1/admin/notices/${noticeId}/file`)
    .set("Authorization", `Bearer ${adminToken}`)
    .attach("file", pdf, { filename: "notice.pdf", contentType: "application/pdf" }), "upload pdf", 201);
  assert.match(upload.data.signedUrl, /^https?:/);
  console.log("3. PDF uploaded to private bucket; signed URL issued");

  const extraction = expectOk(await call("get", `/api/v1/admin/notices/${noticeId}/extraction`, adminToken), "extraction view");
  assert.equal(extraction.data.extractionStatus, "PENDING");
  console.log("4. extraction view readable");

  const reviewed = expectOk(await call("patch", `/api/v1/admin/notices/${noticeId}/review`, adminToken, {
    summary: "Placement drive for CSE final year students.",
    eligibleBranches: ["CSE"], minimumCPI: 7, requiresNoBacklogs: true,
    requiredDocuments: ["Resume", "Transcript"], decision: "APPROVED"
  }), "review approve");
  assert.equal(reviewed.data.review_status, "APPROVED");
  console.log("5. admin review approved with eligibility rules");

  const publishBlocked = await call("patch", `/api/v1/admin/notices/${noticeId}`, adminToken, { status: "DRAFT" });
  expectOk(publishBlocked, "noop update");

  const published = expectOk(await call("post", `/api/v1/admin/notices/${noticeId}/publish`, adminToken), "publish");
  assert.equal(published.data.status, "PUBLISHED");
  console.log("6. notice published");
  await new Promise((resolve) => setTimeout(resolve, 800));

  const { data: pending } = await admin.from("notifications").select("id, scheduled_for").eq("user_id", studentId);
  assert.ok(pending.length >= 1, "expected queued deadline reminder for eligible student");
  console.log(`7. reminder queued for student (${pending.length} row(s))`);

  const feed = expectOk(await call("get", "/api/v1/notices/feed", studentToken), "feed");
  const feedNotice = feed.data.find((row) => row.id === noticeId);
  assert.ok(feedNotice, "published notice missing from feed");
  assert.equal(feedNotice.eligibility.status, "ELIGIBLE");
  console.log("8. student feed shows notice as ELIGIBLE:", feedNotice.eligibility.reasons);

  const search = expectOk(await call("get", "/api/v1/notices/search?q=placement", studentToken), "search");
  assert.ok(search.data.some((row) => row.id === noticeId));
  console.log(`9. search found ${search.data.length} notice(s)`);

  expectOk(await call("post", `/api/v1/notices/${noticeId}/save`, studentToken), "save", 201);
  const saved = expectOk(await call("get", "/api/v1/notices/saved", studentToken), "saved list");
  assert.ok(saved.data.some((row) => row.notice_id === noticeId && row.notices?.id === noticeId));
  expectOk(await call("delete", `/api/v1/notices/${noticeId}/save`, studentToken), "unsave");
  console.log("10. save / list / unsave works");

  const file = expectOk(await call("get", `/api/v1/notices/${noticeId}/file`, studentToken), "student file url");
  assert.match(file.data.signedUrl, /^https?:/);
  const download = await fetch(file.data.signedUrl);
  assert.equal(download.status, 200);
  assert.ok((await download.arrayBuffer()).byteLength > 0);
  console.log("11. student received a working signed download URL");

  const notifications = expectOk(await call("get", "/api/v1/notifications", studentToken), "notifications");
  assert.equal(notifications.data.length, 0, "future reminders must not be visible yet");
  const unread = expectOk(await call("get", "/api/v1/notifications/unread-count", studentToken), "unread");
  assert.equal(unread.data.unread, 0);
  console.log("12. notifications correctly hidden until due; unread count 0");

  const deadlines = expectOk(await call("get", "/api/v1/deadlines/upcoming", studentToken), "deadlines");
  assert.ok(deadlines.data.some((row) => row.id === noticeId));
  console.log("13. upcoming deadlines includes the notice");

  const forbidden = await call("post", `/api/v1/admin/notices/${noticeId}/process`, studentToken);
  assert.equal(forbidden.status, 403);
  console.log("14. student blocked from admin routes");

  console.log("\nRESULT: live Phase 2 flow verified end to end.");
} catch (error) {
  console.error("LIVE E2E FAILED:", error.message);
  process.exitCode = 1;
} finally {
  if (noticeId && institutionId) {
    const { data: files } = await admin.storage.from("notice-files").list(`${institutionId}/${noticeId}`);
    if (files?.length) {
      await admin.storage.from("notice-files").remove(files.map((file) => `${institutionId}/${noticeId}/${file.name}`));
    }
    await admin.from("notices").delete().eq("id", noticeId);
  }
  if (studentId) await admin.auth.admin.deleteUser(studentId);
  if (adminId) await admin.auth.admin.deleteUser(adminId);
  if (institutionId) await admin.from("institutions").delete().eq("id", institutionId);
  console.log("cleanup: temp notices, files, users and institution removed");
}
