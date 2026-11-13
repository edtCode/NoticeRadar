import test from "node:test";
import assert from "node:assert/strict";
import { analyzeEmail, classifyEmail, detectContradictions, calculateConfidence, normalizeDates } from "../services/email-intelligence.service.js";
import { computeDedupeFingerprint } from "../services/email-announcement.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

const withFetch = async (fakeFetch, run) => {
    const originalFetch = globalThis.fetch;
    const originalKey = env.llm.apiKey;

    env.llm.apiKey = "test-key";
    globalThis.fetch = fakeFetch;

    try {
        return await run();
    } finally {
        globalThis.fetch = originalFetch;
        env.llm.apiKey = originalKey;
    }
};

const completionResponse = (content) => ({
    ok: true,
    json: async () => content
});

const baseEmail = {
    id: "msg-1",
    threadId: "thread-1",
    subject: "Test subject",
    sender: "placement-cell@college.edu",
    receivedAt: "2026-12-01T10:00:00Z",
    body: "",
    htmlBody: "",
    snippet: "",
    urls: [],
    labelIds: ["INBOX"],
    internalDate: "1733066400000"
};

const aiResponse = (output) => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(output) } }] })
});

test("simple internship announcement is extracted with CPI and deadline", async () => {
    const output = {
        emailAnalysis: {
            isRelevant: true,
            emailSummary: "Internship opportunity from Example Technologies.",
            importance: "high",
            numberOfAnnouncements: 1,
            language: "en",
            overallConfidence: 0.9
        },
        announcements: [{
            title: "Software Development Internship",
            shortTitle: "SDE Intern",
            description: "Software development internship for pre-final-year students.",
            primaryCategory: "summer_internship",
            secondaryCategory: null,
            announcementType: "summer_internship",
            organization: { name: "Example Technologies", type: "company" },
            opportunity: {
                role: "Software Development Intern",
                duration: "3 months",
                location: "Bengaluru",
                workMode: "hybrid",
                stipend: "₹30,000/month",
                salary: null,
                currency: "INR",
                openings: null,
                applicationProcess: "Apply via portal",
                applicationLink: "https://example.com/apply",
                jobDescription: null,
                requiredSkills: ["JavaScript", "React"],
                preferredSkills: [],
                selectionProcess: ["screening", "interview"],
                interviewRounds: 2,
                jobResponsibilities: []
            },
            eligibility: {
                departments: ["CSE", "IT", "ECE", "EE"],
                branches: ["Computer Science", "Information Technology"],
                degrees: ["B.Tech"],
                academicYears: ["pre-final year"],
                graduationBatches: [2027],
                minimumCPI: 7.5,
                minimumCGPA: null,
                minimumPercentage: null,
                maximumActiveBacklogs: null,
                noActiveBacklogs: null,
                noHistoricalBacklogs: null,
                genderEligibility: null,
                requiredAcademicQualifications: [],
                requiredSkills: [],
                requiredExperience: null,
                otherConditions: [],
                excludedBranches: [],
                excludedAcademicYears: [],
                originalEligibilityText: "CSE, IT, ECE, EE students with minimum CPI of 7.5"
            },
            dates: {
                announcementDate: { originalText: "December 1, 2026", normalizedDate: "2026-12-01T10:00:00.000Z", time: null, timezone: null, dateType: "announcement_date" },
                applicationStartDate: null,
                applicationDeadline: { originalText: "December 5, 2026", normalizedDate: "2026-12-05T00:00:00.000Z", time: null, timezone: null, dateType: "application_deadline" },
                registrationDeadline: null,
                eventStartDate: null,
                eventEndDate: null,
                internshipStartDate: null,
                internshipEndDate: null,
                jobJoiningDate: null,
                assessmentDate: null,
                interviewDate: null,
                prePlacementTalkDate: null,
                workshopDate: null,
                webinarDate: null,
                examinationDate: null,
                otherImportantDates: []
            },
            eventDetails: null,
            links: { applicationLink: "https://example.com/apply", registrationLink: null, officialWebsite: null, otherLinks: [] },
            contact: { name: null, email: null, phone: null },
            source: { emailId: "msg-1", emailSubject: "Test subject", sender: "placement-cell@college.edu", receivedAt: "2026-12-01T10:00:00Z", sourceUrl: null },
            status: "upcoming",
            confidence: 0.9,
            reviewRequired: false,
            missingInformation: [],
            extractionWarnings: []
        }]
    };

    const result = await withFetch(
        async () => aiResponse(output),
        () => analyzeEmail(baseEmail)
    );

    assert.equal(result.emailAnalysis.isRelevant, true);
    assert.equal(result.announcements.length, 1);
    const a = result.announcements[0];
    assert.equal(a.primaryCategory, "summer_internship");
    assert.equal(a.organization.name, "Example Technologies");
    assert.equal(a.eligibility.minimumCPI, 7.5);
    assert.equal(a.eligibility.minimumCGPA, null);
    assert.equal(a.eligibility.minimumPercentage, null);
    assert.deepEqual(a.eligibility.departments, ["CSE", "IT", "ECE", "EE"]);
    assert.equal(a.dates.applicationDeadline.normalizedDate, "2026-12-05T00:00:00.000Z");
});

