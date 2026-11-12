// Full-coverage smoke test: every HTTP route, real Supabase, real AI provider.
// Creates disposable data, asserts each endpoint, then removes everything it made.
import "dotenv/config";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildTextPdf } from "../src/tests/helpers/pdfFixture.js";

const app = createApp();
const url = process.env.SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

const password = "Sm0ke-Test!Aa12345";
const stamp = Date.now();
const email = (role) => `smoke-${role}-${stamp}@gmail.com`;

const state = {
    institutionId: null,
    departmentId: null,
    users: [],
    noticeIds: [],
    notifications: [],
    files: [],
    aiSkipped: false
};

const results = [];

class SkipTest extends Error {}
const skip = (reason) => {
    throw new SkipTest(reason);
};

const record = (name, status, detail = "") => {
    results.push({ name, status, detail });
    console.log(`${status}  ${name}${detail ? `  (${detail})` : ""}`);
};

const step = async (name, fn) => {
    const started = Date.now();
    try {
        const detail = await fn();
        record(name, "PASS", detail ?? `${Date.now() - started}ms`);
    } catch (error) {
        if (error instanceof SkipTest) {
            record(name, "SKIP", error.message);
            return;
        }
        record(name, "FAIL", error.message);
    }
};

const call = (method, path, token, body) => {
    const req = request(app)[method](path);
    if (token) req.set("Authorization", `Bearer ${token}`);
    return body === undefined ? req : req.send(body);
};

const expectStatus = (res, status, label) => {
    if (typeof status === "string") {
        label = status;
        status = 200;
    }
    assert.equal(
        res.status,
        status,
        `${label}: expected ${status}, got ${res.status} ${JSON.stringify(res.body)}`
    );
    return res.body;
};

const errorMessage = (res) => {
    const error = res.body?.error;
    if (typeof error === "string") return error;
    return error?.message ?? "";
};

const isRateLimited = (res) =>
    res.status === 429 || (res.status === 400 && /rate limit/i.test(errorMessage(res)));

const isProviderOutOfQuota = (res) =>
    res.status === 503 && /rate limit/i.test(errorMessage(res));

const login = async (address) => {
    const res = await call("post", "/api/v1/auth/login", null, { email: address, password });
    return expectStatus(res, 200, `login ${address}`).data;
};

const createUser = async (role) => {
    const address = email(role);
    const { data, error } = await admin.auth.admin.createUser({
        email: address,
        password,
        email_confirm: true,
        user_metadata: { name: `Smoke ${role}` }
    });
    assert.equal(error, null, `create ${role}: ${error?.message}`);
    state.users.push(data.user.id);
    return { id: data.user.id, email: address };
};

const createNotice = async (token, overrides = {}) => {
    const res = await call("post", "/api/v1/admin/notices", token, {
        title: `Smoke Notice ${stamp} ${state.noticeIds.length + 1}`,
        description: "Disposable notice created by the full smoke test.",
        category: "PLACEMENT",
        deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        ...overrides
    });
    const body = expectStatus(res, 201, "create notice");
    state.noticeIds.push(body.data.id);
    return body.data;
};

const tokens = { admin: null, student: null, profileStudent: null, logout: null };

