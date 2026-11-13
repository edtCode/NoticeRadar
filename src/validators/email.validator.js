import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const dateDetail = z.object({
    originalText: z.string().trim().min(1).max(200).optional(),
    normalizedDate: z.string().datetime().optional().nullable(),
    time: z.string().trim().max(50).optional().nullable(),
    timezone: z.string().trim().max(50).optional().nullable(),
    dateType: z.enum([
        "announcement_date",
        "application_start_date",
        "application_deadline",
        "registration_deadline",
        "event_start_date",
        "event_end_date",
        "internship_start_date",
        "internship_end_date",
        "job_joining_date",
        "assessment_date",
        "interview_date",
        "pre_placement_talk_date",
        "workshop_date",
        "webinar_date",
        "examination_date",
        "other"
    ]).optional()
});

const evidenceItem = z.object({
    field: z.string().trim().min(1).max(100),
    value: z.string().trim().min(1).max(500),
    source: z.enum(["subject", "sender", "body", "url", "header"]).optional()
});

const dateRange = z.object({
    start: z.string().trim().min(1).max(200),
    end: z.string().trim().min(1).max(200)
});

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export const organizationSchema = z.object({
    name: z.string().trim().min(1).max(200).nullable(),
    type: z.enum(["company", "university", "college", "placement_cell", "government", "ngo", "other"]).nullable()
});

// ---------------------------------------------------------------------------
// Opportunity
// ---------------------------------------------------------------------------

export const opportunitySchema = z.object({
    role: z.string().trim().min(1).max(200).nullable(),
    duration: z.string().trim().max(200).nullable(),
    location: z.string().trim().max(200).nullable(),
    workMode: z.enum(["remote", "hybrid", "on_site"]).nullable(),
    stipend: z.string().trim().max(200).nullable(),
    salary: z.string().trim().max(200).nullable(),
    currency: z.string().trim().max(10).nullable(),
    openings: z.coerce.number().int().min(0).nullable(),
    applicationProcess: z.string().trim().max(2000).nullable(),
    applicationLink: z.string().trim().url().max(1000).nullable().optional(),
    jobDescription: z.string().trim().max(5000).nullable(),
    requiredSkills: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    preferredSkills: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    selectionProcess: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    interviewRounds: z.coerce.number().int().min(0).nullable(),
    jobResponsibilities: z.array(z.string().trim().min(1).max(500)).max(30).default([])
});

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export const eligibilitySchema = z.object({
    departments: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    branches: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    degrees: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    academicYears: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    graduationBatches: z.array(z.coerce.number().int().min(2000).max(2100)).max(30).default([]),
    minimumCPI: z.coerce.number().min(0).max(10).nullable(),
    minimumCGPA: z.coerce.number().min(0).max(10).nullable(),
    minimumPercentage: z.coerce.number().min(0).max(100).nullable(),
    maximumActiveBacklogs: z.coerce.number().int().min(0).nullable(),
    noActiveBacklogs: z.boolean().nullable(),
    noHistoricalBacklogs: z.boolean().nullable(),
    genderEligibility: z.string().trim().max(100).nullable(),
    requiredAcademicQualifications: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
    requiredSkills: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    requiredExperience: z.string().trim().max(500).nullable(),
    otherConditions: z.array(z.string().trim().min(1).max(300)).max(50).default([]),
    excludedBranches: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    excludedAcademicYears: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    originalEligibilityText: z.string().trim().max(5000).default("")
});

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export const importantDatesSchema = z.object({
    announcementDate: dateDetail.nullable(),
    applicationStartDate: dateDetail.nullable(),
    applicationDeadline: dateDetail.nullable(),
    registrationDeadline: dateDetail.nullable(),
    eventStartDate: dateDetail.nullable(),
    eventEndDate: dateDetail.nullable(),
    internshipStartDate: dateDetail.nullable(),
    internshipEndDate: dateDetail.nullable(),
    jobJoiningDate: dateDetail.nullable(),
    assessmentDate: dateDetail.nullable(),
    interviewDate: dateDetail.nullable(),
    prePlacementTalkDate: dateDetail.nullable(),
    workshopDate: dateDetail.nullable(),
    webinarDate: dateDetail.nullable(),
    examinationDate: dateDetail.nullable(),
    otherImportantDates: z.array(dateDetail).max(20).default([])
});

// ---------------------------------------------------------------------------
// Event details
// ---------------------------------------------------------------------------