test("email with three companies produces three separate announcements", async () => {
    const output = {
        emailAnalysis: {
            isRelevant: true,
            emailSummary: "Three companies announced recruitment opportunities.",
            importance: "high",
            numberOfAnnouncements: 3,
            language: "en",
            overallConfidence: 0.92
        },
        announcements: [
            {
                title: "Microsoft Software Engineering Internship",
                shortTitle: "Microsoft SWE Intern",
                description: "Microsoft internship for CSE and IT students.",
                primaryCategory: "internship",
                secondaryCategory: null,
                announcementType: "summer_internship",
                organization: { name: "Microsoft", type: "company" },
                opportunity: { role: "Software Engineering Intern", duration: null, location: null, workMode: null, stipend: null, salary: null, currency: null, openings: null, applicationProcess: null, applicationLink: null, jobDescription: null, requiredSkills: [], preferredSkills: [], selectionProcess: [], interviewRounds: null, jobResponsibilities: [] },
                eligibility: { departments: ["CSE", "IT"], branches: [], degrees: [], academicYears: [], graduationBatches: [], minimumCPI: 8.0, minimumCGPA: null, minimumPercentage: null, maximumActiveBacklogs: null, noActiveBacklogs: null, noHistoricalBacklogs: null, genderEligibility: null, requiredAcademicQualifications: [], requiredSkills: [], requiredExperience: null, otherConditions: [], excludedBranches: [], excludedAcademicYears: [], originalEligibilityText: "CSE and IT students with CPI 8.0 or above" },
                dates: { announcementDate: null, applicationStartDate: null, applicationDeadline: { originalText: "December 5", normalizedDate: null, time: null, timezone: null, dateType: "application_deadline" }, registrationDeadline: null, eventStartDate: null, eventEndDate: null, internshipStartDate: null, internshipEndDate: null, jobJoiningDate: null, assessmentDate: null, interviewDate: null, prePlacementTalkDate: null, workshopDate: null, webinarDate: null, examinationDate: null, otherImportantDates: [] },
                eventDetails: null,
                links: { applicationLink: null, registrationLink: null, officialWebsite: null, otherLinks: [] },
                contact: { name: null, email: null, phone: null },
                source: { emailId: "msg-2", emailSubject: "Recruitment", sender: "cell@college.edu", receivedAt: "2026-12-01T10:00:00Z", sourceUrl: null },
                status: "upcoming", confidence: 0.85, reviewRequired: false, missingInformation: ["applicationLink"], extractionWarnings: []
            },
            {
                title: "Deloitte Analyst Recruitment",
                shortTitle: "Deloitte Analyst",
                description: "Deloitte analyst recruitment open to all branches.",
                primaryCategory: "off_campus_placement",
                secondaryCategory: null,
                announcementType: "recruitment_drive",
                organization: { name: "Deloitte", type: "company" },
                opportunity: { role: "Analyst", duration: null, location: null, workMode: null, stipend: null, salary: null, currency: null, openings: null, applicationProcess: null, applicationLink: null, jobDescription: null, requiredSkills: [], preferredSkills: [], selectionProcess: [], interviewRounds: null, jobResponsibilities: [] },
                eligibility: { departments: [], branches: [], degrees: [], academicYears: [], graduationBatches: [], minimumCPI: 7.0, minimumCGPA: null, minimumPercentage: null, maximumActiveBacklogs: null, noActiveBacklogs: null, noHistoricalBacklogs: null, genderEligibility: null, requiredAcademicQualifications: [], requiredSkills: [], requiredExperience: null, otherConditions: [], excludedBranches: [], excludedAcademicYears: [], originalEligibilityText: "All engineering branches with CPI 7.0 or above" },
                dates: { announcementDate: null, applicationStartDate: null, applicationDeadline: { originalText: "December 10", normalizedDate: null, time: null, timezone: null, dateType: "application_deadline" }, registrationDeadline: null, eventStartDate: null, eventEndDate: null, internshipStartDate: null, internshipEndDate: null, jobJoiningDate: null, assessmentDate: null, interviewDate: null, prePlacementTalkDate: null, workshopDate: null, webinarDate: null, examinationDate: null, otherImportantDates: [] },
                eventDetails: null,
                links: { applicationLink: null, registrationLink: null, officialWebsite: null, otherLinks: [] },
                contact: { name: null, email: null, phone: null },
                source: { emailId: "msg-2", emailSubject: "Recruitment", sender: "cell@college.edu", receivedAt: "2026-12-01T10:00:00Z", sourceUrl: null },
                status: "upcoming", confidence: 0.85, reviewRequired: false, missingInformation: [], extractionWarnings: []
            },
            {
                title: "Google Summer Internship",
                shortTitle: "Google Summer Intern",
                description: "Google summer internship for pre-final-year students.",
                primaryCategory: "summer_internship",
                secondaryCategory: null,
                announcementType: "summer_internship",
                organization: { name: "Google", type: "company" },
                opportunity: { role: "Summer Intern", duration: null, location: null, workMode: null, stipend: null, salary: null, currency: null, openings: null, applicationProcess: null, applicationLink: null, jobDescription: null, requiredSkills: [], preferredSkills: [], selectionProcess: [], interviewRounds: null, jobResponsibilities: [] },
                eligibility: { departments: ["CSE", "IT", "ECE"], branches: [], degrees: [], academicYears: ["pre-final year"], graduationBatches: [2027], minimumCPI: null, minimumCGPA: null, minimumPercentage: null, maximumActiveBacklogs: null, noActiveBacklogs: null, noHistoricalBacklogs: null, genderEligibility: null, requiredAcademicQualifications: [], requiredSkills: [], requiredExperience: null, otherConditions: [], excludedBranches: [], excludedAcademicYears: [], originalEligibilityText: "Pre-final-year students in CSE, IT and ECE" },
                dates: { announcementDate: null, applicationStartDate: null, applicationDeadline: { originalText: "December 15", normalizedDate: null, time: null, timezone: null, dateType: "application_deadline" }, registrationDeadline: null, eventStartDate: null, eventEndDate: null, internshipStartDate: null, internshipEndDate: null, jobJoiningDate: null, assessmentDate: null, interviewDate: null, prePlacementTalkDate: null, workshopDate: null, webinarDate: null, examinationDate: null, otherImportantDates: [] },
                eventDetails: null,
                links: { applicationLink: null, registrationLink: null, officialWebsite: null, otherLinks: [] },
                contact: { name: null, email: null, phone: null },
                source: { emailId: "msg-2", emailSubject: "Recruitment", sender: "cell@college.edu", receivedAt: "2026-12-01T10:00:00Z", sourceUrl: null },
                status: "upcoming", confidence: 0.85, reviewRequired: false, missingInformation: [], extractionWarnings: []
            }
        ]
    };

    const result = await withFetch(
        async () => aiResponse(output),
        () => analyzeEmail({ ...baseEmail, id: "msg-2" })
    );

    assert.equal(result.emailAnalysis.numberOfAnnouncements, 3);
    assert.equal(result.announcements.length, 3);
    assert.equal(result.announcements[0].organization.name, "Microsoft");
    assert.equal(result.announcements[1].organization.name, "Deloitte");
    assert.equal(result.announcements[2].organization.name, "Google");
    assert.equal(result.announcements[0].eligibility.minimumCPI, 8.0);
    assert.equal(result.announcements[1].eligibility.minimumCPI, 7.0);
    assert.equal(result.announcements[2].eligibility.minimumCPI, null);
});

