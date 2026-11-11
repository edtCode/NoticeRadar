import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
    buildTestApp,
    createUserClient,
    studentProfileRow,
    adminProfileRow
} from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const buildApp = (userClient) => {
    return buildTestApp({ adminClient: createMockSupabase({}), userClient });
};

test("rejects requests without a bearer token", async () => {
    const app = buildApp(createUserClient({ profile: studentProfileRow }));

    const response = await request(app).get("/api/v1/auth/me");

    assert.equal(response.status, 401);
});

test("rejects an invalid or expired access token", async () => {
    const app = buildApp(createUserClient({ profile: studentProfileRow }));

    const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer expired-token");

    assert.equal(response.status, 401);
    assert.equal(response.body.error, "Invalid or expired access token");
});

test("returns 503 instead of 401 when the auth service is unreachable", async () => {
    const userClient = createMockSupabase({
        auth: {
            getUser: async () => ({
                data: { user: null },
                error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" }
            })
        }
    });
    const app = buildApp(userClient);

    const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 503);
    assert.equal(response.body.error, "Authentication service is temporarily unavailable");
});

test("returns the authenticated student profile", async () => {
    const app = buildApp(createUserClient({ profile: studentProfileRow }));

    const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.role, "STUDENT");
    assert.equal(response.body.data.institutionId, studentProfileRow.institution_id);
});

test("blocks a student from admin routes", async () => {
    const app = buildApp(createUserClient({ profile: studentProfileRow }));

    const response = await request(app)
        .get("/api/v1/admin/notices")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 403);
    assert.equal(response.body.error, "Admin access required");
});

test("allows an admin to list notices of their own institution", async () => {
    const userClient = createUserClient({
        profile: adminProfileRow,
        tables: {
            notices: { select: { data: [], count: 0 } }
        }
    });

    const app = buildApp(userClient);

    const response = await request(app)
        .get("/api/v1/admin/notices")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);
    assert.equal(response.body.pagination.total, 0);

    const noticeQuery = userClient.calls.find((call) => call.table === "notices");
    assert.equal(noticeQuery.filters[0].value, adminProfileRow.institution_id);
});
