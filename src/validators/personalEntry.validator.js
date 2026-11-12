import { z } from "zod";
import { NOTICE_CATEGORIES } from "../utils/constants.js";

const timestamp = z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Use a valid ISO date/time");

export const personalEntrySchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().trim().max(5000, "Description is too long").optional(),
    category: z.enum(NOTICE_CATEGORIES).default("GENERAL"),
    deadline: timestamp.nullable().optional(),
    eventDate: timestamp.nullable().optional(),
    source: z.enum(["MANUAL", "UPLOAD"]).default("MANUAL")
});

export const personalEntryUpdateSchema = personalEntrySchema.partial();

// Used when the student pastes text instead of uploading a PDF.
export const personalEntryTextSchema = z.object({
    text: z.string().trim().min(20, "Paste a few lines of the notice text").max(20000, "The pasted text is too long")
});

export const personalEntryQuerySchema = z.object({
    upcoming: z.coerce.number().int().min(1).max(365).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
});
