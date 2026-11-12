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