const setup = async () => {
    const { data: institution, error: institutionError } = await admin
        .from("institutions")
        .insert({ name: `Smoke University ${stamp}`, slug: `smoke-university-${stamp}` })
        .select("id")
        .single();
    assert.equal(institutionError, null, `institution: ${institutionError?.message}`);
    state.institutionId = institution.id;

    const { data: department, error: departmentError } = await admin
        .from("departments")
        .insert({ name: "Computer Science", institution_id: state.institutionId })
        .select("id")
        .single();
    assert.equal(departmentError, null, `department: ${departmentError?.message}`);
    state.departmentId = department.id;

    const adminUser = await createUser("admin");
    const studentUser = await createUser("student");
    const profileStudentUser = await createUser("profile");
    const logoutUser = await createUser("logout");

    const { error: roleError } = await admin
        .from("profiles")
        .update({ name: "Smoke Admin", role: "ADMIN", institution_id: state.institutionId })
        .eq("id", adminUser.id);
    assert.equal(roleError, null, `admin profile: ${roleError?.message}`);

    for (const user of [studentUser, profileStudentUser, logoutUser]) {
        const { error } = await admin
            .from("profiles")
            .update({ name: "Smoke Student", institution_id: state.institutionId })
            .eq("id", user.id);
        assert.equal(error, null, `student profile: ${error?.message}`);
    }

    const { error: detailsError } = await admin.from("student_profiles").insert({
        user_id: studentUser.id,
        department_id: state.departmentId,
        branch: "CSE",
        semester: 6,
        cpi: 8.5,
        graduation_year: 2027,
        active_backlogs: 0,
        interests: ["backend"]
    });
    assert.equal(detailsError, null, `student details: ${detailsError?.message}`);

    state.adminUser = adminUser;
    state.studentUser = studentUser;
    state.profileStudentUser = profileStudentUser;
    state.logoutUser = logoutUser;
};

const LEFTOVER_EMAIL = /^smoke-.*@gmail\.com$/;

const listAllUsers = async () => {
    const users = [];
    for (let page = 1; ; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(`list users: ${error.message}`);
        users.push(...data.users);
        if (data.users.length < 200) return users;
    }
};

const sweepLeftovers = async () => {
    const { data: institutions, error } = await admin
        .from("institutions").select("id").like("slug", "smoke-university-%");
    if (error) throw new Error(`list leftovers: ${error.message}`);
    const ids = (institutions ?? []).map((row) => row.id);

    if (ids.length > 0) {
        const { data: notices } = await admin
            .from("notices").select("file_path").in("institution_id", ids);
        const files = (notices ?? []).map((row) => row.file_path).filter(Boolean);
        if (files.length > 0) {
            await admin.storage.from("notice-files").remove(files);
        }
        await admin.from("notices").delete().in("institution_id", ids);
        await admin.from("departments").delete().in("institution_id", ids);
        await admin.from("institutions").delete().in("id", ids);
    }

    const leftovers = (await listAllUsers()).filter((user) => LEFTOVER_EMAIL.test(user.email ?? ""));
    for (const user of leftovers) {
        await admin.from("student_profiles").delete().eq("user_id", user.id);
        await admin.from("profiles").delete().eq("id", user.id);
        await admin.auth.admin.deleteUser(user.id);
    }

    return `${ids.length} institutions, ${leftovers.length} users swept`;
};

await step("sweep: remove leftovers from earlier smoke runs", async () => sweepLeftovers());

await step("setup: institution, department and 4 disposable users", async () => {
    await setup();
    return `${state.institutionId} / ${state.departmentId}`;
});

await step("POST /auth/register creates a student account", async () => {
    const address = email("register");
    const res = await call("post", "/api/v1/auth/register", null, {
        name: "Smoke Register", email: address, password
    });
    const providerMessage = errorMessage(res);

    if (isRateLimited(res)) {
        skip(`Supabase email sender is rate limited: ${providerMessage}`);
    }

    const body = expectStatus(res, 201, "register");
    assert.equal(body.data.user.email, address);
    assert.equal(body.data.user.role, "STUDENT");
    assert.ok(body.data.session || body.data.requiresEmailConfirmation === true);

    const { data: profile } = await admin
        .from("profiles").select("id").eq("email", address).maybeSingle();
    assert.ok(profile?.id, "registered profile was not created");
    state.users.push(profile.id);
    state.registerEmail = address;
    state.registered = true;
});

