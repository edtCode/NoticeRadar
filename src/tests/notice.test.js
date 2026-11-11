import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
    buildTestApp,
    createUserClient,
    adminProfileRow,
    studentProfileRow,
    ADMIN_ID,
    INSTITUTION_ID,
    NOTICE_ID
} from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const noticeRow = {
    id: NOTICE_ID,
    institution_id: INSTITUTION_ID,
    title: "Summer Internship",
    description: "Apply now",
    category: "INTERNSHIP",
    status: "DRAFT",
    created_by: ADMIN_ID
};

const buildAdminApp = (notices) => {
    const userClient = createUserClient({
        profile: adminProfileRow,
        tables: {
            notices,
            profiles: {
                select: { data: adminProfileRow },
                update: { data: adminProfileRow }
            }
        }
    });

    return {
        userClient,
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient })
    };
};

const buildStudentApp = (notices) => {
    const userClient = createUserClient({
        profile: studentProfileRow,
        tables: { notices }
    });

    return {
        userClient,
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient })
    };
};

test("an admin creates a draft notice for their institution", async () => {
    const { app, userClient } = buildAdminApp({
        insert: { data: noticeRow }
    });

    const response = await request(app)
        .post("/api/v1/admin/notices")
        .set("Authorization", "Bearer valid-token")
        .send({ title: "Summer Internship", description: "Apply now", category: "INTERNSHIP" });

    assert.equal(response.status, 201);

    const insertCall = userClient.calls.find((call) => call.method === "insert");
    assert.equal(insertCall.payload.institution_id, INSTITUTION_ID);
    assert.equal(insertCall.payload.created_by, ADMIN_ID);
    assert.equal(insertCall.payload.status, "DRAFT");
});

test("manual notice creation persists supported eligibility and summary fields", async () => {
    const { app, userClient } = buildAdminApp({
        insert: { data: noticeRow }
    });

    const response = await request(app)
        .post("/api/v1/admin/notices")
        .set("Authorization", "Bearer valid-token")
        .send({
            title: "Summer Internship",
            description: "Apply now",
            category: "INTERNSHIP",
            summary: "A summer placement opportunity",
            deadline: "2027-05-31",
            eligibleBranches: ["Computer Science"],
            minimumCPI: 8,
            minimumSemester: 5,
            maximumSemester: 8,
            eligibleGraduationYears: [2027, 2028],
            requiresNoBacklogs: true,
            requiredDocuments: ["Resume"],
            duration: "8 weeks"
        });

    assert.equal(response.status, 201);

    const insertCall = userClient.calls.find((call) => call.method === "insert");
    assert.equal(insertCall.payload.summary, "A summer placement opportunity");
    assert.deepEqual(insertCall.payload.eligible_branches, ["Computer Science"]);
    assert.equal(insertCall.payload.minimum_cpi, 8);
    assert.equal(insertCall.payload.minimum_semester, 5);
    assert.deepEqual(insertCall.payload.eligible_graduation_years, [2027, 2028]);
    assert.equal(insertCall.payload.requires_no_backlogs, true);
    assert.deepEqual(insertCall.payload.required_documents, ["Resume"]);
    assert.equal(insertCall.payload.duration, "8 weeks");
});

test("an admin updates a notice with institution scoping", async () => {
    const { app, userClient } = buildAdminApp({
        select: { data: noticeRow },
        update: { data: { ...noticeRow, title: "Updated" } }
    });

    const response = await request(app)
        .patch(`/api/v1/admin/notices/${NOTICE_ID}`)
        .set("Authorization", "Bearer valid-token")
        .send({ title: "Updated title" });

    assert.equal(response.status, 200);

    const updateCall = userClient.calls.find((call) => call.method === "update");
    assert.ok(updateCall.filters.some((filter) => filter.column === "institution_id" && filter.value === INSTITUTION_ID));
});

test("a student only receives published notices from their institution", async () => {
    const { app, userClient } = buildStudentApp({
        select: { data: [{ ...noticeRow, status: "PUBLISHED" }], count: 12 }
    });

    const response = await request(app)
        .get("/api/v1/notices?page=2&limit=5&category=EXAM&deadlineFrom=2026-01-01")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.pagination, { page: 2, limit: 5, total: 12, totalPages: 3 });

    const noticeQuery = userClient.calls.find((call) => call.table === "notices");
    const filters = noticeQuery.filters;

    assert.ok(filters.some((filter) => filter.column === "status" && filter.value === "PUBLISHED"));
    assert.ok(filters.some((filter) => filter.column === "institution_id" && filter.value === INSTITUTION_ID));
    assert.ok(filters.some((filter) => filter.column === "category" && filter.value === "EXAM"));
    assert.deepEqual(noticeQuery.range, { from: 5, to: 9 });
});

test("a student cannot read a draft notice", async () => {
    const { app, userClient } = buildStudentApp({ select: { data: null } });

    const response = await request(app)
        .get(`/api/v1/notices/${NOTICE_ID}`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 404);

    const noticeQuery = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeQuery.filters.some((filter) => filter.column === "status" && filter.value === "PUBLISHED"));
});

test("an admin cannot read another institution's notice", async () => {
    const { app, userClient } = buildAdminApp({ select: { data: null } });

    const response = await request(app)
        .get(`/api/v1/admin/notices/${NOTICE_ID}`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 404);

    const noticeQuery = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeQuery.filters.some((filter) => filter.column === "institution_id" && filter.value === INSTITUTION_ID));
});

test("publishing is blocked until an admin approves the notice", async () => {
    const { app } = buildAdminApp({
        select: { data: noticeRow },
        update: { data: { ...noticeRow, status: "PUBLISHED" } }
    });

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/publish`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 409);
});

test("publishing sets the publication timestamp and approver", async () => {
    const approvedRow = { ...noticeRow, review_status: "APPROVED" };

    const { app, userClient } = buildAdminApp({
        select: { data: approvedRow },
        update: { data: { ...approvedRow, status: "PUBLISHED" } }
    });

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/publish`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);

    const updateCall = userClient.calls.find((call) => call.method === "update");
    assert.equal(updateCall.payload.status, "PUBLISHED");
    assert.equal(updateCall.payload.approved_by, ADMIN_ID);
    assert.ok(updateCall.payload.published_at);
});
