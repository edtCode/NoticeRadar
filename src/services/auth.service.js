import { ApiError, databaseError } from "../utils/errors.js";

const toUser = (profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    institutionId: profile.institution_id
});

const toSession = (session) => ({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    tokenType: session.token_type
});

const ensureProfile = async (adminClient, user) => {
    const { data: existing, error } = await adminClient
        .from("profiles")
        .select("id, name, email, role, institution_id")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        throw databaseError(error);
    }

    if (existing) {
        return existing;
    }

    const { data: created, error: insertError } = await adminClient
        .from("profiles")
        .insert({
            id: user.id,
            name: user.name,
            email: user.email,
            role: "STUDENT"
        })
        .select("id, name, email, role, institution_id")
        .single();

    if (insertError) {
        throw databaseError(insertError);
    }

    return created;
};

export const registerUser = async ({ publicClient, adminClient }, payload) => {
    const { name, email, password } = payload;

    const { data, error } = await publicClient.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    if (error) {
        if (/already registered|already exists/i.test(error.message)) {
            throw new ApiError(409, "Email already registered");
        }

        if (/rate limit|too many requests/i.test(error.message)) {
            throw new ApiError(429, "Too many registration emails right now, please try again later");
        }

        throw new ApiError(400, error.message);
    }

    if (!data.user) {
        throw new ApiError(500, "Registration failed");
    }

    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new ApiError(409, "Email already registered");
    }

    const profile = await ensureProfile(adminClient, { id: data.user.id, name, email });

    return {
        user: toUser(profile),
        session: data.session ? toSession(data.session) : null,
        requiresEmailConfirmation: !data.session
    };
};

export const loginUser = async ({ publicClient, adminClient }, payload) => {
    const { email, password } = payload;

    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
        throw new ApiError(401, "Invalid email or password");
    }

    const { data: profile, error: profileError } = await adminClient
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

    return {
        user: toUser(profile),
        session: toSession(data.session)
    };
};

export const logoutUser = async (supabase) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new ApiError(400, "Could not end the session");
    }
};
