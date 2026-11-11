import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { env } from "../config/env.js";
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
import { buildTextPdf } from "./helpers/pdfFixture.js";

const LOG_ID = "99999999-9999-4999-8999-999999999999";

const baseNotice = {
    id: NOTICE_ID,
    institution_id: INSTITUTION_ID,
    title: "Summer Internship",
    status: "DRAFT",
    review_status: "NOT_REVIEWED",
    extraction_status: "PENDING",
    file_path: "institution/notice/file.pdf",
    deadline: "2026-12-01T23:59:59.999Z"
};

const extraction = {
    title: "Summer Internship 2027",
    category: "INTERNSHIP",
    summary: "Two month internship for CSE students.",
    deadline: "2026-11-30",
    eligibleBranches: ["CSE"],
    minimumCPI: 7.5,
    minimumSemester: 4,
    maximumSemester: 6,
    eligibleGraduationYears: [2027],
    requiresNoBacklogs: true,
    requiredDocuments: ["Resume"],
    duration: "2 months",
    applicationUrl: null,
    ambiguousFields: [],
    evidence: [{ field: "deadline", pageNumber: 1, text: "Deadline 2026-11-30" }]
};

const buildAdminApp = (notice = baseNotice, { updateError = null } = {}) => {
    let current = { ...notice };
    const updates = [];

    const userClient = createUserClient({
        profile: adminProfileRow,
        tables: {
            profiles: { select: { data: adminProfileRow } },
            notices: {
                select: () => ({ data: { ...current } }),
                update: (record) => {
                    updates.push(record.payload);

                    if (updateError) {
                        return { error: updateError };
                    }

                    current = { ...current, ...record.payload };

                    return { data: { ...current } };
                }
            },
            notice_processing_logs: {
                insert: { data: { id: LOG_ID } },
                update: { data: { id: LOG_ID } }
            },
            notice_versions: {
                insert: { error: null }
            }
        },
        storage: {
            download: {
                data: new Blob([buildTextPdf("Summer internship deadline 2026-11-30 for CSE students with CPI 7.5.")]),
                error: null
            }
        }
    });

    return {
        app: buildTestApp({ adminClient: createMockSupabase({}), userClient }),
        userClient,
        updates,
        getCurrent: () => current
    };
};

const withAi = async (fakeFetch, run) => {
    const originalFetch = globalThis.fetch;
    const originalKey = env.llm.apiKey;

    env.llm.apiKey = "test-key";
    globalThis.fetch = fakeFetch;

    try {
        return await run();
    } finally {
        globalThis.fetch = originalFetch;
        env.llm.apiKey = originalKey;
    }
};

const aiResponse = (content) => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] })
});

test("processing extracts structured data and sends the notice to review", async () => {
    const { app, updates } = buildAdminApp();

    const response = await withAi(
        async () => aiResponse(JSON.stringify(extraction)),
        () => request(app)
            .post(`/api/v1/admin/notices/${NOTICE_ID}/process`)
            .set("Authorization", "Bearer valid-token")
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "COMPLETED");
    assert.equal(response.body.data.extraction.title, "Summer Internship 2027");

    const stored = updates.find((payload) => payload.extracted_data);
    assert.equal(stored.extracted_data.minimumCPI, 7.5);
    assert.deepEqual(stored.extraction_evidence, extraction.evidence);
    assert.equal(stored.review_status, "PENDING_REVIEW");
    assert.equal(stored.extraction_status, "COMPLETED");
});

test("processing never overwrites admin-approved data", async () => {
    const { app, updates } = buildAdminApp({
        ...baseNotice,
        review_status: "APPROVED",
        title: "Admin approved title"
    });

    await withAi(
        async () => aiResponse(JSON.stringify(extraction)),
        () => request(app)
            .post(`/api/v1/admin/notices/${NOTICE_ID}/process`)
            .set("Authorization", "Bearer valid-token")
    );

    const stored = updates.find((payload) => payload.extracted_data);

    assert.equal(stored.review_status, "APPROVED");
    assert.equal("title" in stored, false);
});

test("a notice can only be processed once at a time", async () => {
    const { app } = buildAdminApp({ ...baseNotice, extraction_status: "PROCESSING" });

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/process`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 409);
});

test("processing requires an uploaded PDF", async () => {
    const { app } = buildAdminApp({ ...baseNotice, file_path: null });

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/process`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 400);
});