export const eventDetailsSchema = z.object({
    organizer: z.string().trim().min(1).max(200).nullable(),
    venue: z.string().trim().min(1).max(300).nullable(),
    format: z.enum(["online", "offline", "hybrid"]).nullable(),
    teamSize: z.string().trim().max(100).nullable(),
    participationFee: z.string().trim().max(200).nullable(),
    prizePool: z.string().trim().max(300).nullable(),
    schedule: z.array(z.string().trim().min(1).max(500)).max(30).default([])
});

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const linksSchema = z.object({
    applicationLink: z.string().trim().url().max(1000).nullable().optional(),
    registrationLink: z.string().trim().url().max(1000).nullable().optional(),
    officialWebsite: z.string().trim().url().max(1000).nullable().optional(),
    otherLinks: z.array(z.string().trim().url().max(1000)).max(20).default([])
});

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
    name: z.string().trim().min(1).max(200).nullable(),
    email: z.string().trim().email().max(200).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional()
});

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------

export const sourceSchema = z.object({
    emailId: z.string().trim().min(1).max(200),
    emailSubject: z.string().trim().min(1).max(500),
    sender: z.string().trim().min(1).max(300),
    receivedAt: z.string().datetime(),
    sourceUrl: z.string().trim().url().max(1000).nullable().optional()
});

// ---------------------------------------------------------------------------
// Announcement (one per distinct opportunity in an email)
// ---------------------------------------------------------------------------

const primaryCategoryEnum = z.enum([
    "internship",
    "summer_internship",
    "winter_internship",
    "full_time_placement",
    "off_campus_placement",
    "on_campus_placement",
    "graduate_hiring",
    "job_opportunity",
    "apprenticeship",
    "recruitment_drive",
    "referral_opportunity",
    "hackathon",
    "coding_competition",
    "technical_fest",
    "workshop",
    "webinar",
    "seminar",
    "technical_conference",
    "project_competition",
    "developer_event",
    "scholarship",
    "fellowship",
    "research_opportunity",
    "student_ambassador",
    "leadership_program",
    "training_program",
    "certification_program",
    "entrepreneurship_program",
    "incubation_program",
    "academic_notice",
    "examination_notice",
    "registration_notice",
    "department_notice",
    "administrative_notice",
    "holiday_notice",
    "fee_notice",
    "result_announcement",
    "general_event",
    "club_activity",
    "cultural_fest",
    "sports_event",
    "important_announcement",
    "other",
    "irrelevant"
]);

export const announcementSchema = z.object({
    title: z.string().trim().min(1).max(300),
    shortTitle: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().min(1).max(5000),
    primaryCategory: primaryCategoryEnum,
    secondaryCategory: primaryCategoryEnum.nullable().optional(),
    announcementType: z.string().trim().min(1).max(100).optional(),
    organization: organizationSchema.nullable().optional(),
    opportunity: opportunitySchema.nullable().optional(),
    eligibility: eligibilitySchema.nullable().optional(),
    dates: importantDatesSchema.nullable().optional(),
    eventDetails: eventDetailsSchema.nullable().optional(),
    links: linksSchema.nullable().optional(),
    contact: contactSchema.nullable().optional(),
    source: sourceSchema,
    status: z.enum(["upcoming", "open", "expired", "closed"]).default("upcoming"),
    confidence: z.coerce.number().min(0).max(1).default(0.5),
    reviewRequired: z.boolean().default(false),
    missingInformation: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
    extractionWarnings: z.array(z.string().trim().min(1).max(500)).max(50).default([])
});

// ---------------------------------------------------------------------------
// Email analysis (overall)
// ---------------------------------------------------------------------------

const importanceEnum = z.enum(["critical", "high", "medium", "low"]);

export const emailAnalysisSchema = z.object({
    isRelevant: z.boolean(),
    emailSummary: z.string().trim().min(1).max(2000),
    importance: importanceEnum,
    numberOfAnnouncements: z.coerce.number().int().min(0).max(50),
    language: z.string().trim().min(1).max(10).default("en"),
    overallConfidence: z.coerce.number().min(0).max(1).default(0.5)
});

// ---------------------------------------------------------------------------
// Complete AI output
// ---------------------------------------------------------------------------

export const emailIntelligenceOutputSchema = z.object({
    emailAnalysis: emailAnalysisSchema,
    announcements: z.array(announcementSchema).max(100)
});

// ---------------------------------------------------------------------------
// TypeScript type exports (for frontend consumption; erased at runtime)
// ---------------------------------------------------------------------------
