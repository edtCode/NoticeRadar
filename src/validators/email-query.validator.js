import { z } from "zod";

export const emailAnnouncementQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.string().optional(),
    importance: z.enum(["critical", "high", "medium", "low"]).optional(),
    search: z.string().trim().max(200).optional(),
    minCpi: z.coerce.number().min(0).max(10).optional(),
    deadlineFrom: z.string().datetime().optional(),
    deadlineTo: z.string().datetime().optional(),
    sort: z.enum(["recent", "deadline"]).default("recent")
});
