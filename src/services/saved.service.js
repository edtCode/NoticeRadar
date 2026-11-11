import { ApiError, databaseError } from "../utils/errors.js";
import { buildPagination, getPagination } from "../utils/pagination.js";
import { getPublishedNotice } from "./notice.service.js";

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
                file_name
            )
        `, { count: "exact" })
        .eq("user_id", userId)
        .eq("notices.status", "PUBLISHED")
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        throw databaseError(error);
    }

    return {
        data: data ?? [],
        pagination: buildPagination(filters.page, filters.limit, count ?? 0)
    };
};