test("a failed AI call marks the notice as failed and keeps the error readable", async () => {
    const { app, updates } = buildAdminApp();

    const response = await withAi(
        async () => ({ ok: false, status: 500, text: async () => "provider down" }),
        () => request(app)
            .post(`/api/v1/admin/notices/${NOTICE_ID}/process`)
            .set("Authorization", "Bearer valid-token")
    );

    assert.equal(response.status, 502);

    const stored = updates.find((payload) => payload.extraction_status === "FAILED");
    assert.ok(stored);
    assert.match(stored.extraction_error, /unavailable/i);
});

test("retry reprocesses a notice after a failure", async () => {
    const { app } = buildAdminApp({ ...baseNotice, extraction_status: "FAILED" });

    const response = await withAi(
        async () => aiResponse(JSON.stringify(extraction)),
        () => request(app)
            .post(`/api/v1/admin/notices/${NOTICE_ID}/retry`)
            .set("Authorization", "Bearer valid-token")
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "COMPLETED");
});

test("admins can read extraction details and processing logs", async () => {
    const { app, userClient } = buildAdminApp({
        ...baseNotice,
        extraction_status: "COMPLETED",
        review_status: "PENDING_REVIEW",
        extracted_data: extraction,
        extraction_evidence: extraction.evidence
    });

    userClient.tables.notice_processing_logs.select = {
        data: [{ id: LOG_ID, status: "COMPLETED", error_message: null }]
    };

    const response = await request(app)
        .get(`/api/v1/admin/notices/${NOTICE_ID}/extraction`)
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.extractedData.title, "Summer Internship 2027");
    assert.equal(response.body.data.logs.length, 1);
});

test("pending review only lists notices awaiting review", async () => {
    const { app, userClient } = buildAdminApp({
        ...baseNotice,
        review_status: "PENDING_REVIEW"
    });

    const response = await request(app)
        .get("/api/v1/admin/notices/pending-review")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);

    const noticeCall = userClient.calls.find((call) => call.table === "notices");
    assert.ok(noticeCall.filters.some((filter) => filter.column === "review_status" && filter.value === "PENDING_REVIEW"));
});

test("approving a notice records the reviewer and writes a version", async () => {
    const { app, userClient, getCurrent } = buildAdminApp({
        ...baseNotice,
        extraction_status: "COMPLETED",
        review_status: "PENDING_REVIEW"
    });

    const response = await request(app)
        .patch(`/api/v1/admin/notices/${NOTICE_ID}/review`)
        .set("Authorization", "Bearer valid-token")
        .send({ decision: "APPROVED", title: "Summer Internship 2027", minimumCPI: 7.5 });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.review_status, "APPROVED");
    assert.equal(response.body.data.reviewed_by, ADMIN_ID);
    assert.equal(getCurrent().minimum_cpi, 7.5);

    const versionCall = userClient.calls.find((call) => call.table === "notice_versions" && call.method === "insert");
    assert.ok(versionCall.payload.previous_data);
    assert.ok(versionCall.payload.updated_data);
});

test("rejecting a notice stores the rejection reason in the version history", async () => {
    const { app, userClient } = buildAdminApp({
        ...baseNotice,
        review_status: "PENDING_REVIEW"
    });

    const response = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/reject`)
        .set("Authorization", "Bearer valid-token")
        .send({ reviewNote: "Deadline is ambiguous" });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.review_status, "REJECTED");

    const versionCall = userClient.calls.find((call) => call.table === "notice_versions" && call.method === "insert");
    assert.equal(versionCall.payload.updated_data.reviewNote, "Deadline is ambiguous");
});

test("students cannot process or review notices", async () => {
    const userClient = createUserClient({ profile: studentProfileRow });
    const app = buildTestApp({ adminClient: createMockSupabase({}), userClient });

    const processResponse = await request(app)
        .post(`/api/v1/admin/notices/${NOTICE_ID}/process`)
        .set("Authorization", "Bearer valid-token");

    const reviewResponse = await request(app)
        .patch(`/api/v1/admin/notices/${NOTICE_ID}/review`)
        .set("Authorization", "Bearer valid-token")
        .send({ decision: "APPROVED" });

    assert.equal(processResponse.status, 403);
    assert.equal(reviewResponse.status, 403);
});
