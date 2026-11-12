import { ApiError, databaseError } from "../utils/errors.js";
import { buildPagination, getPagination } from "../utils/pagination.js";
import { addEligibility, getPublishedNotice, getStudentMatchingProfile, toEligibilityStudent } from "./notice.service.js";

export const saveNotice = async (supabase, userId, noticeId, institutionId) => {
    const notice = await getPublishedNotice(supabase, noticeId, institutionId);

    const { data, error } = await supabase
        .from("saved_notices")
        .insert({
            user_id: userId,
            notice_id: notice.id
        })
        .select("id, notice_id, created_at")
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new ApiError(409, "Notice is already saved");
        }

        throw databaseError(error);
    }

    return data;
};

export const removeSavedNotice = async (supabase, userId, noticeId) => {
    const { data, error } = await supabase
        .from("saved_notices")
        .delete()
        .eq("user_id", userId)
        .eq("notice_id", noticeId)
        .select("id, notice_id");

    if (error) {
        throw databaseError(error);
    }

    if (!data || data.length === 0) {
        throw new ApiError(404, "Saved notice not found");
    }

    return { noticeId };
};

export const getSavedNotices = async (supabase, userId, filters) => {
    const { from, to } = getPagination(filters.page, filters.limit);

    const { data, error, count } = await supabase
        .from("saved_notices")
        .select(`
            id,
            notice_id,
            created_at,
            notices (
                id,
                title,
                summary,
                category,
                deadline,
                published_at,
                application_url,
                file_name,
                eligible_branches,
                minimum_cpi,
                minimum_semester,
                maximum_semester,
                eligible_graduation_years,
                requires_no_backlogs
            )
        `, { count: "exact" })
        .eq("user_id", userId)
        .eq("notices.status", "PUBLISHED")
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        throw databaseError(error);
    }

    const rows = data ?? [];

    // Saved notices are shown next to the feed, so they carry the same
    // eligibility verdict instead of hiding it on the Saved page.
    if (rows.length === 0) {
        return {
            data: rows,
            pagination: buildPagination(filters.page, filters.limit, count ?? 0)
        };
    }

    let student = null;

    try {
        const profile = await getStudentMatchingProfile(supabase, userId);
        student = toEligibilityStudent(profile);
    } catch {
        student = null;
    }

    return {
        data: rows.map((row) =>
            row.notices ? { ...row, notices: addEligibility(row.notices, student) } : row
        ),
        pagination: buildPagination(filters.page, filters.limit, count ?? 0)
    };
};
