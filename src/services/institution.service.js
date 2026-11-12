import { databaseError } from "../utils/errors.js";

export const getInstitutions = async (supabase) => {
    const { data, error } = await supabase
        .from("institutions")
        .select("id, name, slug, city, state, institution_type")
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

// Matching, ranking and wildcard escaping live in the SQL function so the
// query stays index-assisted and user input is never interpolated into SQL.
export const searchInstitutions = async (supabase, query) => {
    const { data, error } = await supabase.rpc("search_institutions", {
        search_query: query,
        max_results: 8
    });

    if (error) {
        throw databaseError(error);
    }

    return data ?? [];
};

export const createInstitutionRequest = async (supabase, userId, payload) => {
    const { data, error } = await supabase
        .from("institution_requests")
        .insert({
            name: payload.name,
            city: payload.city ?? null,
            state: payload.state ?? null,
            institution_type: payload.institutionType ?? null,
            requested_by: userId
        })
        .select("id, name, city, state, institution_type, status, created_at")
        .single();

    if (error) {
        throw databaseError(error);
    }

    return data;
};
