import { ApiError, databaseError } from "../utils/errors.js";
import { buildPagination, getPagination } from "../utils/pagination.js";
import { checkEligibility } from "./eligibility.service.js";

export const REMINDER_DAYS = [7, 3, 1];

export const buildDedupeKey = (userId, noticeId, days) => `${userId}:${noticeId}:${days}`;

export const getReminderTimes = (deadline, now = new Date()) => {
    const deadlineDate = new Date(deadline);

    if (Number.isNaN(deadlineDate.getTime())) {
        return [];
    }

    return REMINDER_DAYS
        .map((days) => {
            const scheduledFor = new Date(deadlineDate.getTime() - days * 24 * 60 * 60 * 1000);
            scheduledFor.setUTCHours(9, 0, 0, 0);

            return { days, scheduledFor };
        })
        .filter((reminder) => reminder.scheduledFor.getTime() > now.getTime());
};

const toStudent = (studentProfile) => ({
    branch: studentProfile.branch,
    semester: studentProfile.semester,
    cpi: studentProfile.cpi,
    graduationYear: studentProfile.graduation_year,
    activeBacklogs: studentProfile.active_backlogs
});

const buildReminderRows = (profiles, notice, times) => {
    const rows = [];

    for (const profile of profiles) {
        const studentProfile = Array.isArray(profile.student_profiles)
            ? profile.student_profiles[0]
            : profile.student_profiles;

        if (!studentProfile) {
            continue;
        }

        const eligibility = checkEligibility(toStudent(studentProfile), notice);

        if (!["ELIGIBLE", "POSSIBLY_ELIGIBLE"].includes(eligibility.status)) {
            continue;
        }

        for (const { days, scheduledFor } of times) {
            rows.push({
                user_id: profile.id,
                notice_id: notice.id,
                type: "DEADLINE_REMINDER",
                title: `Deadline in ${days} ${days === 1 ? "day" : "days"}`,
                message: `${notice.title} closes on ${String(notice.deadline).slice(0, 10)}.`,
                scheduled_for: scheduledFor.toISOString(),
                dedupe_key: buildDedupeKey(profile.id, notice.id, days)
            });
        }
    }

    return rows;
};

export const clearFutureReminders = async (adminClient, noticeId) => {
    const { error } = await adminClient
        .from("notifications")
        .delete()
        .eq("notice_id", noticeId)
        .is("read_at", null)
        .gt("scheduled_for", new Date().toISOString());

    if (error) {
        console.error("Could not clear future reminders:", error);
    }
};

export const replaceFutureReminders = async (adminClient, notice) => {
    await clearFutureReminders(adminClient, notice.id);

    return queueReminders(adminClient, notice);
};

export const queueReminders = async (adminClient, notice) => {
    if (notice.status !== "PUBLISHED" || notice.review_status !== "APPROVED" || !notice.deadline) {
        return { created: 0 };
    }

    const times = getReminderTimes(notice.deadline);

    if (times.length === 0) {
        return { created: 0 };
    }

    const { data: profiles, error } = await adminClient
        .from("profiles")
        .select("id, student_profiles ( branch, semester, cpi, graduation_year, active_backlogs )")
        .eq("institution_id", notice.institution_id);

    if (error) {
        throw databaseError(error);
    }

    const rows = buildReminderRows(profiles ?? [], notice, times);

    if (rows.length === 0) {
        return { created: 0 };
    }

    const { error: insertError } = await adminClient
        .from("notifications")
        .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true });

    if (insertError) {
        throw databaseError(insertError);
    }

    return { created: rows.length };
};

export const runDeadlineReminderJob = async (adminClient) => {
    const now = new Date().toISOString();

    const { data: notices, error } = await adminClient
        .from("notices")
        .select("id, institution_id, title, deadline, status, review_status")
        .eq("status", "PUBLISHED")
        .eq("review_status", "APPROVED")
        .gte("deadline", now)
        .limit(100);

    if (error) {
        throw databaseError(error);
    }

    let created = 0;

    for (const notice of notices ?? []) {
        const result = await queueReminders(adminClient, notice);
        created += result.created;
    }

    return { notices: notices?.length ?? 0, reminders: created };
};

export const getUserNotifications = async (supabase, userId, filters) => {
    const { from, to } = getPagination(filters.page, filters.limit);
    const now = new Date().toISOString();

    const { data, error, count } = await supabase
        .from("notifications")
        .select("id, notice_id, type, title, message, scheduled_for, created_at, read_at", { count: "exact" })
        .eq("user_id", userId)
        .lte("scheduled_for", now)
        .order("scheduled_for", { ascending: false })
        .range(from, to);

    if (error) {
        throw databaseError(error);
    }

    return {
        data: data ?? [],
        pagination: buildPagination(filters.page, filters.limit, count ?? 0)
    };
};

export const getUnreadCount = async (supabase, userId) => {
    const now = new Date().toISOString();

    const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)
        .lte("scheduled_for", now);

    if (error) {
        throw databaseError(error);
    }

    return { unread: count ?? 0 };
};

export const markNotificationRead = async (supabase, userId, notificationId) => {
    const { data, error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select("id, notice_id, type, title, message, scheduled_for, created_at, read_at")
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Notification not found");
    }

    return data;
};
