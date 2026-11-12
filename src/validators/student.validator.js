import { z } from "zod";

const currentYear = new Date().getFullYear();

export const studentProfileSchema = z.object({
    institutionId: z.string().uuid(),
    departmentName: z.string().trim().min(2).max(100),
    branch: z.string().trim().min(1).max(100),
    semester: z.coerce.number().int().min(1).max(8),
    cpi: z.coerce.number().min(0).max(10),
    graduationYear: z.coerce.number().int().min(currentYear).max(currentYear + 8),
    activeBacklogs: z.coerce.number().int().min(0).max(20).default(0),
    interests: z.array(z.string().trim().min(1).max(50)).max(20).default([])
});

export const studentProfileUpdateSchema = studentProfileSchema.partial();
