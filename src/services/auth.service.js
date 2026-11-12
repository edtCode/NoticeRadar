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
        if (insertError.code === "23505") {
            // Another request created the profile between our read and write.
            const { data: raced, error: racedError } = await adminClient
                .from("profiles")
                .select("id, name, email, role, institution_id")
                .eq("id", user.id)
                .maybeSingle();

            if (racedError) {
                throw databaseError(racedError);
            }

            if (raced) {
                return raced;
            }
        }

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
        const message = error.message ?? "";
        const code = error.code ?? "";

        if (code === "user_already_exists" || /already registered|already exists/i.test(message)) {
            throw new ApiError(409, "Email already registered");
        }

        // Supabase's built-in mailer is limited to a couple of emails per hour.
        // Without a custom SMTP provider, repeated signups hit this wall first.
        if (code === "over_email_send_rate_limit" || error.status === 429 ||
            /rate limit|too many requests|only request this after/i.test(message)) {
            throw new ApiError(
                429,
                "Too many confirmation emails were sent from this project in the last hour. Please try again later, or configure a custom SMTP provider in Supabase."
            );
        }

        if (code === "signup_disabled" || /signups? not allowed|signup is disabled/i.test(message)) {
            throw new ApiError(403, "New sign-ups are disabled for this project");
        }

        if (/unable to validate email address|invalid email/i.test(message)) {
            throw new ApiError(400, "Enter a valid email address");
        }

        if (code === "weak_password" || /password should be at least/i.test(message)) {
            throw new ApiError(400, message || "Password is too weak");
        }

        throw new ApiError(400, message || "Registration failed");
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
