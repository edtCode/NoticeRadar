import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildTestApp, createUserClient, studentProfileRow, STUDENT_ID } from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";
import { env } from "../config/env.js";

const ENTRY_ID = "88888888-8888-4888-8888-888888888888";

const entryRow = {
    id: ENTRY_ID,
    title: "Google STEP internship",
    description: "Second-year internship, apply on the portal.",
    category: "INTERNSHIP",
    deadline: "2026-12-05T18:29:59.999Z",
    event_date: null,
    source: "MANUAL",
    source_email: null,
    file_name: null,
    file_size: null,
    created_at: "2026-11-12T10:00:00.000Z",
    updated_at: "2026-11-12T10:00:00.000Z"
};

const buildApp = (tables = {}, storage = {}) => {
    const userClient = createUserClient({
        profile: studentProfileRow,
        tables: { profiles: { select: { data: studentProfileRow } }, ...tables },
        storage
    });

    return {
        userClient,
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient })
    };
};

test("personal entries are listed for the signed-in user only", async () => {
    const { app, userClient } = buildApp({
        personal_entries: { select: { data: [entryRow] } }
    });

    const response = await request(app)
        .get("/api/v1/me/entries")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].title, "Google STEP internship");

    const entryCall = userClient.calls.find((call) => call.table === "personal_entries");
    assert.ok(entryCall.filters.some((filter) => filter.column === "user_id" && filter.value === STUDENT_ID));
});

test("a student can add their own notice or event", async () => {
    const { app, userClient } = buildApp({
        personal_entries: { insert: { data: entryRow } }
    });

    const response = await request(app)
        .post("/api/v1/me/entries")
        .set("Authorization", "Bearer valid-token")
        .send({ title: "  Google STEP internship  ", category: "INTERNSHIP", deadline: "2026-12-05T18:29:59.999Z" });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.id, ENTRY_ID);

    const insertCall = userClient.calls.find((call) => call.table === "personal_entries" && call.method === "insert");
    assert.equal(insertCall.payload.user_id, STUDENT_ID);
    assert.equal(insertCall.payload.title, "Google STEP internship");
    assert.equal(insertCall.payload.deadline, "2026-12-05T18:29:59.999Z");
});

test("pasted text is read into entry fields instead of being typed by the student", async () => {
    const originalFetch = globalThis.fetch;
    const originalKey = env.llm.apiKey;

    env.llm.apiKey = "test-key";
    globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            title: "TCS campus drive",
                            description: "Final-year CSE students, apply on the portal.",
                            category: "PLACEMENT",
                            deadline: "2026-12-10",
                            eventDate: null,
                            ambiguousFields: []
                        })
                    }
                }
            ]
        })
    });

    try {
        const { app } = buildApp();

        const response = await request(app)
            .post("/api/v1/me/entries/extract")
            .set("Authorization", "Bearer valid-token")
            .send({ text: "TCS campus drive for final year CSE students. Apply by 10 December 2026 on the portal." });

        assert.equal(response.status, 200);
        assert.equal(response.body.data.title, "TCS campus drive");
        assert.equal(response.body.data.category, "PLACEMENT");
        assert.equal(response.body.data.deadline, "2026-12-10");
    } finally {
        globalThis.fetch = originalFetch;
        env.llm.apiKey = originalKey;
    }
});

test("extraction needs either a PDF or a few lines of text", async () => {
    const { app } = buildApp();

    const response = await request(app)
        .post("/api/v1/me/entries/extract")
        .set("Authorization", "Bearer valid-token")
        .send({ text: "too short" });

    assert.equal(response.status, 400);
});

test("an entry without a title is rejected", async () => {
    const { app } = buildApp();

    const response = await request(app)
        .post("/api/v1/me/entries")
        .set("Authorization", "Bearer valid-token")
        .send({ description: "No title here" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Validation failed");
});

test("editing an entry that is not yours returns a 404", async () => {
    const { app } = buildApp({
        personal_entries: { select: { data: null } }
    });

    const response = await request(app)
        .patch(`/api/v1/me/entries/${ENTRY_ID}`)
        .set("Authorization", "Bearer valid-token")
        .send({ title: "Changed" });

    assert.equal(response.status, 404);
});

test("deleting an entry also removes its stored PDF", async () => {
    const { app, userClient } = buildApp(
        {
            personal_entries: {
                select: { data: { id: ENTRY_ID, file_path: `${STUDENT_ID}/${ENTRY_ID}/file.pdf` } },
                delete: { data: [{ id: ENTRY_ID }] }
            }
        },
        { remove: { data: null, error: null } }
    );

    const response = await request(app)
        .delete(`/api/v1/me/entries/${ENTRY_ID}`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);

    const removeCall = userClient.calls.find((call) => call.type === "storage" && call.action === "remove");
    assert.deepEqual(removeCall.paths, [`${STUDENT_ID}/${ENTRY_ID}/file.pdf`]);
});

test("a student can attach a PDF to their entry", async () => {
    const { app, userClient } = buildApp({
        personal_entries: {
            select: { data: { id: ENTRY_ID, file_path: null } },
            update: { data: { ...entryRow, source: "UPLOAD", file_name: "notice.pdf" } }
        }
    });

    const response = await request(app)
        .post(`/api/v1/me/entries/${ENTRY_ID}/file`)
        .set("Authorization", "Bearer valid-token")
        .attach("file", Buffer.from("%PDF-1.4 test"), { filename: "notice.pdf", contentType: "application/pdf" });

    assert.equal(response.status, 201);
    assert.match(response.body.data.signedUrl, /^https:\/\/storage\.example\//);
    assert.equal(response.body.data.entry.source, "UPLOAD");

    const uploadCall = userClient.calls.find((call) => call.type === "storage" && call.action === "upload");
    assert.ok(uploadCall.filePath.startsWith(`${STUDENT_ID}/${ENTRY_ID}/`));
});

test("a non-PDF attachment is rejected", async () => {
    const { app } = buildApp();

    const response = await request(app)
        .post(`/api/v1/me/entries/${ENTRY_ID}/file`)
        .set("Authorization", "Bearer valid-token")
        .attach("file", Buffer.from("plain text"), { filename: "notes.txt", contentType: "text/plain" });

    assert.equal(response.status, 400);
});