await step("POST /auth/register rejects a duplicate email", async () => {
    const address = state.registerEmail ?? state.adminUser.email;
    const res = await call("post", "/api/v1/auth/register", null, {
        name: "Smoke Register", email: address, password
    });
    if (isRateLimited(res)) {
        skip("Supabase email sender is rate limited");
    }
    const body = expectStatus(res, 409, "duplicate register");
    assert.match(errorMessage({ body }), /already/i);
});

await step("POST /auth/login returns tokens for admin and students", async () => {
    assert.ok(state.adminUser, "setup failed, no user to log in as");
    const adminSession = await login(state.adminUser.email);
    const studentSession = await login(state.studentUser.email);
    const profileSession = await login(state.profileStudentUser.email);
    tokens.logout = (await login(state.logoutUser.email)).session.accessToken;
    assert.equal(adminSession.user.role, "ADMIN");
    assert.equal(studentSession.user.role, "STUDENT");
    assert.ok(adminSession.session.accessToken);
    tokens.admin = adminSession.session.accessToken;
    tokens.student = studentSession.session.accessToken;
    tokens.profileStudent = profileSession.session.accessToken;
});

await step("POST /auth/login rejects a wrong password", async () => {
    const res = await call("post", "/api/v1/auth/login", null, {
        email: state.studentUser.email, password: "Wrong-Password-1"
    });
    expectStatus(res, 401, "bad login");
});

await step("GET /auth/me returns the caller", async () => {
    const body = expectStatus(await call("get", "/api/v1/auth/me", tokens.student), "me");
    assert.equal(body.data.id, state.studentUser.id);
    assert.equal(body.data.institutionId, state.institutionId);
});

await step("GET /auth/me rejects a missing token", async () => {
    expectStatus(await call("get", "/api/v1/auth/me"), 401, "me without token");
});

await step("POST /auth/logout ends a session", async () => {
    const body = expectStatus(await call("post", "/api/v1/auth/logout", tokens.logout), 200, "logout");
    assert.equal(body.data.message, "Logged out");
});

await step("GET /institutions lists the institution", async () => {
    const body = expectStatus(await call("get", "/api/v1/institutions", tokens.student), "institutions");
    assert.ok(body.data.some((row) => row.id === state.institutionId));
});

await step("GET /institutions/:id/departments lists departments", async () => {
    const body = expectStatus(await call(
        "get", `/api/v1/institutions/${state.institutionId}/departments`, tokens.student
    ), "departments");
    assert.ok(body.data.some((row) => row.id === state.departmentId));
});

await step("GET /students/profile returns the seeded profile", async () => {
    const body = expectStatus(await call("get", "/api/v1/students/profile", tokens.student), "profile");
    assert.equal(body.data.id, state.studentUser.id);
    const details = Array.isArray(body.data.student_profiles)
        ? body.data.student_profiles[0] : body.data.student_profiles;
    assert.equal(details.branch, "CSE");
    assert.equal(details.cpi, 8.5);
});

await step("POST /students/profile creates a profile for a new student", async () => {
    const body = expectStatus(await call("post", "/api/v1/students/profile", tokens.profileStudent, {
        institutionId: state.institutionId,
        departmentName: "Computer Science",
        branch: "IT",
        semester: 4,
        cpi: 7.2,
        graduationYear: 2028,
        activeBacklogs: 0,
        interests: ["design"]
    }), 201, "create profile");
    assert.equal(body.data.branch, "IT");
    assert.equal(body.data.semester, 4);
});

await step("PATCH /students/profile updates the same profile", async () => {
    const body = expectStatus(await call("patch", "/api/v1/students/profile", tokens.profileStudent, {
        semester: 5, cpi: 7.9
    }), 200, "update profile");
    assert.equal(body.data.semester, 5);
    assert.equal(body.data.cpi, 7.9);
});

await step("POST /admin/notices creates a draft notice", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const notice = await createNotice(tokens.admin);
    assert.equal(notice.status, "DRAFT");
    assert.equal(notice.review_status, "NOT_REVIEWED");
    state.noticeId = notice.id;
});