test("irrelevant promotional email is marked not relevant", async () => {
    const output = {
        emailAnalysis: {
            isRelevant: false,
            emailSummary: "Promotional newsletter with no student opportunity.",
            importance: "low",
            numberOfAnnouncements: 0,
            language: "en",
            overallConfidence: 0.95
        },
        announcements: []
    };

    const result = await withFetch(
        async () => aiResponse(output),
        () => analyzeEmail({ ...baseEmail, subject: "Weekly deals newsletter" })
    );

    assert.equal(result.emailAnalysis.isRelevant, false);
    assert.equal(result.announcements.length, 0);
});

test("hackathon announcement extracts event details separately from deadline", async () => {
    const output = {
        emailAnalysis: {
            isRelevant: true,
            emailSummary: "Annual technical festival hackathon.",
            importance: "medium",
            numberOfAnnouncements: 1,
            language: "en",
            overallConfidence: 0.9
        },
        announcements: [{
            title: "Annual Hackathon 2027",
            shortTitle: "Hackathon 2027",
            description: "48-hour hackathon on Jan 15-16, register by Jan 10.",
            primaryCategory: "hackathon",
            secondaryCategory: null,
            announcementType: "hackathon",
            organization: { name: "Tech Club", type: "college" },
            opportunity: null,
            eligibility: { departments: [], branches: [], degrees: [], academicYears: [], graduationBatches: [], minimumCPI: null, minimumCGPA: null, minimumPercentage: null, maximumActiveBacklogs: null, noActiveBacklogs: null, noHistoricalBacklogs: null, genderEligibility: null, requiredAcademicQualifications: [], requiredSkills: [], requiredExperience: null, otherConditions: [], excludedBranches: [], excludedAcademicYears: [], originalEligibilityText: "" },
            dates: {
                announcementDate: null,
                applicationStartDate: null,
                applicationDeadline: null,
                registrationDeadline: { originalText: "January 10", normalizedDate: "2027-01-10T00:00:00.000Z", time: null, timezone: null, dateType: "registration_deadline" },
                eventStartDate: { originalText: "January 15", normalizedDate: "2027-01-15T00:00:00.000Z", time: null, timezone: null, dateType: "event_start_date" },
                eventEndDate: { originalText: "January 16", normalizedDate: "2027-01-16T00:00:00.000Z", time: null, timezone: null, dateType: "event_end_date" },
                internshipStartDate: null,
                internshipEndDate: null,
                jobJoiningDate: null,
                assessmentDate: null,
                interviewDate: null,
                prePlacementTalkDate: null,
                workshopDate: null,
                webinarDate: null,
                examinationDate: null,
                otherImportantDates: []
            },
            eventDetails: {
                organizer: "Tech Club",
                venue: "College Auditorium",
                format: "offline",
                teamSize: "3-4",
                participationFee: null,
                prizePool: "₹1,00,000",
                schedule: []
            },
            links: { applicationLink: null, registrationLink: "https://hack.example.com/register", officialWebsite: null, otherLinks: [] },
            contact: { name: null, email: null, phone: null },
            source: { emailId: "msg-3", emailSubject: "Hackathon", sender: "club@college.edu", receivedAt: "2026-12-01T10:00:00Z", sourceUrl: null },
            status: "upcoming", confidence: 0.9, reviewRequired: false, missingInformation: [], extractionWarnings: []
        }]
    };

    const result = await withFetch(
        async () => aiResponse(output),
        () => analyzeEmail({ ...baseEmail, id: "msg-3", subject: "Hackathon" })
    );

    const a = result.announcements[0];
    assert.equal(a.primaryCategory, "hackathon");
    // Event date must NOT equal registration deadline.
    assert.notEqual(a.dates.eventStartDate.normalizedDate, a.dates.registrationDeadline.normalizedDate);
    assert.equal(a.dates.registrationDeadline.normalizedDate, "2027-01-10T00:00:00.000Z");
    assert.equal(a.dates.eventStartDate.normalizedDate, "2027-01-15T00:00:00.000Z");
    assert.equal(a.eventDetails.prizePool, "₹1,00,000");
    assert.equal(a.eventDetails.format, "offline");
});

