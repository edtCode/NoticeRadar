import { z } from "zod";
import { NOTICE_CATEGORIES } from "../utils/constants.js";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

const evidenceSchema = z.object({
    field: z.string().trim().min(1).max(100),
    pageNumber: z.coerce.number().int().min(1).nullable(),
    text: z.string().trim().min(1).max(500)
});

export const extractionSchema = z.object({
    title: z.string().trim().min(1).max(300).nullable(),
    category: z.enum(NOTICE_CATEGORIES).nullable(),
    summary: z.string().trim().min(1).max(2000).nullable(),
    deadline: dateOnly.nullable(),
    eligibleBranches: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    minimumCPI: z.coerce.number().min(0).max(10).nullable(),
    minimumSemester: z.coerce.number().int().min(1).max(8).nullable(),
    maximumSemester: z.coerce.number().int().min(1).max(8).nullable(),
    eligibleGraduationYears: z.array(z.coerce.number().int().min(2000).max(2100)).max(20).default([]),
    requiresNoBacklogs: z.boolean().nullable(),
    requiredDocuments: z.array(z.string().trim().min(1).max(150)).max(20).default([]),
    duration: z.string().trim().min(1).max(100).nullable(),
    applicationUrl: z.string().trim().url().max(500).nullable(),
    ambiguousFields: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    evidence: z.array(evidenceSchema).max(50).default([])
}).refine(
    (data) => data.minimumSemester === null || data.maximumSemester === null || data.minimumSemester <= data.maximumSemester,
    { message: "minimumSemester cannot be greater than maximumSemester", path: ["minimumSemester"] }
);

// Personal entries only keep the handful of fields the student sees in their
// own list, so the extraction result is intentionally narrower.
export const personalExtractionSchema = z.object({
    title: z.string().trim().min(1).max(200).nullable(),
    description: z.string().trim().min(1).max(5000).nullable(),
    category: z.enum(NOTICE_CATEGORIES).nullable(),
    deadline: dateOnly.nullable(),
    eventDate: dateOnly.nullable(),
    eligibleBranches: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    minimumCPI: z.coerce.number().min(0).max(10).nullable().default(null),
    requiresNoBacklogs: z.boolean().nullable().default(null),
    ambiguousFields: z.array(z.string().trim().min(1).max(100)).max(30).default([])
});

export const reviewSchema = z.object({
    title: z.string().trim().min(3).max(300).optional(),
    summary: z.string().trim().max(2000).nullable().optional(),
    category: z.enum(NOTICE_CATEGORIES).optional(),
    deadline: z.union([z.string().datetime({ offset: true }), dateOnly]).nullable().optional(),
    eligibleBranches: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
    minimumCPI: z.coerce.number().min(0).max(10).nullable().optional(),
    minimumSemester: z.coerce.number().int().min(1).max(8).nullable().optional(),
    maximumSemester: z.coerce.number().int().min(1).max(8).nullable().optional(),
    eligibleGraduationYears: z.array(z.coerce.number().int().min(2000).max(2100)).max(20).optional(),
    requiresNoBacklogs: z.boolean().nullable().optional(),
    requiredDocuments: z.array(z.string().trim().min(1).max(150)).max(20).optional(),
    duration: z.string().trim().max(100).nullable().optional(),
    applicationUrl: z.string().trim().url().max(500).nullable().optional(),
    decision: z.enum(["APPROVED", "REJECTED"]).optional(),
    reviewNote: z.string().trim().max(1000).optional()
});

export const rejectNoticeSchema = z.object({
    reviewNote: z.string().trim().max(1000).optional()
});
