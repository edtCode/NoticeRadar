import { PDFParse } from "pdf-parse";
import { ApiError } from "../utils/errors.js";
import { NOTICE_FILES_BUCKET } from "../utils/constants.js";

const MINIMUM_TEXT_LENGTH = 20;

export const extractTextFromPdf = async (buffer) => {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
        const result = await parser.getText();

        const pages = (result.pages ?? []).map((page) => ({
            pageNumber: page.num,
            text: (page.text ?? "").trim()
        }));

        const totalCharacters = pages.reduce((total, page) => total + page.text.length, 0);
        const hasUsableText = pages.length > 0 && totalCharacters >= MINIMUM_TEXT_LENGTH;

        return {
            status: hasUsableText ? "COMPLETED" : "OCR_REQUIRED",
            pages,
            totalPages: pages.length,
            message: hasUsableText
                ? null
                : "No usable text was found in this PDF. It may be a scanned document that needs OCR."
        };

    } catch (error) {
        console.error("PDF extraction error:", error.message);
        throw new ApiError(422, "Could not read the PDF document");

    } finally {
        await parser.destroy();
    }
};

export const extractNoticeDocument = async (supabase, filePath) => {
    if (!filePath) {
        throw new ApiError(400, "This notice has no attached PDF");
    }

    const { data, error } = await supabase.storage
        .from(NOTICE_FILES_BUCKET)
        .download(filePath);

    if (error || !data) {
        console.error("Storage download error:", error);
        throw new ApiError(502, "Could not download the notice PDF from storage");
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    return extractTextFromPdf(buffer);
};
