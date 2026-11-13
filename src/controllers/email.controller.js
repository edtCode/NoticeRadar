import {
    getGmailAuthUrl as getGmailAuthUrlService,
    exchangeCodeForTokens as exchangeCodeForTokensService,
    getGmailClientFromEncrypted,
    listMessages,
    getMessage,
    getHistory,
    listHistoryMessages,
    refreshAccessToken,
    getGoogleUserInfo
} from "../services/gmail.service.js";
import {
    connectGmailAccount,
    getGmailAccount,
    disconnectGmailAccount,
    updateGmailHistoryId,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    dismissAnnouncement,
    toggleBookmark,
    markRead,
    getUnreadCount
} from "../services/email-announcement.service.js";
import { env } from "../config/env.js";
import { sendError } from "../utils/errors.js";
import { createAnnouncementNotification } from "../services/email-announcement.service.js";

const getAdminClient = (req) => req.app.locals.supabaseClients.getAdminClient();

// ---------------------------------------------------------------------------
// Gmail OAuth
// ---------------------------------------------------------------------------

export const getGmailAuthUrl = async (req, res) => {
    try {
        const userId = req.user.id;
        const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");
        const url = getGmailAuthUrlService(state);

        res.status(200).json({
            data: { authUrl: url, state }
        });
    } catch (error) {
        sendError(res, error);
    }
};

export const gmailOAuthCallback = async (req, res) => {
    const adminClient = getAdminClient(req);
    const { code, state } = req.query;

    if (!code) {
        // Google redirects here on error too. Send the user back to the
        // frontend with an error flag.
        const frontendUrl = `${env.appUrl}/student/gmail-connect?error=access_denied`;
        return res.redirect(frontendUrl);
    }

    let userId;

    // Recover the authenticated user id from the state parameter.
    if (state) {
        try {
            const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
            userId = decoded?.userId ?? null;
        } catch {
            userId = null;
        }
    }

    if (!userId) {
        return res.redirect(`${env.appUrl}/student/gmail-connect?error=invalid_state`);
    }

    // NOTE: This callback is reached by the browser via Google's redirect.
    // We cannot fully bind this request to req.user (no bearer token in a
    // browser redirect), so we trust the state payload which was generated
    // from the authenticated session. The state contains only the user id.

    try {
        const tokens = await exchangeCodeForTokensService(code);

        if (!tokens.accessToken) {
            return res.redirect(`${env.appUrl}/student/gmail-connect?error=no_token`);
        }

        // Fetch the real Google profile so we store the actual `sub` and email.
        let googleSub = userId;
        let emailAddress = null;

        try {
            const profile = await getGoogleUserInfo(tokens.accessToken);
            if (profile.id) {
                googleSub = profile.id;
            }
            if (profile.email) {
                emailAddress = profile.email;
            }
        } catch (profileError) {
            // Non-fatal: continue with the authenticated user id as the sub.
            console.error("Could not fetch Google userinfo:", profileError.message);
        }

        const account = await connectGmailAccount(adminClient, userId, {
            googleSub,
            emailAddress,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? null,
            tokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : null,
            scope: tokens.scope
        });

        return res.redirect(
            `${env.appUrl}/student/gmail-connect?success=1&email=${encodeURIComponent(emailAddress ?? "")}`
        );
    } catch (error) {
        console.error("Gmail OAuth callback error:", error.message);
        return res.redirect(`${env.appUrl}/student/gmail-connect?error=callback_failed`);
    }
};

export const getGmailStatus = async (req, res) => {
    try {
        const account = await getGmailAccount(req.supabase, req.user.id);

        res.status(200).json({
            data: {
                connected: Boolean(account),
                emailAddress: account ? account.email_address : null,
                lastHistoryId: account ? account.last_history_id : null
            }
        });
    } catch (error) {
        sendError(res, error);
    }
};

export const disconnectGmail = async (req, res) => {
    try {
        await disconnectGmailAccount(req.supabase, req.user.id);

        res.status(200).json({ data: { message: "Gmail account disconnected" } });
    } catch (error) {
        sendError(res, error);
    }
};

// ---------------------------------------------------------------------------
// Gmail sync
// ---------------------------------------------------------------------------

const extractReceivedAt = (message) => {
    const internalDate = message.internalDate ? Number(message.internalDate) : null;
    return internalDate ? new Date(internalDate).toISOString() : null;
};