await step("POST /admin/notices validates the payload", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    expectStatus(await call("post", "/api/v1/admin/notices", tokens.admin, { title: "x" }), 400, "bad notice");
});

await step("GET /admin/notices lists and filters notices", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const all = expectStatus(await call("get", "/api/v1/admin/notices", tokens.admin), "admin list");
    assert.ok(all.data.some((row) => row.id === state.noticeId));
    const drafts = expectStatus(await call("get", "/api/v1/admin/notices?status=DRAFT", tokens.admin), "draft filter");
    assert.ok(drafts.data.every((row) => row.status === "DRAFT"));
    const search = expectStatus(await call(
        "get", `/api/v1/admin/notices?search=${encodeURIComponent(String(stamp))}`, tokens.admin
    ), "admin search");
    assert.ok(search.data.some((row) => row.id === state.noticeId));
});

await step("GET /admin/notices/:id returns the notice", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const body = expectStatus(await call("get", `/api/v1/admin/notices/${state.noticeId}`, tokens.admin), "admin notice");
    assert.equal(body.data.id, state.noticeId);
});

await step("GET /admin/notices/:id handles unknown ids", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const missing = "00000000-0000-4000-8000-000000000000";
    expectStatus(await call("get", `/api/v1/admin/notices/${missing}`, tokens.admin), 404, "missing notice");
    expectStatus(await call("get", "/api/v1/admin/notices/not-a-uuid", tokens.admin), 400, "bad uuid");
});

await step("PATCH /admin/notices/:id updates fields", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const body = expectStatus(await call("patch", `/api/v1/admin/notices/${state.noticeId}`, tokens.admin, {
        summary: "Smoke-test summary", minimumCPI: 6.5, eligibleBranches: ["CSE", "IT"]
    }), "update notice");
    assert.equal(body.data.summary, "Smoke-test summary");
    assert.equal(body.data.minimum_cpi, 6.5);
});

await step("POST /admin/notices/:id/file rejects a non-PDF", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    expectStatus(await request(app)
        .post(`/api/v1/admin/notices/${state.noticeId}/file`)
        .set("Authorization", `Bearer ${tokens.admin}`)
        .attach("file", Buffer.from("not a pdf"), { filename: "bad.txt", contentType: "text/plain" }),
    400, "bad upload");
});

await step("POST /admin/notices/:id/file uploads a PDF", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const pdf = buildTextPdf(
        "Smoke Placement Drive 2026. Eligible branches: CSE and IT. Minimum CPI 7.5. "
        + "Semesters 4 to 6. No active backlogs. Deadline 15 December 2026. "
        + "Apply at https://careers.example.com/smoke with a resume and transcript."
    );
    const body = expectStatus(await request(app)
        .post(`/api/v1/admin/notices/${state.noticeId}/file`)
        .set("Authorization", `Bearer ${tokens.admin}`)
        .attach("file", pdf, { filename: "smoke-notice.pdf", contentType: "application/pdf" }),
    201, "upload pdf");
    assert.match(body.data.signedUrl, /^https?:/);
    assert.equal(body.data.notice.file_name, "smoke-notice.pdf");
    state.files.push(body.data.notice.file_path);
    state.pdfUploaded = true;
});

await step("GET /admin/notices/:id/file signs a download URL", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    assert.ok(state.pdfUploaded, "PDF was not uploaded");
    const body = expectStatus(await call("get", `/api/v1/admin/notices/${state.noticeId}/file`, tokens.admin), "admin file");
    assert.match(body.data.signedUrl, /^https?:/);
    assert.equal(body.data.fileName, "smoke-notice.pdf");
});

const assertEvidence = (evidence) => {
    for (const item of evidence) {
        assert.ok(item.field, "evidence.field missing");
        assert.ok(item.text, "evidence.text missing");
        assert.ok(item.pageNumber === null || Number.isInteger(item.pageNumber), "bad pageNumber");
    }
};

