import { env } from "../config/env.js";
import { ApiError, databaseError } from "../utils/errors.js";
import { isMailEnabled, sendConfirmationEmail } from "./mail.service.js";

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

const toRegisterError = (error) => {
    const message = error.message ?? "";
    const code = error.code ?? "";

    if (code === "user_already_exists" || code === "email_exists" ||
        /already registered|already exists|already been registered/i.test(message)) {
        return new ApiError(409, "Email already registered");
    }

    // Supabase's built-in mailer is limited to a couple of emails per hour.
    // Without a custom SMTP provider, repeated signups hit this wall first.
    if (code === "over_email_send_rate_limit" || error.status === 429 ||
        /rate limit|too many requests|only request this after/i.test(message)) {
        return new ApiError(
            429,
            "Too many confirmation emails were sent from this project in the last hour. Please try again later, or configure a custom SMTP provider in Supabase."
        );
    }

    if (code === "signup_disabled" || /signups? not allowed|signup is disabled/i.test(message)) {
        return new ApiError(403, "New sign-ups are disabled for this project");
    }

    if (/unable to validate email address|invalid email/i.test(message)) {
        return new ApiError(400, "Enter a valid email address");
    }

    if (code === "weak_password" || /password should be at least/i.test(message)) {
        return new ApiError(400, message || "Password is too weak");
    }

    return new ApiError(400, message || "Registration failed");
};

const discardUnconfirmedUser = async (adminClient, userId) => {
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
        console.error("Could not roll back unconfirmed user:", error.message);
    }
};

// Sends the confirmation email through Resend so signups are not capped by
// Supabase's built-in mailer. The account is created unconfirmed and rolled
// back if the email cannot be sent, so the user can simply try again.
const registerWithMailer = async (adminClient, { name, email, password }) => {
    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { name }
    });

    if (error) {
        throw toRegisterError(error);
    }

    if (!data?.user) {
        throw new ApiError(500, "Registration failed");
    }

    const { data: link, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { redirectTo: `${env.appUrl}/login` }
    });

    if (linkError || !link?.properties?.action_link) {
        console.error("Could not generate confirmation link:", linkError?.message);
        await discardUnconfirmedUser(adminClient, data.user.id);
        throw new ApiError(502, "Could not create a confirmation link. Please try again.");
    }

    try {
        await sendConfirmationEmail({
            to: email,
            name,
            confirmationUrl: link.properties.action_link
        });
    } catch (sendError) {
        console.error("Could not send confirmation email:", sendError.message);
        await discardUnconfirmedUser(adminClient, data.user.id);
        throw new ApiError(502, "We could not send the confirmation email. Please try again in a moment.");
    }

    const profile = await ensureProfile(adminClient, { id: data.user.id, name, email });

    return {
        user: toUser(profile),
        session: null,
        requiresEmailConfirmation: true
    };
};

export const registerUser = async ({ publicClient, adminClient }, payload) => {
    const { name, email, password } = payload;

    if (await isMailEnabled()) {
        return registerWithMailer(adminClient, { name, email, password });
    }

    const { data, error } = await publicClient.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    if (error) {
        throw toRegisterError(error);
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
