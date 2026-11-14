import { PDFParse } from "pdf-parse";
import { ApiError } from "../utils/errors.js";
import { NOTICE_FILES_BUCKET } from "../utils/constants.js";
import { transcribePageImage } from "./ai.service.js";

const MINIMUM_TEXT_LENGTH = 20;
const MINIMUM_PAGE_TEXT_LENGTH = 20;
const MAX_OCR_PAGES = 10;
const OCR_RENDER_SCALE = 2;

// A page with no (or almost no) text layer is a scan or a photo pasted into the
// PDF. Render it to an image so the vision model can read what the text layer
// could not.
const ocrPage = async (parser, pageNumber) => {
    const screenshots = await parser.getScreenshot({
        first: pageNumber,
        last: pageNumber,
        scale: OCR_RENDER_SCALE,
        imageBuffer: false,
        imageDataUrl: true
    });

    const image = screenshots.pages?.[0];

    if (!image?.dataUrl) {
        return "";
    }

    return transcribePageImage(image.dataUrl);
};

export const extractTextFromPdf = async (buffer) => {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
        const result = await parser.getText();

        const pages = (result.pages ?? []).map((page) => ({
            pageNumber: page.num,
            text: (page.text ?? "").trim()
        }));

        const ocrCandidates = pages
            .filter((page) => page.text.length < MINIMUM_PAGE_TEXT_LENGTH)
            .slice(0, MAX_OCR_PAGES);

        let ocrError = null;

        for (const page of ocrCandidates) {
            try {
                const ocrText = await ocrPage(parser, page.pageNumber);

                if (ocrText) {
                    page.text = ocrText;
                    page.ocr = true;
                }
            } catch (error) {
                ocrError = error;
                console.error("PDF OCR error:", error.message);
            }
        }

        const totalCharacters = pages.reduce((total, page) => total + page.text.length, 0);
        const hasUsableText = pages.length > 0 && totalCharacters >= MINIMUM_TEXT_LENGTH;
        const usedOcr = pages.some((page) => page.ocr);

        return {
            status: hasUsableText ? "COMPLETED" : "OCR_REQUIRED",
            pages,
            totalPages: pages.length,
            ocrPages: pages.filter((page) => page.ocr).map((page) => page.pageNumber),
            usedOcr,
            message: hasUsableText
                ? null
                : ocrError
                    ? `No readable text was found in this PDF and OCR could not run: ${ocrError.message}`
                    : "No readable text was found in this PDF, even after OCR. The file may be blank, corrupted or a scan that is too unclear to read."
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
