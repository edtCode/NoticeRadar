import { ApiError, databaseError } from "../utils/errors.js";
import { buildPagination, getPagination } from "../utils/pagination.js";
import { checkEligibility } from "./eligibility.service.js";

export const NOTICE_COLUMNS = `
    id,
    institution_id,
    title,
    description,
    summary,
    category,
    application_url,
    source_url,
    deadline,
    published_at,
    status,
    created_by,
    approved_by,
    file_path,
    file_name,
    file_size,
    eligible_branches,
    minimum_cpi,
    minimum_semester,
    maximum_semester,
    eligible_graduation_years,
    requires_no_backlogs,
    required_documents,
    duration,
    extracted_data,
    extraction_evidence,
    extraction_status,
    extraction_error,
    extracted_at,
    review_status,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at,
    archived_at
`;

const REVIEWABLE_COLUMNS = [
    "title",
    "summary",
    "category",
    "deadline",
    "eligible_branches",
    "minimum_cpi",
    "minimum_semester",
    "maximum_semester",
    "eligible_graduation_years",
    "requires_no_backlogs",
    "required_documents",
    "duration",
    "application_url"
];

const removeUndefined = (object) => {
    return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
};

const toNoticeFields = (payload) => {
    return removeUndefined({
        title: payload.title,
        description: payload.description,
        summary: payload.summary,
        category: payload.category,
        application_url: payload.applicationUrl,
        source_url: payload.sourceUrl,
        deadline: payload.deadline,
        eligible_branches: payload.eligibleBranches,
        minimum_cpi: payload.minimumCPI,
        minimum_semester: payload.minimumSemester,
        maximum_semester: payload.maximumSemester,
        eligible_graduation_years: payload.eligibleGraduationYears,
        requires_no_backlogs: payload.requiresNoBacklogs,
        required_documents: payload.requiredDocuments,
        duration: payload.duration,
        status: payload.status
    });
};

const toReviewFields = (payload) => {
    return removeUndefined({
        title: payload.title,
        summary: payload.summary,
        category: payload.category,
        deadline: payload.deadline,
        eligible_branches: payload.eligibleBranches,
        minimum_cpi: payload.minimumCPI,
        minimum_semester: payload.minimumSemester,
        maximum_semester: payload.maximumSemester,
        eligible_graduation_years: payload.eligibleGraduationYears,
        requires_no_backlogs: payload.requiresNoBacklogs,
        required_documents: payload.requiredDocuments,
        duration: payload.duration,
        application_url: payload.applicationUrl
    });
};

const endOfDay = (date) => `${date}T23:59:59.999Z`;

const applyFilters = (query, filters) => {
    let result = query;

    if (filters.category) {
        result = result.eq("category", filters.category);
    }

    if (filters.search) {
        result = result.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
        );
    }

    if (filters.publishedFrom) {
        result = result.gte("published_at", filters.publishedFrom);
    }

    if (filters.publishedTo) {
        result = result.lte("published_at", endOfDay(filters.publishedTo));
    }

    if (filters.deadlineFrom) {
        result = result.gte("deadline", filters.deadlineFrom);
    }

    if (filters.deadlineTo) {
        result = result.lte("deadline", endOfDay(filters.deadlineTo));
    }

    return result;
};

const paginate = async (query, filters, orderColumn, ascending = false) => {
    const { from, to } = getPagination(filters.page, filters.limit);

    const { data, error, count } = await query
        .order(orderColumn, { ascending })
        .range(from, to);

    if (error) {
        throw databaseError(error);
    }

    return {
        data: data ?? [],
        pagination: buildPagination(filters.page, filters.limit, count ?? 0)
    };
};

const pickReviewable = (notice) => {
    return REVIEWABLE_COLUMNS.reduce((result, column) => {
        result[column] = notice[column];
        return result;
    }, {});
};

const recordVersion = async (supabase, noticeId, userId, previousData, updatedData) => {
    const { error } = await supabase.from("notice_versions").insert({
        notice_id: noticeId,
        previous_data: previousData,
        updated_data: updatedData,
        changed_by: userId
    });

    if (error) {
        console.error("Could not record notice version:", error);
    }
};

