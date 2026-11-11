import { databaseError } from "../utils/errors.js";

export const getInstitutions = async (supabase) => {
    const { data, error } = await supabase
        .from("institutions")
        .select("id, name, slug")
        .order("name", { ascending: true });

    if (error) {
        throw databaseError(error);
    }

    return data ?? [];
};

export const getDepartments = async (supabase, institutionId) => {
    const { data, error } = await supabase
        .from("departments")
        .select("id, name, institution_id")
        .eq("institution_id", institutionId)
        .order("name", { ascending: true });

    if (error) {
        throw databaseError(error);
    }

    return data ?? [];
};