const callAiRoute = async (path, token) => {
    let res = await call("post", path, token);
    let attempts = 1;
    while (attempts < 5) {
        const rateLimited = res.status === 503 && /rate limit/i.test(errorMessage(res));
        if (![502, 504].includes(res.status) && !rateLimited) break;
        await new Promise((resolve) => setTimeout(resolve, rateLimited ? 30000 : 3000));
        res = await call("post", path, token);
        attempts += 1;
    }
    return { res, attempts };
};

await step("POST /admin/notices/:id/process runs real AI extraction", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    assert.ok(state.pdfUploaded, "PDF was not uploaded");
    const { res, attempts } = await callAiRoute(`/api/v1/admin/notices/${state.noticeId}/process`, tokens.admin);
    if (isProviderOutOfQuota(res)) {
        state.aiSkipped = `AI provider quota exhausted: ${errorMessage(res)}`;
        skip(state.aiSkipped);
    }
    const body = expectStatus(res, 200, "process");
    if (attempts > 1) {
        console.log(`      (provider needed ${attempts} attempts)`);
    }
    assert.equal(body.data.status, "COMPLETED");
    assert.equal(body.data.notice.extraction_status, "COMPLETED");
    assert.equal(body.data.notice.review_status, "PENDING_REVIEW");
    const extraction = body.data.extraction;
    assert.ok(extraction.title, "extraction had no title");
    assert.ok(Array.isArray(extraction.evidence) && extraction.evidence.length > 0, "no evidence returned");
    assertEvidence(extraction.evidence);
    state.extraction = extraction;
    return `title=${JSON.stringify(extraction.title)} evidence=${extraction.evidence.length} attempts=${attempts}`;
});

await step("GET /admin/notices/:id/extraction returns data and logs", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    if (state.aiSkipped) skip(state.aiSkipped);
    const body = expectStatus(await call("get", `/api/v1/admin/notices/${state.noticeId}/extraction`, tokens.admin), "extraction view");
    assert.equal(body.data.extractionStatus, "COMPLETED");
    assert.ok(body.data.extractedData.title);
    assert.ok(Array.isArray(body.data.logs) && body.data.logs.length >= 1);
});

await step("GET /admin/notices/pending-review includes the notice", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    if (state.aiSkipped) skip(state.aiSkipped);
    const body = expectStatus(await call("get", "/api/v1/admin/notices/pending-review", tokens.admin), "pending review");
    assert.ok(body.data.some((row) => row.id === state.noticeId));
});

await step("PATCH /admin/notices/:id/review approves with rules", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const body = expectStatus(await call("patch", `/api/v1/admin/notices/${state.noticeId}/review`, tokens.admin, {
        summary: "Reviewed by the smoke test.",
        eligibleBranches: ["CSE", "IT"],
        minimumCPI: 7.5,
        minimumSemester: 4,
        maximumSemester: 6,
        requiresNoBacklogs: true,
        requiredDocuments: ["Resume", "Transcript"],
        decision: "APPROVED"
    }), "review approve");
    assert.equal(body.data.review_status, "APPROVED");
});

await step("POST /admin/notices/:id/publish publishes the notice", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const body = expectStatus(await call("post", `/api/v1/admin/notices/${state.noticeId}/publish`, tokens.admin), "publish");
    assert.equal(body.data.status, "PUBLISHED");
});

await step("POST /admin/notices/:id/retry re-runs extraction", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    if (state.aiSkipped) skip(state.aiSkipped);
    const { res, attempts } = await callAiRoute(`/api/v1/admin/notices/${state.noticeId}/retry`, tokens.admin);
    if (isProviderOutOfQuota(res)) skip(`AI provider quota exhausted: ${errorMessage(res)}`);
    const body = expectStatus(res, 200, "retry");
    if (attempts > 1) {
        console.log(`      (provider needed ${attempts} attempts)`);
    }
    assert.equal(body.data.status, "COMPLETED");
    assert.equal(body.data.notice.review_status, "APPROVED");
    assertEvidence(body.data.extraction.evidence);
});

