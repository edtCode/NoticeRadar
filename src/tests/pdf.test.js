import test from "node:test";
import assert from "node:assert/strict";
import { extractTextFromPdf, extractNoticeDocument } from "../services/pdf.service.js";
import { ApiError } from "../utils/errors.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";
import { buildTextPdf } from "./helpers/pdfFixture.js";

test("text is extracted from a PDF document", async () => {
    const pdf = buildTextPdf("Summer internship 2027 applications close on 30 November 2026.");

    const result = await extractTextFromPdf(pdf);

    assert.equal(result.status, "COMPLETED");
    assert.equal(result.totalPages, 1);
    assert.match(result.pages[0].text, /Summer internship 2027/);
});

test("a PDF without usable text is flagged for OCR", async () => {
    const result = await extractTextFromPdf(buildTextPdf("hi"));

    assert.equal(result.status, "OCR_REQUIRED");
    assert.match(result.message, /OCR/);
});

test("a corrupted PDF is rejected with a 422", async () => {
    await assert.rejects(
        () => extractTextFromPdf(Buffer.from("this is not a pdf")),
        (error) => error instanceof ApiError && error.status === 422
    );
});

test("the notice PDF is downloaded from the notice-files bucket", async () => {
    const pdf = buildTextPdf("Scholarship applications close on 15 December 2026 for all branches.");
    const supabase = createMockSupabase({
        storage: {
            download: {
                data: new Blob([pdf]),
                error: null
            }
        }
    });

    const result = await extractNoticeDocument(supabase, "institution/notice/file.pdf");
    const storageCall = supabase.calls.find((call) => call.type === "storage");

    assert.equal(result.status, "COMPLETED");
    assert.equal(storageCall.bucket, "notice-files");
    assert.equal(storageCall.action, "download");
});

test("a storage failure surfaces as a 502 without leaking details", async () => {
    const supabase = createMockSupabase({
        storage: { download: { data: null, error: { message: "secret internal detail" } } }
    });

    await assert.rejects(
        () => extractNoticeDocument(supabase, "institution/notice/file.pdf"),
        (error) => error instanceof ApiError && error.status === 502 && !error.message.includes("secret")
    );
});
