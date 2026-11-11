import { ApiError, databaseError, sendError } from "../utils/errors.js";

export const authenticate = async (req, res, next) => {
    try {
        const [scheme, token] = (req.headers.authorization || "").split(" ");

        if (scheme?.toLowerCase() !== "bearer" || !token) {
            throw new ApiError(401, "Missing or invalid authorization header");
        }

        const { createUserClient } = req.app.locals.supabaseClients;
        const supabase = createUserClient(token);

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            const status = Number(error?.status ?? 0);
            const transient = status >= 500
                || error?.name === "AuthRetryableFetchError"
                || /fetch failed|network|socket|timed? ?out|ECONNRESET|ENOTFOUND/i.test(error?.message ?? "");

            if (transient) {
                throw new ApiError(503, "Authentication service is temporarily unavailable");
            }

            throw new ApiError(401, "Invalid or expired access token");
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, email, role, institution_id")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profileError) {
            throw databaseError(profileError);
        }

        if (!profile) {
            throw new ApiError(403, "Profile not found for this account");
        }

        req.user = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            institutionId: profile.institution_id
        };
        req.supabase = supabase;

        next();

    } catch (error) {
        sendError(res, error);
    }
};