await step("GET /notices/feed shows the published notice", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call("get", "/api/v1/notices/feed", tokens.student), "feed");
    const row = body.data.find((notice) => notice.id === state.noticeId);
    assert.ok(row, "published notice missing from feed");
    assert.ok(["ELIGIBLE", "POSSIBLY_ELIGIBLE", "NOT_ELIGIBLE"].includes(row.eligibility.status));
    return `eligibility=${row.eligibility.status}`;
});

await step("GET /notices lists published notices", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call("get", "/api/v1/notices", tokens.student), "notice list");
    assert.ok(body.data.some((notice) => notice.id === state.noticeId));
});

await step("GET /notices/:id returns the published notice", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call("get", `/api/v1/notices/${state.noticeId}`, tokens.student), "notice detail");
    assert.equal(body.data.id, state.noticeId);
    assert.equal(body.data.file_name, "smoke-notice.pdf");
});

await step("GET /notices/:id/eligibility explains the verdict", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call("get", `/api/v1/notices/${state.noticeId}/eligibility`, tokens.student), "eligibility");
    assert.equal(body.data.noticeId, state.noticeId);
    assert.ok(body.data.eligibility.status);
});

await step("GET /notices/:id/file signs a student download URL", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call("get", `/api/v1/notices/${state.noticeId}/file`, tokens.student), "student file");
    assert.match(body.data.signedUrl, /^https?:/);
});

await step("GET /notices/search finds the notice", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call(
        "get", `/api/v1/notices/search?search=${encodeURIComponent(`Smoke Notice ${stamp}`)}`, tokens.student
    ), "search");
    assert.ok(body.data.some((notice) => notice.id === state.noticeId));
});

await step("POST/DELETE /notices/:id/save round-trips", async () => {
    assert.ok(tokens.student, "student token unavailable");
    expectStatus(await call("post", `/api/v1/notices/${state.noticeId}/save`, tokens.student), 201, "save");
    const saved = expectStatus(await call("get", "/api/v1/notices/saved", tokens.student), "saved list");
    assert.ok(saved.data.some((notice) => (notice.notice_id ?? notice.id) === state.noticeId));
    expectStatus(await call("delete", `/api/v1/notices/${state.noticeId}/save`, tokens.student), 200, "unsave");
    const after = expectStatus(await call("get", "/api/v1/notices/saved", tokens.student), "saved after");
    assert.ok(!after.data.some((notice) => (notice.notice_id ?? notice.id) === state.noticeId));
});

await step("GET /deadlines/upcoming lists the deadline", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const body = expectStatus(await call("get", "/api/v1/deadlines/upcoming?days=60", tokens.student), "deadlines");
    assert.ok(body.data.some((notice) => notice.id === state.noticeId));
});

await step("GET /notifications and /unread-count", async () => {
    assert.ok(tokens.student, "student token unavailable");
    const { data, error } = await admin.from("notifications").insert({
        user_id: state.studentUser.id,
        notice_id: state.noticeId,
        type: "DEADLINE_REMINDER",
        title: "Smoke reminder",
        message: "Reminder created by the smoke test.",
        scheduled_for: new Date(Date.now() - 60_000).toISOString(),
        dedupe_key: `smoke:${stamp}:1`
    }).select("id").single();
    assert.equal(error, null, `notification insert: ${error?.message}`);
    state.notifications.push(data.id);
    state.notificationId = data.id;

    const list = expectStatus(await call("get", "/api/v1/notifications", tokens.student), "notifications");
    assert.ok(list.data.some((row) => row.id === state.notificationId));
    const unread = expectStatus(await call("get", "/api/v1/notifications/unread-count", tokens.student), "unread");
    assert.ok(unread.data.unread >= 1);
});