const processSingleEmail = async (supabase, adminClient, gmailAccountId, userId, message) => {
    return processIncomingMessage(supabase, adminClient, gmailAccountId, userId, message);
};

export const syncGmail = async (req, res) => {
    const adminClient = getAdminClient(req);
    const userId = req.user.id;
    const { fullSync = false, maxResults = 50 } = req.body;

    try {
        const account = await getGmailAccount(req.supabase, userId);

        if (!account) {
            return res.status(409).json({ error: "Gmail account not connected" });
        }

        let gmail;
        try {
            gmail = await getGmailClientFromEncrypted(account.access_token, account.refresh_token);
        } catch (error) {
            return res.status(503).json({ error: "Unable to authenticate with Gmail: " + error.message });
        }

        // Seed history ID on first sync.
        let startHistoryId = account.last_history_id;

        if (!startHistoryId || fullSync) {
            if (fullSync) {
                // Process messages from the inbox directly (bounded).
                const list = await listMessages(gmail, {
                    userId: "me",
                    query: "in:inbox",
                    maxResults
                });

                const results = [];

                for (const msg of list.messages ?? []) {
                    const full = await getMessage(gmail, { userId: "me", id: msg.id });
                    const result = await processSingleEmail(req.supabase, adminClient, account.id, userId, full);
                    results.push(result);
                }

                const history = await getHistory(gmail, { userId: "me" });

                if (history) {
                    await updateGmailHistoryId(adminClient, account.id, history);
                }

                return res.status(200).json({
                    data: {
                        mode: "full",
                        processed: results.length,
                        results,
                        historyId: history
                    }
                });
            }

            startHistoryId = await getHistory(gmail, { userId: "me" });

            if (startHistoryId) {
                await updateGmailHistoryId(adminClient, account.id, startHistoryId);
            }

            return res.status(200).json({
                data: {
                    mode: "seeded",
                    message: "Gmail sync seeded. Subsequent syncs will be incremental.",
                    historyId: startHistoryId
                }
            });
        }

        // Incremental history sync.
        const history = await listHistoryMessages(gmail, {
            userId: "me",
            startHistoryId,
            maxResults
        });

        const results = [];

        for (const msg of history.messages ?? []) {
            const full = await getMessage(gmail, { userId: "me", id: msg.id });
            const result = await processSingleEmail(req.supabase, adminClient, gmail, userId, account.id, full);
            results.push(result);
        }

        if (history.newHistoryId) {
            await updateGmailHistoryId(adminClient, account.id, history.newHistoryId);
        }

        return res.status(200).json({
            data: {
                mode: "incremental",
                processed: results.length,
                results,
                historyId: history.newHistoryId
            }
        });
    } catch (error) {
        sendError(res, error);
    }
};

// ---------------------------------------------------------------------------
// Announcements CRUD
// ---------------------------------------------------------------------------

export const listAnnouncements = async (req, res) => {
    try {
        const result = await getAnnouncements(req.supabase, req.user.id, req.validatedQuery);

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

export const getAnnouncement = async (req, res) => {
    try {
        const announcement = await getAnnouncementById(req.supabase, req.user.id, req.params.id);

        res.status(200).json({ data: announcement });
    } catch (error) {
        sendError(res, error);
    }
};

export const toggleBookmarkAnnouncement = async (req, res) => {
    try {
        const announcement = await toggleBookmark(req.supabase, req.user.id, req.params.id);

        res.status(200).json({ data: announcement });
    } catch (error) {
        sendError(res, error);
    }
};

export const markAnnouncementRead = async (req, res) => {
    try {
        const announcement = await markRead(req.supabase, req.user.id, req.params.id);

        res.status(200).json({ data: announcement });
    } catch (error) {
        sendError(res, error);
    }
};

export const dismissAnnouncementController = async (req, res) => {
    try {
        const announcement = await dismissAnnouncement(req.supabase, req.user.id, req.params.id);

        res.status(200).json({ data: announcement });
    } catch (error) {
        sendError(res, error);
    }
};

export const getAnnouncementsUnreadCount = async (req, res) => {
    try {
        const result = await getUnreadCount(req.supabase, req.user.id);

        res.status(200).json({ data: result });
    } catch (error) {
        sendError(res, error);
    }
};