export const createNotice = async (supabase, payload, user) => {
    if (!user.institutionId) {
        throw new ApiError(400, "Your admin account is not assigned to an institution");
    }

    const { data, error } = await supabase
        .from("notices")
        .insert({
            ...toNoticeFields(payload),
            status: "DRAFT",
            institution_id: user.institutionId,
            created_by: user.id
        })
        .select(NOTICE_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const getAdminNotices = async (supabase, institutionId, filters) => {
    let query = supabase
        .from("notices")
        .select(NOTICE_COLUMNS, { count: "exact" })
        .eq("institution_id", institutionId);

    if (filters.status) {
        query = query.eq("status", filters.status);
    }

    return paginate(applyFilters(query, filters), filters, "created_at");
};

export const getAdminNotice = async (supabase, noticeId, institutionId) => {
    const { data, error } = await supabase
        .from("notices")
        .select(NOTICE_COLUMNS)
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Notice not found");
    }

    return data;
};

export const updateNotice = async (supabase, noticeId, institutionId, userId, payload) => {
    const existing = await getAdminNotice(supabase, noticeId, institutionId);
    const fields = toNoticeFields(payload);

    if (Object.keys(fields).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    if (payload.status === "PUBLISHED" && existing.review_status !== "APPROVED") {
        throw new ApiError(409, "Notice must be approved before it can be published");
    }

    if (payload.status === "ARCHIVED" && existing.status !== "ARCHIVED") {
        fields.archived_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from("notices")
        .update(fields)
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .select(NOTICE_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    await recordVersion(supabase, noticeId, userId, pickReviewable(existing), pickReviewable(data));

    return data;
};

export const publishNotice = async (supabase, noticeId, institutionId, userId) => {
    const existing = await getAdminNotice(supabase, noticeId, institutionId);

    if (existing.review_status !== "APPROVED") {
        throw new ApiError(409, "Notice must be approved before it can be published");
    }

    if (existing.status === "ARCHIVED") {
        throw new ApiError(400, "Archived notices cannot be published");
    }

    const { data, error } = await supabase
        .from("notices")
        .update({
            status: "PUBLISHED",
            published_at: new Date().toISOString(),
            approved_by: userId
        })
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .select(NOTICE_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const archiveNotice = async (supabase, noticeId, institutionId) => {
    await getAdminNotice(supabase, noticeId, institutionId);

    const { data, error } = await supabase
        .from("notices")
        .update({
            status: "ARCHIVED",
            archived_at: new Date().toISOString()
        })
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .select(NOTICE_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};

export const getPendingReviewNotices = async (supabase, institutionId, filters) => {
    const query = supabase
        .from("notices")
        .select(NOTICE_COLUMNS, { count: "exact" })
        .eq("institution_id", institutionId)
        .eq("review_status", "PENDING_REVIEW");

    return paginate(applyFilters(query, filters), filters, "created_at");
};

export const getNoticeExtraction = async (supabase, noticeId, institutionId) => {
    const notice = await getAdminNotice(supabase, noticeId, institutionId);

    const { data: logs, error } = await supabase
        .from("notice_processing_logs")
        .select("id, status, error_message, started_at, completed_at, created_at")
        .eq("notice_id", noticeId)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        throw databaseError(error);
    }

    return {
        noticeId: notice.id,
        extractionStatus: notice.extraction_status,
        reviewStatus: notice.review_status,
        extractionError: notice.extraction_error,
        extractedAt: notice.extracted_at,
        extractedData: notice.extracted_data,
        evidence: notice.extraction_evidence,
        approvedData: pickReviewable(notice),
        logs: logs ?? []
    };
};

export const reviewNotice = async (supabase, noticeId, institutionId, userId, payload) => {
    const existing = await getAdminNotice(supabase, noticeId, institutionId);
    const fields = toReviewFields(payload);

    if (payload.decision === "APPROVED") {
        fields.review_status = "APPROVED";
        fields.reviewed_by = userId;
        fields.reviewed_at = new Date().toISOString();
    }

    if (payload.decision === "REJECTED") {
        fields.review_status = "REJECTED";
        fields.reviewed_by = userId;
        fields.reviewed_at = new Date().toISOString();
    }

    if (Object.keys(fields).length === 0) {
        throw new ApiError(400, "No review changes supplied");
    }

    const { data, error } = await supabase
        .from("notices")
        .update(fields)
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .select(NOTICE_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    const previousData = pickReviewable(existing);
    const updatedData = { ...pickReviewable(data), reviewNote: payload.reviewNote ?? null };

    await recordVersion(supabase, noticeId, userId, previousData, updatedData);

    return data;
};

const getStudentMatchingProfile = async (supabase, userId) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, institution_id, student_profiles ( branch, semester, cpi, graduation_year, active_backlogs )")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Profile not found");
    }

    return data;
};

const toEligibilityStudent = (profile) => {
    const studentProfile = Array.isArray(profile.student_profiles)
        ? profile.student_profiles[0]
        : profile.student_profiles;

    if (!studentProfile) {
        return null;
    }

    return {
        branch: studentProfile.branch,
        semester: studentProfile.semester,
        cpi: studentProfile.cpi,
        graduationYear: studentProfile.graduation_year,
        activeBacklogs: studentProfile.active_backlogs
    };
};

const addEligibility = (notice, student) => {
    if (!student) {
        return { ...notice, eligibility: { status: "POSSIBLY_ELIGIBLE", reasons: ["Complete your student profile to check eligibility"], missingFields: ["studentProfile"] } };
    }

    return { ...notice, eligibility: checkEligibility(student, notice) };
};

export const getNoticeFeed = async (supabase, user, filters) => {
    if (!user.institutionId) {
        throw new ApiError(400, "Complete your student profile before viewing notices");
    }

    const profile = await getStudentMatchingProfile(supabase, user.id);
    const student = toEligibilityStudent(profile);

    const query = supabase
        .from("notices")
        .select(NOTICE_COLUMNS, { count: "exact" })
        .eq("institution_id", user.institutionId)
        .eq("status", "PUBLISHED");

    const filtered = applyFilters(query, filters);
    const orderColumn = filters.sort === "deadline" ? "deadline" : "published_at";

    if (!filters.eligibility) {
        const result = await paginate(filtered, filters, orderColumn, filters.sort === "deadline");

        return {
            data: result.data.map((notice) => addEligibility(notice, student)),
            pagination: result.pagination
        };
    }

    const { data, error } = await filtered
        .order(orderColumn, { ascending: filters.sort === "deadline" })
        .limit(200);

    if (error) {
        throw databaseError(error);
    }

    const matches = (data ?? [])
        .map((notice) => addEligibility(notice, student))
        .filter((notice) => notice.eligibility.status === filters.eligibility);

    const { from, to } = getPagination(filters.page, filters.limit);

    return {
        data: matches.slice(from, to + 1),
        pagination: buildPagination(filters.page, filters.limit, matches.length)
    };
};

export const searchNotices = async (supabase, user, filters) => {
    if (!user.institutionId) {
        throw new ApiError(400, "Complete your student profile before viewing notices");
    }

    const query = supabase
        .from("notices")
        .select(NOTICE_COLUMNS, { count: "exact" })
        .eq("institution_id", user.institutionId)
        .eq("status", "PUBLISHED");

    const result = await paginate(applyFilters(query, filters), filters, "published_at");

    return result;
};

export const getNoticeEligibility = async (supabase, user, noticeId) => {
    const notice = await getPublishedNotice(supabase, noticeId, user.institutionId);
    const profile = await getStudentMatchingProfile(supabase, user.id);
    const student = toEligibilityStudent(profile);

    return {
        noticeId: notice.id,
        eligibility: student
            ? checkEligibility(student, notice)
            : { status: "POSSIBLY_ELIGIBLE", reasons: ["Complete your student profile to check eligibility"], missingFields: ["studentProfile"] }
    };
};

export const getPublishedNotices = async (supabase, institutionId, filters) => {
    if (!institutionId) {
        throw new ApiError(400, "Complete your student profile before viewing notices");
    }

    const query = supabase
        .from("notices")
        .select(NOTICE_COLUMNS, { count: "exact" })
        .eq("institution_id", institutionId)
        .eq("status", "PUBLISHED");

    return paginate(applyFilters(query, filters), filters, "published_at");
};

export const getPublishedNotice = async (supabase, noticeId, institutionId) => {
    if (!institutionId) {
        throw new ApiError(400, "Complete your student profile before viewing notices");
    }

    const { data, error } = await supabase
        .from("notices")
        .select(NOTICE_COLUMNS)
        .eq("id", noticeId)
        .eq("institution_id", institutionId)
        .eq("status", "PUBLISHED")
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (!data) {
        throw new ApiError(404, "Notice not found");
    }

    return data;
};

export const getUpcomingDeadlines = async (supabase, user, { days, limit }) => {
    if (!user.institutionId) {
        throw new ApiError(400, "Complete your student profile before viewing deadlines");
    }

    const today = new Date().toISOString();
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from("notices")
        .select(NOTICE_COLUMNS)
        .eq("institution_id", user.institutionId)
        .eq("status", "PUBLISHED")
        .gte("deadline", today)
        .lte("deadline", until)
        .order("deadline", { ascending: true })
        .limit(limit);

    if (error) {
        throw databaseError(error);
    }

    const profile = await getStudentMatchingProfile(supabase, user.id);
    const student = toEligibilityStudent(profile);

    return (data ?? []).map((notice) => addEligibility(notice, student));
};
