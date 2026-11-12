import path from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError, databaseError } from "../utils/errors.js";
import { PERSONAL_FILES_BUCKET } from "../utils/constants.js";
import { isPdf } from "./storage.service.js";
import { extractTextFromPdf } from "./pdf.service.js";
import { extractPersonalEntryFromText } from "./ai.service.js";

const SIGNED_URL_TTL = 600;
const MINIMUM_TEXT_LENGTH = 20;
const MAXIMUM_TEXT_LENGTH = 20000;

const ENTRY_COLUMNS = `
    id,
    title,
    description,
    category,
    deadline,
    event_date,
    source,
    source_email,
    file_name,
    file_size,
    created_at,
    updated_at
`;

const safeFileName = (name) => {
    return path.basename(name || "document.pdf").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 200);
};

const toRow = (payload) => {
    return Object.fromEntries(
        Object.entries({
            title: payload.title,
            description: payload.description,
            category: payload.category,
            deadline: payload.deadline,
            event_date: payload.eventDate,
            source: payload.source
        }).filter(([, value]) => value !== undefined)
    );
};

const createSignedUrl = async (supabase, filePath) => {
    const { data, error } = await supabase.storage
        .from(PERSONAL_FILES_BUCKET)
        .createSignedUrl(filePath, SIGNED_URL_TTL);

    if (error || !data?.signedUrl) {
        console.error("Signed URL error:", error);
        throw new ApiError(500, "Could not create a download link");
    }

    return data.signedUrl;
};

const getOwnedEntry = async (supabase, userId, entryId) => {
    const { data, error } = await supabase
        .from("personal_entries")
        .select("id, file_path")
        .eq("id", entryId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Entry not found");
    }

    return data;
};

export const listPersonalEntries = async (supabase, userId, { upcoming, limit }) => {
    let query = supabase
        .from("personal_entries")
        .select(ENTRY_COLUMNS)
        .eq("user_id", userId);

    if (upcoming) {
        const now = new Date().toISOString();
        const until = new Date(Date.now() + upcoming * 24 * 60 * 60 * 1000).toISOString();

        query = query.gte("deadline", now).lte("deadline", until);
    }

    const { data, error } = await query
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(limit);

    if (error) {
        throw databaseError(error);
    }

    return data ?? [];
};

// Reads the uploaded PDF (or the pasted text) and returns the form fields, so
// the student only reviews and saves instead of typing everything by hand.
export const draftPersonalEntryFromSource = async ({ file, text }) => {
    let pages;

    if (file) {
        if (!isPdf(file)) {
            throw new ApiError(400, "Only valid PDF files are allowed");
        }

        const document = await extractTextFromPdf(file.buffer);

        if (document.status === "OCR_REQUIRED") {
            throw new ApiError(422, document.message);
        }

        pages = document.pages;
    } else {
        const value = (text ?? "").trim();

        if (value.length < MINIMUM_TEXT_LENGTH) {
            throw new ApiError(400, "Upload a PDF or paste a few lines of the notice text");
        }

        if (value.length > MAXIMUM_TEXT_LENGTH) {
            throw new ApiError(400, "The pasted text is too long");
        }

        pages = [{ pageNumber: 1, text: value }];
    }

    const extraction = await extractPersonalEntryFromText(pages);

    return {
        title: extraction.title ?? "",
        description: extraction.description ?? "",
        category: extraction.category ?? "GENERAL",
        deadline: extraction.deadline,
        eventDate: extraction.eventDate,
        ambiguousFields: extraction.ambiguousFields
    };
};

export const createPersonalEntry = async (supabase, userId, payload) => {
    const { data, error } = await supabase
        .from("personal_entries")
        .insert({ user_id: userId, ...toRow(payload) })
        .select(ENTRY_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const updatePersonalEntry = async (supabase, userId, entryId, payload) => {
    await getOwnedEntry(supabase, userId, entryId);

    const { data, error } = await supabase
        .from("personal_entries")
        .update(toRow(payload))
        .eq("id", entryId)
        .eq("user_id", userId)
        .select(ENTRY_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const deletePersonalEntry = async (supabase, userId, entryId) => {
    const entry = await getOwnedEntry(supabase, userId, entryId);

    if (entry.file_path) {
        const { error: removeError } = await supabase.storage
            .from(PERSONAL_FILES_BUCKET)
            .remove([entry.file_path]);

        if (removeError) {
            console.error("Personal file delete error:", removeError);
        }
    }

    const { error } = await supabase
        .from("personal_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", userId);

    if (error) {
        throw databaseError(error);
    }

    return { id: entryId };
};

export const uploadPersonalEntryFile = async (supabase, userId, entryId, file) => {
    if (!file) {
        throw new ApiError(400, "A PDF file is required");
    }

    if (!isPdf(file)) {
        throw new ApiError(400, "Only valid PDF files are allowed");
    }

    await getOwnedEntry(supabase, userId, entryId);

    const filePath = `${userId}/${entryId}/${randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
        .from(PERSONAL_FILES_BUCKET)
        .upload(filePath, file.buffer, {
            contentType: "application/pdf",
            upsert: false
        });

    if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new ApiError(500, "Could not upload the file");
    }

    const { data, error } = await supabase
        .from("personal_entries")
        .update({
            file_path: filePath,
            file_name: safeFileName(file.originalname),
            file_size: file.size,
            source: "UPLOAD"
        })
        .eq("id", entryId)
        .eq("user_id", userId)
        .select(ENTRY_COLUMNS)
        .single();

    if (error) {
        await supabase.storage.from(PERSONAL_FILES_BUCKET).remove([filePath]);
        throw databaseError(error);
    }

    return {
        entry: data,
        signedUrl: await createSignedUrl(supabase, filePath),
        expiresIn: SIGNED_URL_TTL
    };
};

export const getPersonalEntryFileUrl = async (supabase, userId, entryId) => {
    const entry = await getOwnedEntry(supabase, userId, entryId);

    if (!entry.file_path) {
        throw new ApiError(404, "No PDF attached to this entry");
    }

    return {
        signedUrl: await createSignedUrl(supabase, entry.file_path),
        expiresIn: SIGNED_URL_TTL
    };
};
