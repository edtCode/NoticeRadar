import { z } from "zod";

export const institutionSearchSchema = z.object({
    q: z.string().trim().min(1, "Search query is required").max(80, "Search query is too long")
});

export const institutionRequestSchema = z.object({
    name: z.string().trim().min(2, "Institution name is required").max(160),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    institutionType: z.string().trim().max(40).optional()
});
