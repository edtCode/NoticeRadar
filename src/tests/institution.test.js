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
