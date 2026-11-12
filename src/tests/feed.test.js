import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
    buildTestApp,
    createUserClient,
    studentProfileRow,
    STUDENT_ID,
    INSTITUTION_ID,
    NOTICE_ID
} from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const publishedNotice = {
    id: NOTICE_ID,
    institution_id: INSTITUTION_ID,
    title: "Summer Internship",
    summary: "A summer internship",
    category: "INTERNSHIP",
    status: "PUBLISHED",
    deadline: "2026-12-01T23:59:59.999Z",
    eligible_branches: ["Computer Science"],
    minimum_cpi: 7.5,
    minimum_semester: 4,
    maximum_semester: 6,
    eligible_graduation_years: [2027],
    requires_no_backlogs: true
};

const profileWithStudent = {
    ...studentProfileRow,
    student_profiles: [
        {
            branch: "Computer Science",
            semester: 5,
            cpi: 8.2,
            graduation_year: 2027,
            active_backlogs: 0
        }
    ]
};

const buildStudentApp = (tables) => {
    const userClient = createUserClient({
        profile: profileWithStudent,
        tables: {
            profiles: { select: { data: profileWithStudent } },
            ...tables
        }
    });

    return {
        userClient,
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient })
    };
};

test("the feed returns published notices with computed eligibility", async () => {
    const { app, userClient } = buildStudentApp({
        notices: { select: { data: [publishedNotice], count: 1 } }
    });

    const response = await request(app)
        .get("/api/v1/notices/feed?page=1&limit=5")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].eligibility.status, "ELIGIBLE");
    assert.deepEqual(response.body.pagination, { page: 1, limit: 5, total: 1, totalPages: 1 });

    const noticeCall = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeCall.filters.some((filter) => filter.column === "status" && filter.value === "PUBLISHED"));
    assert.ok(noticeCall.filters.some((filter) => filter.column === "institution_id" && filter.value === INSTITUTION_ID));
    assert.deepEqual(noticeCall.range, { from: 0, to: 4 });
});

test("the feed can filter by eligibility", async () => {
    const ineligible = {
        ...publishedNotice,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        minimum_cpi: 9.9
    };
    const { app } = buildStudentApp({
        notices: { select: { data: [publishedNotice, ineligible], count: 2 } }
    });

    const response = await request(app)
        .get("/api/v1/notices/feed?eligibility=NOT_ELIGIBLE")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].id, ineligible.id);
    assert.equal(response.body.pagination.total, 1);
});

test("feed category and sort options reach the database query", async () => {
    const { app, userClient } = buildStudentApp({
        notices: { select: { data: [], count: 0 } }
    });

    const response = await request(app)
        .get("/api/v1/notices/feed?category=EXAM&sort=deadline&search=scholarship")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);

    const noticeCall = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeCall.filters.some((filter) => filter.column === "category" && filter.value === "EXAM"));
    assert.ok(noticeCall.filters.some((filter) => filter.column === "or" && /scholarship/.test(filter.value)));
    assert.equal(noticeCall.orders[0].column, "deadline");
});

test("search only looks at published notices in the student's institution", async () => {
    const { app, userClient } = buildStudentApp({
        notices: { select: { data: [publishedNotice], count: 1 } }
    });

    const response = await request(app)
        .get("/api/v1/notices/search?search=internship")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);

    const noticeCall = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeCall.filters.some((filter) => filter.column === "status" && filter.value === "PUBLISHED"));
});

test("a notice's eligibility can be checked directly", async () => {
    const { app } = buildStudentApp({
        notices: { select: { data: publishedNotice } }
    });

    const response = await request(app)
        .get(`/api/v1/notices/${NOTICE_ID}/eligibility`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.eligibility.status, "ELIGIBLE");
});

test("a student can save a published notice once", async () => {
    const { app, userClient } = buildStudentApp({
        notices: { select: { data: publishedNotice } },
        saved_notices: {
            insert: {
                data: { id: "save-1", notice_id: NOTICE_ID, user_id: STUDENT_ID }
            }
        }
    });

    const response = await request(app)
        .post(`/api/v1/notices/${NOTICE_ID}/save`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 201);

    const insertCall = userClient.calls.find((call) => call.table === "saved_notices" && call.method === "insert");
    assert.equal(insertCall.payload.user_id, STUDENT_ID);
});

test("saving the same notice twice returns a 409", async () => {
    const { app } = buildStudentApp({
        notices: { select: { data: publishedNotice } },
        saved_notices: {
            insert: { error: { code: "23505", message: "duplicate key" } }
        }
    });

    const response = await request(app)
        .post(`/api/v1/notices/${NOTICE_ID}/save`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 409);
});

test("a student can remove a saved notice", async () => {
    const { app } = buildStudentApp({
        saved_notices: { delete: { data: [{ id: "save-1" }] } }
    });

    const response = await request(app)
        .delete(`/api/v1/notices/${NOTICE_ID}/save`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
});

test("removing a notice that is not saved returns a 404", async () => {
    const { app } = buildStudentApp({
        saved_notices: { delete: { data: [] } }
    });

    const response = await request(app)
        .delete(`/api/v1/notices/${NOTICE_ID}/save`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 404);
});

test("saved notices are returned with their notice details", async () => {
    const { app } = buildStudentApp({
        saved_notices: {
            select: {
                data: [{ id: "save-1", notice_id: NOTICE_ID, notices: publishedNotice }],
                count: 1
            }
        }
    });

    const response = await request(app)
        .get("/api/v1/notices/saved")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].notices.title, "Summer Internship");
    assert.equal(response.body.data[0].notices.eligibility.status, "ELIGIBLE");
});

test("upcoming deadlines are scoped to the institution and flagged with eligibility", async () => {
    const { app, userClient } = buildStudentApp({
        notices: { select: { data: [publishedNotice] } }
    });

    const response = await request(app)
        .get("/api/v1/deadlines/upcoming?days=14&limit=5")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].eligibility.status, "ELIGIBLE");

    const noticeCall = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeCall.filters.some((filter) => filter.column === "deadline" && filter.op === "gte"));
});