test("malformed AI JSON is rejected", async () => {
    await assert.rejects(
        () => withFetch(
            async () => completionResponse("not json at all"),
            () => analyzeEmail(baseEmail)
        ),
        (error) => error instanceof ApiError && error.status === 422
    );
});

test("AI output violating schema is rejected", async () => {
    await assert.rejects(
        () => withFetch(
            async () => aiResponse({ emailAnalysis: { isRelevant: "yes" }, announcements: [] }),
            () => analyzeEmail(baseEmail)
        ),
        (error) => error instanceof ApiError && error.status === 422
    );
});

test("detectContradictions flags conflicting CPI values", async () => {
    const announcements = [{
        eligibility: { minimumCPI: 7.5, minimumCGPA: null, minimumPercentage: null }
    }];
    const conflicts = detectContradictions(announcements);
    assert.equal(conflicts.length, 0); // single value, no conflict

    const announcements2 = [{
        eligibility: { minimumCPI: 7.5, minimumCGPA: 8.0, minimumPercentage: null }
    }];
    const conflicts2 = detectContradictions(announcements2);
    assert.equal(conflicts2.length, 1);
    assert.equal(conflicts2[0].field, "eligibility");
});

test("calculateConfidence calibrates score", async () => {
    const complete = {
        title: "Internship",
        organization: { name: "Acme" },
        dates: { applicationDeadline: { normalizedDate: "2026-12-05T00:00:00.000Z" } },
        eligibility: { minimumCPI: 7.5 },
        reviewRequired: false,
        extractionWarnings: []
    };
    const high = calculateConfidence(complete);
    assert.ok(high > 0.7);

    const sparse = { title: null, organization: null, dates: null, eligibility: null, reviewRequired: true, extractionWarnings: ["missing"] };
    const low = calculateConfidence(sparse);
    assert.ok(low < high);
});

