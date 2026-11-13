import "dotenv/config";
import { env } from "../src/config/env.js";
import { isMailEnabled, sendMail } from "../src/services/mail.service.js";

// Sends one test email through Resend so the API key, sender domain and
// MAIL_FROM address can be checked without registering an account.
const to = process.argv[2];

if (!to || !to.includes("@")) {
    console.error("Usage: npm run verify:mail you@example.com");
    process.exit(1);
}

if (!isMailEnabled()) {
    console.error("RESEND_API_KEY is not set. Add it to .env (or the host's environment) first.");
    process.exit(1);
}

console.log(`Sending test email from "${env.mail.from}" to ${to}...`);

try {
    const result = await sendMail({
        to,
        subject: "Oppora email test",
        html: "<p>This is a test email from the Oppora backend. Resend delivery is working.</p>",
        text: "This is a test email from the Oppora backend. Resend delivery is working."
    });

    console.log(`Sent. Resend id: ${result?.id ?? "unknown"}`);
} catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
}
