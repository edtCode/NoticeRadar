import { z } from "zod";
import { NOTICE_CATEGORIES, NOTICE_STATUSES } from "../utils/constants.js";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format");

const noticeFieldsSchema = z.object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(1).max(10000),
    category: z.enum(NOTICE_CATEGORIES),
    summary: z.string().trim().max(2000).nullable().optional(),
    applicationUrl: z.string().trim().url().max(500).nullable().optional(),
    sourceUrl: z.string().trim().url().max(500).nullable().optional(),
    deadline: z.union([z.string().datetime({ offset: true }), dateOnly]).nullable().optional(),
    eligibleBranches: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
    minimumCPI: z.coerce.number().min(0).max(10).nullable().optional(),
    minimumSemester: z.coerce.number().int().min(1).max(8).nullable().optional(),
    maximumSemester: z.coerce.number().int().min(1).max(8).nullable().optional(),
    eligibleGraduationYears: z.array(z.coerce.number().int().min(2000).max(2100)).max(20).optional(),
    requiresNoBacklogs: z.boolean().nullable().optional(),
    requiredDocuments: z.array(z.string().trim().min(1).max(150)).max(20).optional(),
    duration: z.string().trim().max(100).nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT")
});

export const createNoticeSchema = noticeFieldsSchema.refine(
    (data) => data.minimumSemester === undefined || data.maximumSemester === undefined || data.minimumSemester <= data.maximumSemester,
    { message: "minimumSemester cannot be greater than maximumSemester", path: ["minimumSemester"] }
);

export const updateNoticeSchema = noticeFieldsSchema.partial().extend({
    status: z.enum(NOTICE_STATUSES).optional()
}).refine(
    (data) => data.minimumSemester === undefined || data.maximumSemester === undefined || data.minimumSemester <= data.maximumSemester,
    { message: "minimumSemester cannot be greater than maximumSemester", path: ["minimumSemester"] }
);

export const noticeQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    category: z.enum(NOTICE_CATEGORIES).optional(),
    search: z.string().trim().min(1).max(200).optional(),
    publishedFrom: dateOnly.optional(),
    publishedTo: dateOnly.optional(),
    deadlineFrom: dateOnly.optional(),
    deadlineTo: dateOnly.optional()
});

export const adminNoticeQuerySchema = noticeQuerySchema.extend({
    status: z.enum(NOTICE_STATUSES).optional()
});

export const noticeIdSchema = z.object({
    id: z.string().uuid()
});