test("normalizeDates resolves today relative to receivedAt", async () => {
    const announcement = {
        dates: {
            announcementDate: { originalText: "Today", normalizedDate: null },
            applicationDeadline: { originalText: "2026-12-05", normalizedDate: null },
            eventStartDate: { originalText: "next year", normalizedDate: null },
            otherImportantDates: []
        }
    };
    const { announcement: normalized, warnings } = normalizeDates(announcement, "2026-12-01T10:00:00Z");
    assert.equal(normalized.dates.announcementDate.normalizedDate, "2026-12-01T00:00:00.000Z");
    assert.equal(normalized.dates.applicationDeadline.normalizedDate, "2026-12-05T00:00:00.000Z");
    assert.equal(normalized.dates.eventStartDate.normalizedDate, null);
    assert.ok(warnings.some((w) => w.includes("next year")));
});

test("computeDedupeFingerprint produces stable hashes", async () => {
    const a = computeDedupeFingerprint({ userId: "u1", title: "Internship", organizationName: "Acme", applicationLink: "https://x.com", applicationDeadline: "2026-12-05" });
    const b = computeDedupeFingerprint({ userId: "u1", title: "Internship", organizationName: "Acme", applicationLink: "https://x.com", applicationDeadline: "2026-12-05" });
    const c = computeDedupeFingerprint({ userId: "u1", title: "Different", organizationName: "Acme", applicationLink: "https://x.com", applicationDeadline: "2026-12-05" });
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 64); // sha256 hex
});

test("missing AI credentials fail with 503", async () => {
    const originalKey = env.llm.apiKey;
    env.llm.apiKey = undefined;
    try {
        await assert.rejects(
            () => analyzeEmail(baseEmail),
            (error) => error instanceof ApiError && error.status === 503
        );
    } finally {
        env.llm.apiKey = originalKey;
    }
});

test("classifyEmail returns relevance and importance", async () => {
    const result = await withFetch(
        async () => aiResponse({ isRelevant: true, importance: "high", reason: "New internship opening", suspectedCategories: ["internship"] }),
        () => classifyEmail(baseEmail)
    );
    assert.equal(result.isRelevant, true);
    assert.equal(result.importance, "high");
});
