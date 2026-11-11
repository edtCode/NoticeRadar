import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
    buildTestApp,
    createUserClient,
    adminProfileRow,
    studentProfileRow,
    INSTITUTION_ID,
    NOTICE_ID
} from "./helpers/testApp.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";

const pdfBuffer = Buffer.from("%PDF-1.4\n% test document\n");
const noticeRow = {
    id: NOTICE_ID,
    institution_id: INSTITUTION_ID,
    title: "Internship",
    status: "PUBLISHED"
};

const buildApp = ({ profile = adminProfileRow, notices } = {}) => {
    const userClient = createUserClient({
        profile,
        tables: {
            notices: notices ?? {
                select: { data: noticeRow },
                update: {
                    data: {
                        id: NOTICE_ID,
                        file_path: `${INSTITUTION_ID}/${NOTICE_ID}/file.pdf`,
                        file_name: "notice.pdf",
                        file_size: pdfBuffer.length
                    }
                }
            }
        }
    });

    return {
        userClient,
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient })
    };
};

test("an admin uploads a valid PDF and receives a signed URL", async () => {
    const { app, userClient } = buildApp();

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/file`)
        .set("Authorization", "Bearer valid-token")
        .attach("file", pdfBuffer, { filename: "notice.pdf", contentType: "application/pdf" });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.expiresIn, 600);
    assert.ok(response.body.data.signedUrl.startsWith("https://"));

    const uploadCall = userClient.calls.find((call) => call.action === "upload");
    assert.equal(uploadCall.bucket, "notice-files");
    assert.ok(uploadCall.filePath.startsWith(`${INSTITUTION_ID}/${NOTICE_ID}/`));

    const updateCall = userClient.calls.find((call) => call.method === "update");
    assert.equal(updateCall.payload.file_name, "notice.pdf");
});

test("rejects a non-PDF upload", async () => {
    const { app } = buildApp();

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/file`)
        .set("Authorization", "Bearer valid-token")
        .attach("file", Buffer.from("plain text"), { filename: "notes.txt", contentType: "text/plain" });

    assert.equal(response.status, 400);
});

test("rejects a PDF larger than the upload limit", async () => {
    const { app } = buildApp();
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, "a");

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/file`)
        .set("Authorization", "Bearer valid-token")
        .attach("file", oversized, { filename: "large.pdf", contentType: "application/pdf" });

    assert.equal(response.status, 413);
});

test("blocks a student from uploading a notice file", async () => {
    const { app } = buildApp({ profile: studentProfileRow });

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/file`)
        .set("Authorization", "Bearer valid-token")
        .attach("file", pdfBuffer, { filename: "notice.pdf", contentType: "application/pdf" });

    assert.equal(response.status, 403);
});

test("an admin gets a signed URL for an attached file", async () => {
    const { app } = buildApp({
        notices: {
            select: {
                data: {
                    ...noticeRow,
                    file_path: `${INSTITUTION_ID}/${NOTICE_ID}/file.pdf`,
                    file_name: "notice.pdf"
                }
            }
        }
    });

    const response = await request(app)
        .get(`/api/v1/admin/notices/${NOTICE_ID}/file`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.fileName, "notice.pdf");
    assert.ok(response.body.data.signedUrl.startsWith("https://"));
});

test("returns 404 when no file is attached", async () => {
    const { app } = buildApp({ notices: { select: { data: noticeRow } } });

    const response = await request(app)
        .get(`/api/v1/admin/notices/${NOTICE_ID}/file`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 404);
});