await step("PATCH /notifications/:id/read marks it read", async () => {
    assert.ok(tokens.student, "student token unavailable");
    assert.ok(state.notificationId, "notification was not created");
    const body = expectStatus(await call(
        "patch", `/api/v1/notifications/${state.notificationId}/read`, tokens.student
    ), "mark read");
    assert.ok(body.data.read_at, "read_at not set");
    expectStatus(await call("patch", "/api/v1/notifications/00000000-0000-4000-8000-000000000000/read", tokens.student), 404, "missing notification");
});

await step("POST /admin/notices/:id/reject rejects a notice", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const notice = await createNotice(tokens.admin);
    const body = expectStatus(await call(
        "post", `/api/v1/admin/notices/${notice.id}/reject`, tokens.admin, { reviewNote: "Incomplete details" }
    ), "reject");
    assert.equal(body.data.review_status, "REJECTED");
});

await step("DELETE /admin/notices/:id archives a notice", async () => {
    assert.ok(tokens.admin, "admin token unavailable");
    const notice = await createNotice(tokens.admin);
    const body = expectStatus(await call("delete", `/api/v1/admin/notices/${notice.id}`, tokens.admin), "archive");
    assert.equal(body.data.status, "ARCHIVED");
});

await step("students are blocked from admin routes", async () => {
    assert.ok(tokens.student, "student token unavailable");
    expectStatus(await call("get", "/api/v1/admin/notices", tokens.student), 403, "student admin list");
    expectStatus(await call("post", "/api/v1/admin/notices", tokens.student, {
        title: "Blocked", description: "Blocked", category: "PLACEMENT"
    }), 403, "student create");
});

await step("protected routes reject anonymous callers", async () => {
    expectStatus(await call("get", "/api/v1/notices/feed"), 401, "anon feed");
    expectStatus(await call("get", "/api/v1/students/profile"), 401, "anon profile");
});

const withRetry = async (label, fn) => {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const { error } = await fn();
            if (error) throw new Error(error.message);
            return;
        } catch (error) {
            lastError = error;
            if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        }
    }
    throw new Error(`${label}: ${lastError.message}`);
};

await step("cleanup: remove every disposable record", async () => {
    const errors = [];
    const guard = async (label, fn) => {
        try {
            await withRetry(label, fn);
        } catch (error) {
            errors.push(error.message);
        }
    };

    if (state.institutionId) {
        const institutionId = state.institutionId;
        await guard("notices", () => admin.from("notices").delete().eq("institution_id", institutionId));
        const files = state.files.filter(Boolean);
        if (files.length > 0) {
            await guard("storage", () => admin.storage.from("notice-files").remove(files));
        }
    }

    for (const id of state.users) {
        await guard("student_profiles", () => admin.from("student_profiles").delete().eq("user_id", id));
        await guard("profiles", () => admin.from("profiles").delete().eq("id", id));
        await guard("auth user", () => admin.auth.admin.deleteUser(id));
    }

    if (state.institutionId) {
        const institutionId = state.institutionId;
        await guard("departments", () => admin.from("departments").delete().eq("institution_id", institutionId));
        await guard("institution", () => admin.from("institutions").delete().eq("id", institutionId));
    }

    assert.deepEqual(errors, [], errors.join("; "));
    return `${state.users.length} users, ${state.noticeIds.length} notices removed`;
});

const failed = results.filter((result) => result.status === "FAIL");
const skipped = results.filter((result) => result.status === "SKIP");
const passed = results.filter((result) => result.status === "PASS").length;

console.log(`\n${passed} passed, ${failed.length} failed, ${skipped.length} skipped (${results.length} checks)`);
if (failed.length > 0) {
    console.log("\nFailures:");
    for (const failure of failed) {
        console.log(`- ${failure.name}: ${failure.detail}`);
    }
    process.exitCode = 1;
}
if (skipped.length > 0) {
    console.log("\nSkipped:");
    for (const item of skipped) {
        console.log(`- ${item.name}: ${item.detail}`);
    }
}
