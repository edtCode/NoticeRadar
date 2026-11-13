import { createHash } from "node:crypto";
import { ApiError, databaseError } from "../utils/errors.js";
import { encrypt, decrypt } from "../config/encryption.js";
import { getPagination, buildPagination } from "../utils/pagination.js";
import { parseEmailMessage } from "../services/gmail.service.js";
import {
    analyzeEmail,
    detectContradictions,
    calculateConfidence,
    normalizeDates
} from "../services/email-intelligence.service.js";

const nowIso = () => new Date().toISOString();

const normalizeForFingerprint = (value) => {
    if (value == null) {
        return "";
    }

    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 120);
};

export const computeDedupeFingerprint = ({ userId, title, organizationName, applicationLink, applicationDeadline }) => {
    const payload = [
        normalizeForFingerprint(userId),
        normalizeForFingerprint(title),
        normalizeForFingerprint(organizationName),
        normalizeForFingerprint(applicationLink),
        normalizeForFingerprint(applicationDeadline)
    ].join("|");

    return createHash("sha256").update(payload).digest("hex");
};

// ---------------------------------------------------------------------------
// Gmail account connection
// ---------------------------------------------------------------------------

export const connectGmailAccount = async (supabase, userId, { googleSub, emailAddress, accessToken, refreshToken, tokenExpiresAt, scope }) => {
    const encryptedAccess = await encrypt(accessToken);
    const encryptedRefresh = await encrypt(refreshToken ?? "");

    // Upsert: one Gmail account per user.
    const { data, error } = await supabase
        .from("gmail_accounts")
        .upsert({
            user_id: userId,
            google_sub: googleSub,
            email_address: emailAddress,
            access_token: encryptedAccess,
            refresh_token: encryptedRefresh,
            token_expires_at: tokenExpiresAt,
            scope,
            updated_at: nowIso()
        }, {
            onConflict: "user_id"
        })
        .select("id, email_address, google_sub, created_at")
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const getGmailAccount = async (supabase, userId) => {
    const { data, error } = await supabase
        .from("gmail_accounts")
        .select("id, user_id, google_sub, email_address, access_token, refresh_token, token_expires_at, scope, last_history_id, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const disconnectGmailAccount = async (supabase, userId) => {
    const { error } = await supabase
        .from("gmail_accounts")
        .delete()
        .eq("user_id", userId);

    if (error) {
        throw databaseError(error);
    }
};

export const updateGmailHistoryId = async (supabase, accountId, historyId) => {
    const { error } = await supabase
        .from("gmail_accounts")
        .update({ last_history_id: historyId, updated_at: nowIso() })
        .eq("id", accountId);

    if (error) {
        throw databaseError(error);
    }
};

// ---------------------------------------------------------------------------
// Processed email tracking
// ---------------------------------------------------------------------------

export const recordProcessedEmail = async (supabase, userId, gmailAccountId, payload) => {
    const {
        gmailMessageId,
        gmailThreadId,
        gmailHistoryId,
        subject,
        sender,
        receivedAt,
        processingStatus = "completed",
        processingError = null,
        announcementCount = 0
    } = payload;

    const { data, error } = await supabase
        .from("processed_emails")
        .upsert({
            user_id: userId,
            gmail_account_id: gmailAccountId,
            gmail_message_id: gmailMessageId,
            gmail_thread_id: gmailThreadId,
            gmail_history_id: gmailHistoryId,
            subject,
            sender,
            received_at: receivedAt,
            processing_status: processingStatus,
            processing_error: processingError,
            announcement_count: announcementCount,
            processed_at: nowIso()
        }, {
            onConflict: "user_id, gmail_message_id"
        })
        .select("id, gmail_message_id, processing_status, announcement_count")
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const isEmailAlreadyProcessed = async (supabase, userId, gmailMessageId) => {
    const { data, error } = await supabase
        .from("processed_emails")
        .select("id, processing_status, announcement_count")
        .eq("user_id", userId)
        .eq("gmail_message_id", gmailMessageId)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

// ---------------------------------------------------------------------------
// Full per-message processing pipeline (used by both on-demand sync and the
// background scheduler). Parses an email, runs AI extraction, stores
// announcements with duplicate detection, and creates notifications.
// ---------------------------------------------------------------------------

export const processIncomingMessage = async (
    supabase,
    adminClient,
    gmailAccountId,
    userId,
    gmailMessage
) => {
    const parsed = parseEmailMessage(gmailMessage);
    const internalDate = gmailMessage.internalDate ? Number(gmailMessage.internalDate) : null;
    const receivedAt = internalDate ? new Date(internalDate).toISOString() : null;

    // Skip if already processed.
    const already = await isEmailAlreadyProcessed(supabase, userId, parsed.id);

    if (already && already.processing_status === "completed") {
        return { skipped: true, messageId: parsed.id };
    }

    // Record the email as processing.
    await recordProcessedEmail(supabase, userId, gmailAccountId, {
        gmailMessageId: parsed.id,
        gmailThreadId: parsed.threadId,
        gmailHistoryId: gmailMessage.historyId,
        subject: parsed.subject,
        sender: parsed.sender,
        receivedAt,
        processingStatus: "completed",
        announcementCount: 0
    });

    // Run AI extraction.
    let analysis;
    try {
        analysis = await analyzeEmail({
            id: parsed.id,
            threadId: parsed.threadId,
            subject: parsed.subject,
            sender: parsed.sender,
            receivedAt,
            body: parsed.body,
            htmlBody: parsed.htmlBody,
            snippet: parsed.snippet,
            urls: parsed.urls,
            labelIds: parsed.labelIds,
            internalDate: gmailMessage.internalDate
        });
    } catch (error) {
        await recordProcessedEmail(supabase, userId, gmailAccountId, {
            gmailMessageId: parsed.id,
            gmailThreadId: parsed.threadId,
            gmailHistoryId: gmailMessage.historyId,
            subject: parsed.subject,
            sender: parsed.sender,
            receivedAt,
            processingStatus: "failed",
            processingError: error.message,
            announcementCount: 0
        });
        return { processed: false, messageId: parsed.id, error: error.message };
    }

    const conflicts = detectContradictions(analysis.announcements);

    const announcementsWithConfidence = analysis.announcements.map((announcement, index) => {
        const normalized = normalizeDates(announcement, receivedAt);
        const isConflict = conflicts.some((c) => c.announcementIndex === index);

        return {
            ...normalized.announcement,
            source: {
                ...announcement.source,
                emailId: parsed.id,
                emailSubject: parsed.subject,
                sender: parsed.sender,
                receivedAt
            },
            reviewRequired: announcement.reviewRequired || isConflict,
            confidence: calculateConfidence(announcement),
            extractionWarnings: [
                ...(announcement.extractionWarnings ?? []),
                ...normalized.warnings,
                ...(isConflict
                    ? ["Contradictory information detected — review before relying on this announcement"]
                    : [])
            ]
        };
    });

    // Upsert the processed email record with the final announcement count.
    const processedEmail = await recordProcessedEmail(supabase, userId, gmailAccountId, {
        gmailMessageId: parsed.id,
        gmailThreadId: parsed.threadId,
        gmailHistoryId: gmailMessage.historyId,
        subject: parsed.subject,
        sender: parsed.sender,
        receivedAt,
        processingStatus: "completed",
        announcementCount: announcementsWithConfidence.length
    });

    // Store announcements with duplicate detection.
    const stored = await storeAnnouncements(supabase, userId, processedEmail.id, announcementsWithConfidence);

    // Create in-app notifications for newly extracted announcements.
    for (const announcement of stored ?? []) {
        try {
            await createAnnouncementNotification(adminClient, userId, announcement);
        } catch (notifyError) {
            console.error("Could not create notification:", notifyError.message);
        }
    }

    return {
        processed: true,
        messageId: parsed.id,
        announcementCount: stored.length,
        isRelevant: analysis.emailAnalysis.isRelevant
    };
};

// ---------------------------------------------------------------------------
// Announcement storage with duplicate detection
// ---------------------------------------------------------------------------

export const storeAnnouncements = async (supabase, userId, processedEmailId, announcements) => {
    const stored = [];

    for (const announcement of announcements) {
        const fingerprint = computeDedupeFingerprint({
            userId,
            title: announcement.title,
            organizationName: announcement.organization?.name ?? null,
            applicationLink: announcement.links?.applicationLink ?? null,
            applicationDeadline: announcement.dates?.applicationDeadline?.normalizedDate ?? null
        });

        const payload = {
            user_id: userId,
            processed_email_id: processedEmailId,
            title: announcement.title,
            short_title: announcement.shortTitle ?? null,
            description: announcement.description,
            primary_category: announcement.primaryCategory,
            secondary_category: announcement.secondaryCategory ?? null,
            announcement_type: announcement.announcementType ?? null,
            organization_name: announcement.organization?.name ?? null,
            organization_type: announcement.organization?.type ?? null,
            opportunity_details: announcement.opportunity ?? {},
            eligibility_details: announcement.eligibility ?? {},
            important_dates: announcement.dates ?? {},
            event_details: announcement.eventDetails ?? {},
            links: announcement.links ?? {},
            contact_details: announcement.contact ?? {},
            source_email_subject: announcement.source?.emailSubject ?? null,
            source_email_sender: announcement.source?.sender ?? null,
            source_email_received_at: announcement.source?.receivedAt ?? null,
            extraction_confidence: announcement.confidence ?? null,
            review_required: Boolean(announcement.reviewRequired),
            extraction_warnings: announcement.extractionWarnings ?? [],
            status: announcement.status ?? "upcoming",
            importance: "medium",
            is_bookmarked: false,
            is_read: false,
            dedupe_fingerprint: fingerprint
        };

        // Try insert; on fingerprint conflict, update the existing row to keep
        // the newest source reference instead of creating duplicates.
        const { data, error } = await supabase
            .from("email_announcements")
            .upsert(payload, {
                onConflict: "user_id, dedupe_fingerprint"
            })
            .select()
            .single();

        if (error) {
            // Fingerprint column may not exist on older DBs: fall back to plain insert.
            if (error.code === "42703" || error.message?.includes("dedupe_fingerprint")) {
                const { data: fallback, error: fallbackError } = await supabase
                    .from("email_announcements")
                    .insert({ ...payload, dedupe_fingerprint: null })
                    .select()
                    .single();

                if (fallbackError) {
                    throw databaseError(fallbackError);
                }

                stored.push(fallback);
                continue;
            }

            throw databaseError(error);
        }

        stored.push(data);
    }

    return stored;
};

export const findPotentialDuplicates = async (supabase, userId, { title, organizationName, applicationLink, applicationDeadline, limit = 10 }) => {
    const fingerprint = computeDedupeFingerprint({
        userId,
        title,
        organizationName,
        applicationLink,
        applicationDeadline
    });

    const { data, error } = await supabase
        .from("email_announcements")
        .select("id, title, organization_name, primary_category, important_dates, links, source_email_subject, source_email_received_at, created_at, dedupe_fingerprint")
        .eq("user_id", userId)
        .eq("dedupe_fingerprint", fingerprint)
        .limit(limit);

    if (error) {
        throw databaseError(error);
    }

    return data ?? [];
};

export const getAnnouncements = async (supabase, userId, filters) => {
    let query = supabase
        .from("email_announcements")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("status", "active");

    if (filters.category) {
        query = query.eq("primary_category", filters.category);
    }

    if (filters.importance) {
        query = query.eq("importance", filters.importance);
    }

    if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
    }

    if (filters.minCpi) {
        // eligibility_details is JSONB; query minimumCPI inside it.
        query = query.filter("eligibility_details->>minimumCPI", "gte", filters.minCpi);
    }

    if (filters.deadlineFrom) {
        query = query.filter("important_dates->>applicationDeadline", "gte", filters.deadlineFrom);
    }

    if (filters.deadlineTo) {
        query = query.filter("important_dates->>applicationDeadline", "lte", filters.deadlineTo);
    }

    const orderColumn = filters.sort === "deadline" ? "important_dates->>applicationDeadline" : "created_at";
    const ascending = filters.sort === "deadline";

    const { from, to } = getPagination(filters.page, filters.limit);

    const { data, error, count } = await query
        .order(orderColumn, { ascending, nullsFirst: !ascending })
        .range(from, to);

    if (error) {
        throw databaseError(error);
    }

    return {
        data: data ?? [],
        pagination: buildPagination(filters.page, filters.limit, count ?? 0)
    };
};

export const getAnnouncementById = async (supabase, userId, announcementId) => {
    const { data, error } = await supabase
        .from("email_announcements")
        .select("*")
        .eq("id", announcementId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Announcement not found");
    }

    return data;
};

export const updateAnnouncement = async (supabase, userId, announcementId, fields) => {
    const { data, error } = await supabase
        .from("email_announcements")
        .update({ ...fields, updated_at: nowIso() })
        .eq("id", announcementId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Announcement not found");
    }

    return data;
};

export const dismissAnnouncement = async (supabase, userId, announcementId) => {
    return updateAnnouncement(supabase, userId, announcementId, { status: "dismissed" });
};

export const toggleBookmark = async (supabase, userId, announcementId) => {
    const existing = await getAnnouncementById(supabase, userId, announcementId);

    return updateAnnouncement(supabase, userId, announcementId, {
        is_bookmarked: !existing.is_bookmarked
    });
};

export const markRead = async (supabase, userId, announcementId) => {
    return updateAnnouncement(supabase, userId, announcementId, { is_read: true });
};

export const getUnreadCount = async (supabase, userId) => {
    const { count, error } = await supabase
        .from("email_announcements")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("is_read", false);

    if (error) {
        throw databaseError(error);
    }

    return { unread: count ?? 0 };
};

// ---------------------------------------------------------------------------
// Notifications for new email announcements
// ---------------------------------------------------------------------------

const NOTIFICATION_TITLES = {
    internship: "New internship opportunity detected",
    summer_internship: "New summer internship detected",
    winter_internship: "New winter internship detected",
    full_time_placement: "New full-time placement detected",
    off_campus_placement: "New off-campus placement detected",
    on_campus_placement: "New on-campus placement detected",
    graduate_hiring: "New graduate hiring announced",
    job_opportunity: "New job opening detected",
    apprenticeship: "New apprenticeship detected",
    recruitment_drive: "New recruitment drive announced",
    referral_opportunity: "New referral opportunity detected",
    hackathon: "New hackathon registration opened",
    coding_competition: "New coding competition announced",
    technical_fest: "New technical fest announced",
    workshop: "New workshop announced",
    webinar: "New webinar announced",
    seminar: "New seminar announced",
    scholarship: "New scholarship announced",
    fellowship: "New fellowship announced",
    default: "New announcement detected"
};

const NOTIFICATION_MESSAGE = (category, title, deadline) => {
    const when = deadline ? ` Deadline: ${deadline}.` : "";
    return `A new ${category} opportunity "${title}" was extracted from your Gmail.${when}`;
};

export const createAnnouncementNotification = async (adminClient, userId, announcement) => {
    const { id, title, primary_category, importance, important_dates } = announcement;

    const deadline = important_dates?.applicationDeadline?.normalizedDate
        ? new Date(important_dates.applicationDeadline.normalizedDate).toISOString().slice(0, 10)
        : null;

    const titleText = NOTIFICATION_TITLES[primary_category] ?? NOTIFICATION_TITLES.default;
    const message = NOTIFICATION_MESSAGE(primary_category, title, deadline);

    const dedupeKey = `email:announcement:${userId}:${id}`;

    // Only notify for moderately important or higher, to avoid spam.
    if (!["critical", "high", "medium"].includes(importance)) {
        return { created: false, reason: "low importance" };
    }

    const { error } = await adminClient
        .from("notifications")
        .insert({
            user_id: userId,
            notice_id: null,
            type: "EMAIL_ANNOUNCEMENT",
            title: titleText,
            message,
            scheduled_for: new Date().toISOString(),
            dedupe_key: dedupeKey
        });

    if (error) {
        // Ignore duplicate dedupe key violations silently.
        if (error.code === "23505") {
            return { created: false, reason: "duplicate" };
        }
        throw databaseError(error);
    }

    return { created: true };
};

