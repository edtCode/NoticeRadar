import "dotenv/config";
import request from "supertest";
import { createClient } from "@supabase/supabase-js";
import { createApp } from "../src/app.js";

// Verifies POST /auth/register end to end against the real project.
// Supabase's built-in email sender allows only a few signup mails per hour, so
// while the quota is exhausted this retries until the window resets.
const app = createApp();
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

const password = "Sm0ke-Test!Aa12345";
const minutesArg = process.argv.find((arg) => arg.startsWith("--until-minutes="));
const untilMinutes = minutesArg ? Number(minutesArg.split("=")[1]) : 60;
const deadline = Date.now() + untilMinutes * 60 * 1000;
const retryDelayMs = 60 * 1000;

const address = (stamp) => `smoke-register-${stamp}@gmail.com`;

const cleanup = async (email) => {
    const { data: profile } = await admin
        .from("profiles").select("id").eq("email", email).maybeSingle();
    if (!profile?.id) return;
    await admin.from("student_profiles").delete().eq("user_id", profile.id);
    await admin.from("profiles").delete().eq("id", profile.id);
    await admin.auth.admin.deleteUser(profile.id);
};

const attempt = async () => {
    const email = address(Date.now());
    const res = await request(app).post("/api/v1/auth/register").send({
        name: "Smoke Register", email, password
    });
    const message = typeof res.body?.error === "string"
        ? res.body.error
        : res.body?.error?.message ?? "";

    return { res, email, message };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let number = 0;
for (;;) {
    number += 1;
    const { res, email, message } = await attempt();
    const stamp = new Date().toISOString().slice(11, 19);

    if (res.status === 201) {
        const body = res.body?.data ?? {};
        const { data: profile } = await admin
            .from("profiles").select("id, role").eq("email", email).maybeSingle();
        const login = await request(app).post("/api/v1/auth/login").send({ email, password });
        await cleanup(email);

        const ok = body.user?.email === email
            && profile?.role === "STUDENT"
            && (login.status === 200 || body.requiresEmailConfirmation === true);

        const confirmed = login.status === 200;
        const outcome = confirmed ? "can log in" : "awaits email confirmation";

        console.log(`[${stamp}] attempt ${number}: 201 created, profile=${profile?.role ?? "missing"}, login=${login.status}`);
        console.log(ok ? `PASS  POST /auth/register creates a student account (${outcome})` : "FAIL  registered account did not behave as expected");
        process.exit(ok ? 0 : 1);
    }

    if (res.status === 429 || (res.status === 400 && /rate limit/i.test(message))) {
        if (Date.now() + retryDelayMs > deadline) {
            console.log(`[${stamp}] attempt ${number}: still rate limited (${message})`);
            console.log(`GAVE UP after ${number} attempts: Supabase mail quota is still exhausted. Re-run later.`);
            process.exit(1);
        }
        console.log(`[${stamp}] attempt ${number}: rate limited, retrying in 60s (${message})`);
        await sleep(retryDelayMs);
        continue;
    }

    console.log(`[${stamp}] attempt ${number}: unexpected ${res.status} ${JSON.stringify(res.body)}`);
    process.exit(1);
}
