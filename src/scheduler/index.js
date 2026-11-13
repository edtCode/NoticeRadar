import { env } from "../config/env.js";
import { getAdminClient } from "../config/supabase.js";
import { runDeadlineReminderJob } from "../services/notification.service.js";
import {
    getGmailClientFromEncrypted,
    listHistoryMessages,
    getMessage,
    getHistory,
    updateGmailHistoryId
} from "../services/gmail.service.js";
import { getGmailAccount, processIncomingMessage } from "../services/email-announcement.service.js";

const RUN_INTERVAL_MS = 15 * 60 * 1000;
const MAX_MESSAGES_PER_ACCOUNT = 50;

let timer = null;
let running = false;

export const runEmailSyncJob = async (adminClient) => {
    const { data: accounts, error } = await adminClient
        .from("gmail_accounts")
        .select("id, user_id, access_token, refresh_token, last_history_id")
        .not("access_token", "is", null);

    if (error) {
        console.error("Gmail sync job: could not load accounts:", error.message);
        return { accounts: 0, processed: 0 };
    }

    let totalProcessed = 0;

    for (const account of accounts ?? []) {
        const userId = account.user_id;
        const supabase = adminClient; // service role bypasses RLS for background jobs

        let gmail;
        try {
            gmail = await getGmailClientFromEncrypted(account.access_token, account.refresh_token);
        } catch (error) {
            console.error(`Gmail sync job: auth failed for user ${userId}:`, error.message);
            continue;
        }

        let startHistoryId = account.last_history_id;
        let seeded = false;

        if (!startHistoryId) {
            startHistoryId = await getHistory(gmail, { userId: "me" });
            seeded = true;
            if (startHistoryId) {
                await updateGmailHistoryId(adminClient, account.id, startHistoryId);
            }
        }

        if (!startHistoryId) {
            continue;
        }

        const history = await listHistoryMessages(gmail, {
            userId: "me",
            startHistoryId,
            maxResults: MAX_MESSAGES_PER_ACCOUNT
        });

        for (const msg of history.messages ?? []) {
            try {
                const full = await getMessage(gmail, { userId: "me", id: msg.id });
                const result = await processIncomingMessage(supabase, adminClient, account.id, userId, full);

                if (result.processed) {
                    totalProcessed += result.announcementCount ?? 0;
                }
            } catch (error) {
                console.error(`Gmail sync job: failed to process message ${msg.id}:`, error.message);
            }
        }

        if (history.newHistoryId) {
            await updateGmailHistoryId(adminClient, account.id, history.newHistoryId);
        }

        if (seeded) {
            console.log(`Gmail sync job: seeded history for user ${userId} at ${startHistoryId}`);
        }
    }

    return { accounts: accounts?.length ?? 0, processed: totalProcessed };
};

export const runSchedulerOnce = async () => {
    if (running) {
        console.log("Scheduler job already running, skipping this cycle");
        return null;
    }

    running = true;

    try {
        const deadlineResult = await runDeadlineReminderJob(getAdminClient());
        console.log(
            `Deadline reminder job finished: ${deadlineResult.notices} notices, ${deadlineResult.reminders} reminders queued`
        );

        const syncResult = await runEmailSyncJob(getAdminClient());
        console.log(
            `Gmail sync job finished: ${syncResult.accounts} accounts, ~${syncResult.processed} announcements extracted`
        );

        return { deadline: deadlineResult, gmailSync: syncResult };
    } catch (error) {
        console.error("Scheduler job failed:", error.message);
        return null;
    } finally {
        running = false;
    }
};

export const startScheduler = () => {
    if (env.nodeEnv === "test" || process.env.NODE_ENV === "test") {
        return false;
    }

    if (!env.schedulerEnabled) {
        console.log("Scheduler disabled (set ENABLE_SCHEDULER=true to enable deadline reminders and Gmail sync)");
        return false;
    }

    if (timer) {
        return false;
    }

    runSchedulerOnce();

    timer = setInterval(runSchedulerOnce, RUN_INTERVAL_MS);

    if (typeof timer.unref === "function") {
        timer.unref();
    }

    console.log("Deadline reminder and Gmail sync scheduler started");

    return true;
};

export const stopScheduler = () => {
    if (!timer) {
        return;
    }

    clearInterval(timer);
    timer = null;
};
