import { env } from "../config/env.js";
import { getAdminClient } from "../config/supabase.js";
import { runDeadlineReminderJob } from "../services/notification.service.js";

const RUN_INTERVAL_MS = 15 * 60 * 1000;

let timer = null;
let running = false;

export const runSchedulerOnce = async () => {
    if (running) {
        console.log("Scheduler job already running, skipping this cycle");
        return null;
    }

    running = true;

    try {
        const result = await runDeadlineReminderJob(getAdminClient());
        console.log(`Deadline reminder job finished: ${result.notices} notices, ${result.reminders} reminders queued`);
        return result;
    } catch (error) {
        console.error("Deadline reminder job failed:", error.message);
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
        console.log("Scheduler disabled (set ENABLE_SCHEDULER=true to enable deadline reminders)");
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

    console.log("Deadline reminder scheduler started");

    return true;
};

export const stopScheduler = () => {
    if (!timer) {
        return;
    }

    clearInterval(timer);
    timer = null;
};
