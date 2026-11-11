import path from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError, databaseError } from "../utils/errors.js";
import { NOTICE_FILES_BUCKET } from "../utils/constants.js";
import { getAdminNotice, getPublishedNotice } from "./notice.service.js";

const SIGNED_URL_TTL = 600;
const PDF_SIGNATURE = "%PDF-";

const safeFileName = (name) => {
    return path.basename(name || "document.pdf").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 200);
};

const isPdf = (file) => {
    return file?.mimetype === "application/pdf" &&
        file.buffer?.subarray(0, PDF_SIGNATURE.length).toString("latin1") === PDF_SIGNATURE;
};

const createSignedUrl = async (supabase, filePath) => {
    const { data, error } = await supabase.storage
        .from(NOTICE_FILES_BUCKET)
        .createSignedUrl(filePath, SIGNED_URL_TTL);

    if (error || !data?.signedUrl) {
        console.error("Signed URL error:", error);
        throw new ApiError(500, "Could not create a download link");
    }

    return data.signedUrl;
};

export const uploadNoticeFile = async (supabase, noticeId, institutionId, file) => {
    if (!file) {
        throw new ApiError(400, "A PDF file is required");
    }

    if (!isPdf(file)) {
        throw new ApiError(400, "Only valid PDF files are allowed");
    }

    const notice = await getAdminNotice(supabase, noticeId, institutionId);
    const filePath = `${institutionId}/${notice.id}/${randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
        .from(NOTICE_FILES_BUCKET)
        .upload(filePath, file.buffer, {
            contentType: "application/pdf",
            upsert: false
        });

    if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new ApiError(500, "Could not upload the file");
    }

    const { data, error } = await supabase
        .from("notices")
        .update({
            file_path: filePath,
            file_name: safeFileName(file.originalname),
            file_size: file.size
        })
        .eq("id", notice.id)
        .eq("institution_id", institutionId)
        .select("id, file_path, file_name, file_size, updated_at")
        .single();

    if (error) {
        await supabase.storage.from(NOTICE_FILES_BUCKET).remove([filePath]);
        throw databaseError(error);
    }

    return {
        notice: data,
        signedUrl: await createSignedUrl(supabase, filePath),
        expiresIn: SIGNED_URL_TTL
    };
};

export const getAdminNoticeFileUrl = async (supabase, noticeId, institutionId) => {
    const notice = await getAdminNotice(supabase, noticeId, institutionId);

    if (!notice.file_path) {
        throw new ApiError(404, "No file attached to this notice");
    }

    return {
        signedUrl: await createSignedUrl(supabase, notice.file_path),
        fileName: notice.file_name,
        expiresIn: SIGNED_URL_TTL
    };
};

export const getPublishedNoticeFileUrl = async (supabase, noticeId, institutionId) => {
    const notice = await getPublishedNotice(supabase, noticeId, institutionId);

    if (!notice.file_path) {
        throw new ApiError(404, "No file attached to this notice");
    }

    return {
        signedUrl: await createSignedUrl(supabase, notice.file_path),
        fileName: notice.file_name,
        expiresIn: SIGNED_URL_TTL
    };
};
