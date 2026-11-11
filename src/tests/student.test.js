import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
    buildTestApp,
    createUserClient,
    studentProfileRow,
    STUDENT_ID,
    INSTITUTION_ID,
    DEPARTMENT_ID,
    OTHER_INSTITUTION_ID
} from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const validPayload = {
    institutionId: INSTITUTION_ID,
    departmentId: DEPARTMENT_ID,
    branch: "Computer Science",
    semester: 5,
    cpi: 8.4,
    graduationYear: 2028,
    activeBacklogs: 0,
    interests: ["internships", "research"]
};

const institutionRow = { id: INSTITUTION_ID };
const departmentRow = { id: DEPARTMENT_ID, institution_id: INSTITUTION_ID };

const buildStudentApp = ({ tables, profile = studentProfileRow }) => {
    const userClient = createUserClient({ profile, tables });

    return {
        userClient,
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient })
    };
};

test("creates a valid student profile for the authenticated user", async () => {
    const { app, userClient } = buildStudentApp({
        tables: {
            institutions: { select: { data: institutionRow } },
            departments: { select: { data: departmentRow } },
            student_profiles: {
                insert: {
                    data: {
                        id: "99999999-9999-4999-8999-999999999999",
                        user_id: STUDENT_ID,
                        department_id: DEPARTMENT_ID
                    }
                }
            },
            profiles: {
                select: { data: studentProfileRow },
                update: { data: studentProfileRow }
            }
        }
    });

    const response = await request(app)
        .post("/api/v1/students/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ ...validPayload, user_id: "88888888-8888-4888-8888-888888888888" });

    assert.equal(response.status, 201);

    const insertCall = userClient.calls.find(
        (call) => call.table === "student_profiles" && call.method === "insert"
    );

    assert.equal(insertCall.payload.user_id, STUDENT_ID);
    assert.equal(insertCall.payload.department_id, DEPARTMENT_ID);
    assert.equal(insertCall.payload.cpi, 8.4);
});

test("rejects a CPI outside the allowed range", async () => {
    const { app } = buildStudentApp({ tables: {} });

    const response = await request(app)
        .post("/api/v1/students/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ ...validPayload, cpi: 12 });

    assert.equal(response.status, 400);
});

test("rejects an invalid semester", async () => {
    const { app } = buildStudentApp({ tables: {} });

    const response = await request(app)
        .post("/api/v1/students/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ ...validPayload, semester: 9 });

    assert.equal(response.status, 400);
});

test("rejects a department from another institution", async () => {
    const { app } = buildStudentApp({
        tables: {
            institutions: { select: { data: institutionRow } },
            departments: { select: { data: { id: DEPARTMENT_ID, institution_id: OTHER_INSTITUTION_ID } } }
        }
    });

    const response = await request(app)
        .post("/api/v1/students/profile")
        .set("Authorization", "Bearer valid-token")
        .send(validPayload);

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Department does not belong to the selected institution");
});

test("reads only the authenticated user's profile", async () => {
    const { app, userClient } = buildStudentApp({
        tables: {
            profiles: {
                select: { data: { ...studentProfileRow, student_profiles: [] } }
            }
        }
    });

    const response = await request(app)
        .get("/api/v1/students/profile")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);

    const profileQuery = userClient.calls.find((call) => call.table === "profiles");
    assert.deepEqual(profileQuery.filters, [{ column: "id", op: "eq", value: STUDENT_ID }]);
});

test("updates only the authenticated user's student profile", async () => {
    const { app, userClient } = buildStudentApp({
        tables: {
            institutions: { select: { data: institutionRow } },
            departments: { select: { data: departmentRow } },
            student_profiles: {
                select: { data: { id: "99999999-9999-4999-8999-999999999999", user_id: STUDENT_ID, department_id: DEPARTMENT_ID } },
                update: { data: { id: "99999999-9999-4999-8999-999999999999", user_id: STUDENT_ID, cpi: 9.1 } }
            },
            profiles: {
                select: { data: studentProfileRow },
                update: { data: studentProfileRow }
            }
        }
    });

    const response = await request(app)
        .patch("/api/v1/students/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ cpi: 9.1 });

    assert.equal(response.status, 200);

    const updateCall = userClient.calls.find(
        (call) => call.table === "student_profiles" && call.method === "update"
    );

    assert.deepEqual(updateCall.filters, [{ column: "user_id", op: "eq", value: STUDENT_ID }]);
});
