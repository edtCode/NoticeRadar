import { ApiError, databaseError } from "../utils/errors.js";
import { extractNoticeDocument } from "./pdf.service.js";
import { extractNoticeFromText } from "./ai.service.js";
import { getAdminNotice } from "./notice.service.js";

const PROCESSING_COLUMNS = `
    id,
    institution_id,
    file_path,
    status,
    review_status,
    extraction_status,
    extracted_data
`;

const nowIso = () => new Date().toISOString();

const shorten = (message, maxLength = 500) => {
    if (!message) {
        return null;
    }

    return message.length > maxLength ? `${message.slice(0, maxLength)}...` : message;
};

export const startProcessingLog = async (supabase, noticeId) => {
    const { data, error } = await supabase
        .from("notice_processing_logs")
        .insert({
            notice_id: noticeId,
            status: "PROCESSING",
            started_at: nowIso()
        })
        .select("id")
        .single();

    if (error) {
        console.error("Could not create processing log:", error);
        return null;
    }

    return data;
};

export const finishProcessingLog = async (supabase, logId, status, errorMessage = null) => {
    if (!logId) {
        return;
    }

    const { error } = await supabase
        .from("notice_processing_logs")
        .update({
            status,
            error_message: shorten(errorMessage),
            completed_at: nowIso()
        })
        .eq("id", logId);

    if (error) {
        console.error("Could not update processing log:", error);
    }
};

const claimNotice = async (supabase, noticeId, institutionId) => {
    const { data, error } = await supabase
        .from("notices")
        .update({
            extraction_status: "PROCESSING",
            extraction_error: null
        })
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .neq("extraction_status", "PROCESSING")
        .select(PROCESSING_COLUMNS)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(409, "This notice is already being processed");
    }

    return data;
};

const storeExtractionResult = async (supabase, noticeId, institutionId, fields) => {
    const { data, error } = await supabase
        .from("notices")
        .update(fields)
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .select(`
            id,
            title,
            status,
            review_status,
            extraction_status,
            extraction_error,
            extracted_at,
            extracted_data,
            extraction_evidence
        `)
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const processNotice = async (supabase, noticeId, institutionId) => {
    const notice = await getAdminNotice(supabase, noticeId, institutionId);

    if (!notice.file_path) {
        throw new ApiError(400, "Upload a PDF before processing this notice");
    }

    if (notice.extraction_status === "PROCESSING") {
        throw new ApiError(409, "This notice is already being processed");
    }

    await claimNotice(supabase, noticeId, institutionId);

    const log = await startProcessingLog(supabase, noticeId);
    const keepApproved = notice.review_status === "APPROVED";

    try {
        const document = await extractNoticeDocument(supabase, notice.file_path);

        if (document.status === "OCR_REQUIRED") {
            const updated = await storeExtractionResult(supabase, noticeId, institutionId, {
                extraction_status: "OCR_REQUIRED",
                extraction_error: document.message,
                extracted_at: nowIso(),
                review_status: keepApproved ? "APPROVED" : "PENDING_REVIEW"
            });

            await finishProcessingLog(supabase, log?.id, "OCR_REQUIRED", document.message);

            return {
                notice: updated,
                extraction: null,
                status: "OCR_REQUIRED",
                message: document.message
            };
        }

        const extraction = await extractNoticeFromText(document.pages);

        const updated = await storeExtractionResult(supabase, noticeId, institutionId, {
            extraction_status: "COMPLETED",
            extraction_error: null,
            extracted_at: nowIso(),
            extracted_data: extraction,
            extraction_evidence: extraction.evidence,
            review_status: keepApproved ? "APPROVED" : "PENDING_REVIEW"
        });

        await finishProcessingLog(supabase, log?.id, "COMPLETED");

        return {
            notice: updated,
            extraction,
            status: "COMPLETED",
            message: null
        };
    } catch (error) {
        const message = error instanceof ApiError ? error.message : "Extraction failed";

        await storeExtractionResult(supabase, noticeId, institutionId, {
            extraction_status: "FAILED",
            extraction_error: shorten(message),
            extracted_at: nowIso()
        }).catch((storeError) => {
            console.error("Could not store extraction failure:", storeError);
        });

        await finishProcessingLog(supabase, log?.id, "FAILED", message);

        throw error;
    }
};
