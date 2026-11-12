import test from "node:test";
import assert from "node:assert/strict";
import { extractNoticeFromText, extractPersonalEntryFromText } from "../services/ai.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

const pages = [
    { pageNumber: 1, text: "Summer internship. Deadline 2026-11-30. CSE students with CPI 7.5." }
];

const extraction = {
    title: "Summer Internship 2027",
    category: "INTERNSHIP",
    summary: "A summer internship for CSE students.",
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

const withFetch = async (fakeFetch, run) => {
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

const completionResponse = (content) => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] })
});

test("valid AI JSON is parsed into structured notice data", async () => {
    let requestBody;

    const result = await withFetch(
        async (url, options) => {
            requestBody = JSON.parse(options.body);
            return completionResponse(JSON.stringify(extraction));
        },
        () => extractNoticeFromText(pages)
    );

    assert.equal(result.title, "Summer Internship 2027");
    assert.equal(result.deadline, "2026-11-30");
    assert.equal(requestBody.model.length > 0, true);
    assert.equal(requestBody.messages[0].role, "system");
    assert.match(requestBody.messages[1].content, /Summer internship/);
});

test("JSON wrapped in markdown fences is accepted", async () => {
    const result = await withFetch(
        async () => completionResponse(`\`\`\`json\n${JSON.stringify(extraction)}\n\`\`\``),
        () => extractNoticeFromText(pages)
    );

    assert.equal(result.category, "INTERNSHIP");
});

test("object-shaped evidence from the provider is normalised into the expected array", async () => {
    const objectEvidence = {
        ...extraction,
        category: "internship",
        evidence: { deadline: "Deadline 2026-11-30", summary: { pageNumber: 2, text: "Summer internship" } }
    };

    const result = await withFetch(
        async () => completionResponse(JSON.stringify(objectEvidence)),
        () => extractNoticeFromText(pages)
    );

    assert.equal(result.category, "INTERNSHIP");
    assert.deepEqual(result.evidence, [
        { field: "deadline", pageNumber: null, text: "Deadline 2026-11-30" },
        { field: "summary", pageNumber: 2, text: "Summer internship" }
    ]);
});

test("personal entry extraction keeps only the fields the student edits", async () => {
    let requestBody;

    const personal = {
        title: "TCS campus drive",
        description: "Open to final-year CSE students. Apply on the portal.",
        category: "placement",
        deadline: "2026-12-10",
        eventDate: "2026-12-15",
        ambiguousFields: [],
        evidence: [{ field: "deadline", pageNumber: 1, text: "10 December 2026" }]
    };

    const result = await withFetch(
        async (url, options) => {
            requestBody = JSON.parse(options.body);
            return completionResponse(JSON.stringify(personal));
        },
        () => extractPersonalEntryFromText(pages)
    );

    assert.equal(result.title, "TCS campus drive");
    assert.equal(result.category, "PLACEMENT");
    assert.equal(result.deadline, "2026-12-10");
    assert.equal(result.eventDate, "2026-12-15");
    assert.match(requestBody.messages[0].content, /eventDate/);
});

test("malformed AI JSON is rejected with a 422", async () => {
    await withFetch(
        async () => completionResponse("not json at all"),
        async () => {
            await assert.rejects(
                () => extractNoticeFromText(pages),
                (error) => error instanceof ApiError && error.status === 422
            );
        }
    );
});

test("AI output that violates the schema is rejected", async () => {
    const invalid = { ...extraction, category: "GOSSIP" };

    await withFetch(
        async () => completionResponse(JSON.stringify(invalid)),
        async () => {
            await assert.rejects(
                () => extractNoticeFromText(pages),
                (error) => error instanceof ApiError && error.status === 422
            );
        }
    );
});

test("missing AI credentials fail with a 503 without calling the provider", async () => {
    const originalKey = env.llm.apiKey;
    const originalFetch = globalThis.fetch;
    let called = false;

    env.llm.apiKey = undefined;
    globalThis.fetch = async () => {
        called = true;
        throw new Error("should not be called");
    };

    try {
        await assert.rejects(
            () => extractNoticeFromText(pages),
            (error) => error instanceof ApiError && error.status === 503
        );
        assert.equal(called, false);
    } finally {
        env.llm.apiKey = originalKey;
        globalThis.fetch = originalFetch;
    }
});

test("rate limiting is retried and then reported as a 503", async () => {
    let attempts = 0;

    await withFetch(
        async () => {
            attempts += 1;
            return { ok: false, status: 429, text: async () => "slow down" };
        },
        async () => {
            await assert.rejects(
                () => extractNoticeFromText(pages),
                (error) => error instanceof ApiError && error.status === 503
            );
        }
    );

    assert.equal(attempts, 2);
});
