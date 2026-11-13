import { google } from "googleapis";
import { env } from "../config/env.js";
import { encrypt, decrypt } from "../config/encryption.js";

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify"
];

let oauth2Client = null;

const getOAuth2Client = () => {
    if (!env.google.clientId || !env.google.clientSecret) {
        return null;
    }

    if (!oauth2Client) {
        oauth2Client = new google.auth.OAuth2(
            env.google.clientId,
            env.google.clientSecret,
            env.google.redirectUri
        );
    }

    return oauth2Client;
};

// Add Google-specific config to env. These are read lazily so missing values
// only fail when Gmail features are actually used.
const googleConfig = () => ({
    clientId: env.google.clientId,
    clientSecret: env.google.clientSecret,
    redirectUri: env.google.redirectUri
});

export const getGmailAuthUrl = (state) => {
    const client = getOAuth2Client();

    if (!client) {
        throw new Error("Google OAuth is not configured: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are missing");
    }

    const url = client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        state
    });

    return url;
};

export const exchangeCodeForTokens = async (code) => {
    const client = getOAuth2Client();

    if (!client) {
        throw new Error("Google OAuth is not configured");
    }

    const { tokens } = await client.getToken(code);

    return {
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: tokens.expiry_date ?? null,
        scope: tokens.scope ?? null
    };
};

const credentialsFromStoredTokens = (accessTokenEnc, refreshTokenEnc) => {
    const client = getOAuth2Client();

    if (!client) {
        throw new Error("Google OAuth is not configured");
    }

    client.setCredentials({
        access_token: accessTokenEnc,
        refresh_token: refreshTokenEnc
    });

    return client;
};

export const getGmailClient = async (accessTokenEnc, refreshTokenEnc) => {
    const client = credentialsFromStoredTokens(accessTokenEnc, refreshTokenEnc);

    // If we have a refresh token and no usable access token, force a refresh.
    if (!accessTokenEnc && refreshTokenEnc) {
        await client.refreshAccessToken();
    }

    return google.gmail({ version: "v1", auth: client });
};

// Decrypt stored tokens and return a Gmail client ready to make calls.
export const getGmailClientFromEncrypted = async (accessTokenEnc, refreshTokenEnc) => {
    const accessToken = await decrypt(accessTokenEnc);
    const refreshToken = await decrypt(refreshTokenEnc);

    return getGmailClient(accessToken, refreshToken);
};

// Refresh access tokens and return the new encrypted-ready values.
export const refreshAccessToken = async (refreshTokenEnc) => {
    const client = getOAuth2Client();

    if (!client) {
        throw new Error("Google OAuth is not configured");
    }

    client.setCredentials({ refresh_token: await decrypt(refreshTokenEnc) });

    const { credentials } = await client.refreshAccessToken();

    return {
        accessToken: credentials.access_token ?? null,
        expiresAt: credentials.expiry_date ?? null
    };
};

// Fetch the authenticated Google user's profile to obtain the real `sub`
// identifier and email address after the OAuth code exchange.
export const getGoogleUserInfo = async (accessToken) => {
    const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Google userinfo request failed with ${response.status}: ${body.slice(0, 200)}`);
    }

    return response.json();
};

// List message IDs matching a query. Supports pagination via pageToken.
export const listMessages = async (gmail, { userId = "me", query = null, maxResults = 100, pageToken = null } = {}) => {
    const response = await gmail.users.messages.list({
        userId,
        q: query,
        maxResults,
        pageToken
    });

    return {
        messages: response.data.messages ?? [],
        nextPageToken: response.data.nextPageToken ?? null,
        resultSizeEstimate: response.data.resultSizeEstimate ?? 0
    };
};

// Get a single full message (headers + body parts).
export const getMessage = async (gmail, { userId = "me", id, format = "full" } = {}) => {
    const response = await gmail.users.messages.get({
        userId,
        id,
        format
    });

    return response.data;
};

// Get the current history ID for incremental sync seeding.
export const getHistory = async (gmail, { userId = "me" } = {}) => {
    const response = await gmail.users.history.list({
        userId,
        startHistoryId: "1",
        maxResults: 1
    });

    return response.data.historyId ?? null;
};

// List message IDs from history since a given history ID.
export const listHistoryMessages = async (gmail, { userId = "me", startHistoryId, maxResults = 100 } = {}) => {
    const response = await gmail.users.history.list({
        userId,
        startHistoryId,
        maxResults
    });

    const messages = [];

    for (const history of response.data.history ?? []) {
        for (const added of history.messagesAdded ?? []) {
            if (added.message) {
                messages.push(added.message);
            }
        }
    }

    return {
        messages,
        newHistoryId: response.data.historyId ?? null
    };
};

// ---- Email content parsing ----------------------------------------------

const decodeBase64url = (data) => {
    if (!data) {
        return "";
    }

    try {
        return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    } catch {
        return "";
    }
};

// Walk MIME parts to collect plain-text and HTML bodies plus attachments.
const walkParts = (parts, collected) => {
    for (const part of parts ?? []) {
        const mimeType = part.mimeType || "";
        const body = part.body || {};

        if (body.data) {
            const text = decodeBase64url(body.data);

            if (mimeType === "text/plain" && !collected.plainText) {
                collected.plainText = text;
            } else if (mimeType === "text/html" && !collected.htmlBody) {
                collected.htmlBody = text;
            }
        }

        if (part.parts && part.parts.length > 0) {
            walkParts(part.parts, collected);
        }
    }
};

export const parseEmailMessage = (message) => {
    const headers = message.payload?.headers ?? [];
    const getHeader = (name) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

    const collected = { plainText: "", htmlBody: "" };

    if (message.payload?.parts && message.payload.parts.length > 0) {
        walkParts(message.payload.parts, collected);
    } else if (message.payload?.body?.data) {
        const text = decodeBase64url(message.payload.body.data);
        const mimeType = message.payload.mimeType || "";

        if (mimeType === "text/html") {
            collected.htmlBody = text;
        } else {
            collected.plainText = text;
        }
    }

    const subject = getHeader("Subject");
    const sender = getHeader("From");
    const receivedAt = getHeader("Date");
    const messageId = getHeader("Message-ID");

    // Prefer plain text for analysis; fall back to HTML stripped of tags.
    let body = collected.plainText.trim();

    if (!body && collected.htmlBody) {
        body = collected.htmlBody
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Extract URLs from the body (and HTML, if plain text is empty).
    const urlRegex = /https?:\/\/[^\s<>"'()]+/gi;
    const urls = [...new Set(body.match(urlRegex) ?? [])];

    // If only HTML existed, also pull hrefs from the raw HTML.
    if (!collected.plainText && collected.htmlBody) {
        const hrefs = [...collected.htmlBody.matchAll(/href=["']([^"']+)["']/gi)]
            .map((m) => m[1])
            .filter((u) => u.startsWith("http"));

        urls.push(...hrefs);
    }

    return {
        id: message.id,
        threadId: message.threadId,
        historyId: message.historyId,
        internalDate: message.internalDate,
        subject,
        sender,
        receivedAt,
        messageId,
        labelIds: message.labelIds ?? [],
        body,
        htmlBody: collected.htmlBody,
        snippet: message.snippet ?? "",
        urls: [...new Set(urls)]
    };
};
