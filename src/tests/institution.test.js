import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildTestApp, studentProfileRow, INSTITUTION_ID } from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const buildApp = (tables) => {
    const userClient = createMockSupabase({
        tables: {
            profiles: { select: { data: studentProfileRow } },
            ...tables
        },
        auth: {
            getUser: async () => ({ data: { user: { id: studentProfileRow.id } }, error: null })
        }
    });

    return { app: buildTestApp({ adminClient: createMockSupabase({}), userClient }), userClient };
};

test("lists institutions for an authenticated user", async () => {
    const institutions = [{ id: INSTITUTION_ID, name: "Example Institute", slug: "example" }];
    const { app, userClient } = buildApp({ institutions: { select: { data: institutions } } });

    const response = await request(app)
        .get("/api/v1/institutions")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, institutions);
    assert.equal(userClient.calls.some((call) => call.table === "institutions"), true);
});

test("lists only departments belonging to the requested institution", async () => {
    const departments = [{ id: "55555555-5555-4555-8555-555555555555", name: "Computer Science", institution_id: INSTITUTION_ID }];
    const { app, userClient } = buildApp({ departments: { select: { data: departments } } });

    const response = await request(app)
        .get(`/api/v1/institutions/${INSTITUTION_ID}/departments`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, departments);
    const query = userClient.calls.find((call) => call.table === "departments");
    assert.deepEqual(query.filters, [{ column: "institution_id", op: "eq", value: INSTITUTION_ID }]);
});

test("rejects an invalid institution identifier for department lookup", async () => {
    const { app } = buildApp({});
    const response = await request(app)
        .get("/api/v1/institutions/not-a-uuid/departments")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Invalid identifier");
});

test("searches institutions without requiring a session", async () => {
    const matches = [{
        id: INSTITUTION_ID,
        name: "Indian Institute of Technology Madras",
        city: "Chennai",
        state: "Tamil Nadu",
        institution_type: "INSTITUTE"
    }];
    const adminClient = createMockSupabase({
        rpc: { search_institutions: { data: matches } }
    });
    const app = buildTestApp({ adminClient });

    const response = await request(app).get("/api/v1/institutions/search?q=indian inst");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, matches);

    const call = adminClient.calls.find((entry) => entry.type === "rpc");
    assert.equal(call.function, "search_institutions");
    assert.deepEqual(call.params, { search_query: "indian inst", max_results: 8 });
});

test("rejects an empty institution search query", async () => {
    const { app } = buildApp({});
    const response = await request(app).get("/api/v1/institutions/search?q=%20%20");

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Validation failed");
});

test("a student can submit an institution request for review", async () => {
    const created = {
        id: "88888888-8888-4888-8888-888888888888",
        name: "New Institute",
        city: "Pune",
        state: "Maharashtra",
        institution_type: "COLLEGE",
        status: "PENDING",
        created_at: "2026-11-13T00:00:00.000Z"
    };
    const { app, userClient } = buildApp({
        institution_requests: { insert: { data: created } }
    });

    const response = await request(app)
        .post("/api/v1/institutions/requests")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "New Institute", city: "Pune", state: "Maharashtra", institutionType: "COLLEGE" });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.data, created);

    const insert = userClient.calls.find((call) => call.table === "institution_requests");
    assert.equal(insert.method, "insert");
    assert.equal(insert.payload.requested_by, studentProfileRow.id);
    assert.equal(insert.payload.institution_type, "COLLEGE");
});

test("institution requests require authentication", async () => {
    const { app } = buildApp({});
    const response = await request(app)
        .post("/api/v1/institutions/requests")
        .send({ name: "New Institute" });

    assert.equal(response.status, 401);
});
