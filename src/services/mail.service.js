import { Resend } from "resend";
import { env } from "../config/env.js";

let client;

const getClient = () => {
    if (!env.mail.apiKey) {
        return null;
    }

    client ??= new Resend(env.mail.apiKey);

    return client;
};

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const isMailEnabled = () => Boolean(env.mail.apiKey);

export const sendMail = async ({ to, subject, html, text }) => {
    const resend = getClient();

    if (!resend) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    const { data, error } = await resend.emails.send({
        from: env.mail.from,
        to,
        subject,
        html,
        text,
        ...(env.mail.replyTo ? { replyTo: env.mail.replyTo } : {})
    });

    if (error) {
        throw new Error(error.message || "Resend could not send the email");
    }

    return data;
};

const confirmationHtml = ({ name, confirmationUrl }) => `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f5f4;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#1c1917;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:32px;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;">NoticeRadar</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Confirm your email address</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#44403c;">
        Hi ${escapeHtml(name)}, thanks for signing up. Click the button below to confirm your email and activate your account.
      </p>
      <p style="margin:0 0 28px;">
        <a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">Confirm email</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#78716c;">
        This link expires in 24 hours. If the button does not work, paste this address into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;color:#44403c;">${escapeHtml(confirmationUrl)}</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#78716c;">
        If you did not create a NoticeRadar account, you can ignore this email.
      </p>
    </div>
  </body>
</html>`;

const confirmationText = ({ name, confirmationUrl }) => [
    `Hi ${name},`,
    "",
    "Thanks for signing up for NoticeRadar. Confirm your email address to activate your account:",
    confirmationUrl,
    "",
    "This link expires in 24 hours. If you did not create an account, ignore this email."
].join("\n");

export const sendConfirmationEmail = async ({ to, name, confirmationUrl }) => sendMail({
    to,
    subject: "Confirm your NoticeRadar email",
    html: confirmationHtml({ name, confirmationUrl }),
    text: confirmationText({ name, confirmationUrl })
});
