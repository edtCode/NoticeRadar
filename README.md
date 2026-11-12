# NoticeRadar

Turn official college notices into one personalised, verified feed.

The repository has two parts:

- `app/` — the React + Vite frontend deployed to Vercel
- `src/` — the Express + Supabase backend API (deployed separately)

## Deploying the frontend to Vercel

Import this repository into Vercel and either:

1. **Leave Root Directory empty** — `vercel.json` at the repo root installs and
   builds `app/` and serves `app/dist`.
2. **Set Root Directory to `app`** — `app/vercel.json` takes over.

Both configurations define the SPA rewrite to `/index.html`, so deep links such
as `/student/notices/123` load the app instead of returning a 404.

### Environment variables (Project → Settings → Environment Variables)

| Variable | Example | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api.example.com/api/v1` | Base URL of the deployed Express API |
| `VITE_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Public project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Public anon key only |

Vite inlines these at build time, so **redeploy after changing them**. The build
does not fail when they are missing, but the app will fall back to
`http://localhost:4000/api/v1` and sign-in token refresh will be disabled.
Never put the Supabase service-role key or an LLM API key in a `VITE_` variable —
those values ship to the browser.

## Local development

```bash
# frontend
cd app && npm install && npm run dev

# backend
npm install && npm run dev
```

Copy `app/.env.example` to `app/.env` for local frontend values.

## Email (Resend)

Signup confirmation emails are sent through [Resend](https://resend.com) so
registration is not capped by Supabase's built-in mailer (a couple of emails
per hour).

1. Create an API key at <https://resend.com/api-keys> and verify a sending
domain under **Domains** (or use `onboarding@resend.dev`, which can only send
to your own Resend account address).
2. Set these variables on the backend host (and in your local `.env`):

| Variable | Example | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_...` | Enables the Resend path; omit to fall back to Supabase |
| `MAIL_FROM` | `NoticeRadar <no-reply@yourdomain.com>` | Must use a verified domain |
| `MAIL_REPLY_TO` | `support@yourdomain.com` | Optional |
| `APP_URL` | `https://notice-radar-six.vercel.app` | Frontend base for confirmation links |

3. Add `<APP_URL>/login` under **Supabase → Authentication → URL Configuration →
   Redirect URLs**, otherwise Supabase sends the user to the Site URL instead.
4. Verify sending with `npm run verify:mail you@example.com`.

The flow is: create the account unconfirmed → generate a confirmation link
via the admin API → email that link with Resend → the user is activated when
they open it. If the email cannot be sent, the unconfirmed account is deleted
so the person can simply register again.

To also route Supabase's own auth emails (password recovery, magic links)
through Resend, set a custom SMTP server in the Supabase dashboard:

| Setting | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key |
| Sender email | an address on your verified Resend domain |
