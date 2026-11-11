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

const toStudentProfile = (payload) => ({
    department_id: payload.departmentId,
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

const checkInstitutionDepartment = async (supabase, institutionId, departmentId) => {
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

    const { data: department, error: departmentError } = await supabase
        .from("departments")
        .select("id, institution_id")
        .eq("id", departmentId)
        .maybeSingle();

    if (departmentError) {
        throw databaseError(departmentError);
    }

    if (!department) {
        throw new ApiError(400, "Department not found");
    }

    if (department.institution_id !== institutionId) {
        throw new ApiError(400, "Department does not belong to the selected institution");
    }
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
    await checkInstitutionDepartment(supabase, payload.institutionId, payload.departmentId);

    const { data, error } = await supabase
        .from("student_profiles")
        .insert({
            user_id: userId,
            ...toStudentProfile(payload)
        })
        .select("id, user_id, department_id, branch, semester, cpi, graduation_year, active_backlogs, interests")
        .single();

    if (error) {
        throw databaseError(error);
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
    const departmentId = payload.departmentId ?? existing.department_id;

    if (!institutionId) {
        throw new ApiError(400, "Institution is required");
    }

    await checkInstitutionDepartment(supabase, institutionId, departmentId);

    const fields = removeUndefined(toStudentProfile(payload));

    if (Object.keys(fields).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const { data, error } = await supabase
        .from("student_profiles")
        .update(fields)
        .eq("user_id", userId)
        .select("id, user_id, department_id, branch, semester, cpi, graduation_year, active_backlogs, interests")
        .single();

    if (error) {
        throw databaseError(error);
    }

    if (payload.institutionId) {
        await syncProfileInstitution(supabase, userId, payload.institutionId);
    }

    return data;
};
