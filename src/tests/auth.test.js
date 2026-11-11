import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildTestApp, STUDENT_ID } from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const payload = {
    name: "New Student",
    email: "new@example.com",
    password: "password123"
};

const profileRow = {
    id: STUDENT_ID,
    name: "New Student",
    email: "new@example.com",
    role: "STUDENT",
    institution_id: null
};

const buildRegisterApp = (signUpResponse) => {
    const adminClient = createMockSupabase({
        tables: {
            profiles: {
                select: { data: null },
                insert: { data: profileRow }
            }
        }
    });

    const publicClient = {
        auth: {
            signUp: async () => signUpResponse
        }
    };

    return buildTestApp({ adminClient, publicClient, userClient: adminClient });
};

test("registers a student when Supabase signup succeeds", async () => {
    const app = buildRegisterApp({
        data: { user: { id: STUDENT_ID, identities: [{ id: STUDENT_ID }] }, session: null },
        error: null
    });

    const response = await request(app).post("/api/v1/auth/register").send(payload);

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.role, "STUDENT");
    assert.equal(response.body.data.requiresEmailConfirmation, true);
    assert.equal(response.body.data.session, null);
});

test("returns 409 for a duplicate email identified by empty identities", async () => {
    const app = buildRegisterApp({
        data: { user: { id: STUDENT_ID, identities: [] }, session: null },
        error: null
    });

    const response = await request(app).post("/api/v1/auth/register").send(payload);

    assert.equal(response.status, 409);
    assert.equal(response.body.error, "Email already registered");
});

test("returns 409 when Supabase reports an existing account", async () => {
    const app = buildRegisterApp({
        data: { user: null, session: null },
        error: { message: "User already registered" }
    });

    const response = await request(app).post("/api/v1/auth/register").send(payload);

    assert.equal(response.status, 409);
});

test("returns 429 when Supabase throttles signup emails", async () => {
    const app = buildRegisterApp({
        data: { user: null, session: null },
        error: { message: "email rate limit exceeded" }
    });

    const response = await request(app).post("/api/v1/auth/register").send(payload);

    assert.equal(response.status, 429);
    assert.match(response.body.error, /try again later/i);
});

test("rejects invalid registration input with 400", async () => {
    const app = buildRegisterApp({ data: { user: null }, error: null });

    const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "A", email: "not-an-email", password: "short" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Validation failed");
});

test("logs a user in and returns tokens", async () => {
    const adminClient = createMockSupabase({
        tables: {
            profiles: { select: { data: profileRow } }
        }
    });

    const publicClient = {
        auth: {
            signInWithPassword: async () => ({
                data: {
                    user: { id: STUDENT_ID },
                    session: {
                        access_token: "access-token",
                        refresh_token: "refresh-token",
                        expires_at: 1234567890,
                        token_type: "bearer"
                    }
                },
                error: null
            })
        }
    };

    const app = buildTestApp({ adminClient, publicClient, userClient: adminClient });

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: payload.email, password: payload.password });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.email, payload.email);
    assert.equal(response.body.data.session.accessToken, "access-token");
    assert.equal(response.body.data.session.refreshToken, "refresh-token");
});

test("rejects invalid credentials with 401", async () => {
    const adminClient = createMockSupabase({});
    const publicClient = {
        auth: {
            signInWithPassword: async () => ({
                data: { user: null, session: null },
                error: { message: "Invalid login credentials" }
            })
        }
    };

    const app = buildTestApp({ adminClient, publicClient, userClient: adminClient });

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: payload.email, password: "wrong-password" });

    assert.equal(response.status, 401);
    assert.equal(response.body.error, "Invalid email or password");
});
