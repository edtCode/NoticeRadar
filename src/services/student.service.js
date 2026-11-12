import { ApiError, databaseError } from "../utils/errors.js";

const PROFILE_COLUMNS = `
    id,
    name,
    email,
    role,
    institution_id,
    created_at,
    updated_at,
    institutions ( id, name, slug ),
    student_profiles (
        id,
        user_id,
        department_id,
        branch,
        semester,
        cpi,
        graduation_year,
        active_backlogs,
        interests,
        created_at,
        updated_at,
        departments ( id, name )
    )
`;

const PROFILE_ROW_COLUMNS = "id, user_id, department_id, branch, semester, cpi, graduation_year, active_backlogs, interests";

const toStudentProfile = (payload) => ({
    branch: payload.branch,
    semester: payload.semester,
    cpi: payload.cpi,
    graduation_year: payload.graduationYear,
    active_backlogs: payload.activeBacklogs,
    interests: payload.interests
});

const removeUndefined = (object) => {
    return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
};

const checkInstitution = async (supabase, institutionId) => {
    const { data: institution, error: institutionError } = await supabase
        .from("institutions")
        .select("id")
        .eq("id", institutionId)
        .maybeSingle();

    if (institutionError) {
        throw databaseError(institutionError);
    }

    if (!institution) {
        throw new ApiError(400, "Institution not found");
    }
};

// Students type their department name, so the name is resolved to a department
// row for the chosen institution (creating it the first time it is used).
const resolveDepartmentId = async (supabase, institutionId, departmentName) => {
    const { data, error } = await supabase.rpc("find_or_create_department", {
        p_institution_id: institutionId,
        p_name: departmentName
    });

    if (error) {
        throw databaseError(error);
    }

    return data;
};

const syncProfileInstitution = async (supabase, userId, institutionId) => {
    const { error } = await supabase
        .from("profiles")
        .update({ institution_id: institutionId })
        .eq("id", userId);

    if (error) {
        throw databaseError(error);
    }
};

export const getStudentProfile = async (supabase, userId) => {
    const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
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

export const createStudentProfile = async (supabase, userId, payload) => {
    await checkInstitution(supabase, payload.institutionId);

    const departmentId = await resolveDepartmentId(supabase, payload.institutionId, payload.departmentName);

    const { data: inserted, error } = await supabase
        .from("student_profiles")
        .insert({
            user_id: userId,
            department_id: departmentId,
            ...toStudentProfile(payload)
        })
        .select(PROFILE_ROW_COLUMNS)
        .single();

    let data = inserted;

    if (error) {
        // Completing onboarding twice (a retry, or a slow first request that
        // already saved the profile) must not dead-end the student.
        if (error.code !== "23505") {
            throw databaseError(error);
        }

        const { data: existing, error: existingError } = await supabase
            .from("student_profiles")
            .select(PROFILE_ROW_COLUMNS)
            .eq("user_id", userId)
            .maybeSingle();

        if (existingError) {
            throw databaseError(existingError);
        }

        if (!existing) {
            throw databaseError(error);
        }

        data = existing;
    }

    await syncProfileInstitution(supabase, userId, payload.institutionId);

    return data;
};

export const updateStudentProfile = async (supabase, userId, payload) => {
    const { data: existing, error: existingError } = await supabase
        .from("student_profiles")
        .select("id, user_id, department_id")
        .eq("user_id", userId)
        .maybeSingle();

    if (existingError) {
        throw databaseError(existingError);
    }

    if (!existing) {
        throw new ApiError(404, "Student profile not found");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
        throw databaseError(profileError);
    }

    const institutionId = payload.institutionId ?? profile?.institution_id;

    if (!institutionId) {
        throw new ApiError(400, "Institution is required");
    }

    // Changing institution requires the typed department again so the profile
    // never keeps a department that belongs to the previous institution.
    if (payload.institutionId && payload.institutionId !== profile?.institution_id && !payload.departmentName) {
        throw new ApiError(400, "Department name is required when changing institution");
    }

    const departmentId = payload.departmentName
        ? await resolveDepartmentId(supabase, institutionId, payload.departmentName)
        : existing.department_id;

    const fields = { ...removeUndefined(toStudentProfile(payload)), department_id: departmentId };

    if (Object.keys(fields).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const { data, error } = await supabase
        .from("student_profiles")
        .update(fields)
        .eq("user_id", userId)
        .select(PROFILE_ROW_COLUMNS)
        .single();

    if (error) {
        throw databaseError(error);
    }

    if (payload.institutionId) {
        await syncProfileInstitution(supabase, userId, payload.institutionId);
    }

    return data;
};
