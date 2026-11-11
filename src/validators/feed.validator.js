import { z } from "zod";
import { NOTICE_CATEGORIES } from "../utils/constants.js";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format");

export const feedQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    category: z.enum(NOTICE_CATEGORIES).optional(),
    eligibility: z.enum(["ELIGIBLE", "POSSIBLY_ELIGIBLE", "NOT_ELIGIBLE"]).optional(),
    search: z.string().trim().min(1).max(200).optional(),
    sort: z.enum(["recent", "deadline"]).default("recent"),
    publishedFrom: dateOnly.optional(),
    publishedTo: dateOnly.optional(),
    deadlineFrom: dateOnly.optional(),
    deadlineTo: dateOnly.optional()
});

export const searchQuerySchema = feedQuerySchema.pick({
    page: true,
    limit: true,
    category: true,
    search: true,
    publishedFrom: true,
    publishedTo: true,
    deadlineFrom: true,
    deadlineTo: true
});

export const savedNoticeQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const notificationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const upcomingDeadlineQuerySchema = z.object({
    days: z.coerce.number().int().min(1).max(90).default(14),
    limit: z.coerce.number().int().min(1).max(50).default(10)
});
