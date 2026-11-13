# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7 + TanStack Query v5 + Axios + Zustand + React Hook Form + Zod + Recharts + Supabase JS. Frontend lives in `app/`; the existing Express API in `src/` is the source of truth. Delegated by the user in the request.

## Users

- **Students** at an institution (primary): checking official college notices between classes, often on a phone, deciding whether an internship, placement, scholarship, exam notice or event applies to them and whether the deadline is close. Their academic profile (branch, semester, CPI, graduation year, active backlogs) is the lens.
- **Administrators** at the institution (secondary): staff who receive official PDFs from departments, placement cells or the registrar and must turn them into verified, searchable, published notices without misrepresenting the source document.

## Product Purpose

Oppora turns scattered, long official college notices into a personalised, verifiable feed. Students discover published notices, read an AI-assisted summary and a rule-based eligibility assessment computed by the backend, save opportunities and track deadlines. Administrators upload official PDFs, run text and AI extraction, inspect the evidence behind every extracted field, correct it, approve it and publish it.

Success: a student can answer "what applies to me and what closes soon?" in under a minute; an administrator can publish a verified notice without re-typing the PDF and without ever bypassing review.

## Positioning

Not a scraper, not a chatbot, not another WhatsApp group. Oppora is an institution-controlled notice intelligence pipeline whose eligibility verdicts are transparent rules (with reasons and missing fields), whose AI output is always shown next to the source text it came from, and whose publication is gated on human approval. The unit of trust is the verified notice, not a generated answer.

## Operating Context

- Backend: Express, Supabase Postgres/Auth/Storage, Zod, PDF text extraction, configurable LLM provider, rule-based eligibility engine, in-app reminder scheduler.
- Auth: Express `/auth/login` returns Supabase `session` tokens; the frontend establishes the Supabase session and sends the access token as a Bearer token. Roles come from `profiles.role`.
- Two authenticated shells: `StudentLayout` and `AdminLayout`; role-based redirect after login.
- Notices have three independent status axes: publication (`DRAFT | PUBLISHED | ARCHIVED`), extraction (`PENDING | PROCESSING | COMPLETED | FAILED | OCR_REQUIRED`), review (`NOT_REVIEWED | PENDING_REVIEW | APPROVED | REJECTED`).
- Categories are a Postgres enum: `PLACEMENT, INTERNSHIP, SCHOLARSHIP, EXAM, EVENT, GENERAL`.
- Reminder scheduler creates in-app notifications at 7, 3 and 1 days before a deadline for eligible and possibly-eligible students.
- The API base path is `/api/v1`; errors are `{ error, details? }`.
- Known backend gaps that the UI must not paper over: no student-visible admin statistics endpoint, no review-status query filter on admin notices, no notification preferences, no admin student/department/category CRUD, no processing-log search endpoint, no password-recovery endpoints, no resend-verification endpoint.

## Capabilities and Constraints

Confirmed capabilities mirror the existing API only:

- Auth: register (always STUDENT), login, logout, current user. No role switch in the UI, no Google login.
- Student profile: GET/POST/PATCH; onboarding collects institution, department, branch, semester, CPI, graduation year, active backlogs, interests.
- Notices: list, detail, personalised feed with eligibility, database-backed search, per-notice eligibility, save/unsave, saved list, per-notice PDF signed URL.
- Deadlines: upcoming list within `days` (1–90); reminders are 7/3/1 days and controlled by the backend.
- Notifications: paginated list of already-scheduled notifications, unread count, mark-one-read.
- Admin: create/read/update/archive notice, upload PDF, process/retry extraction, pending-review queue, extraction workspace with evidence and processing logs, review approve/reject, publish (only when `review_status = APPROVED`).

Constraints:

- Eligibility is never computed in React. All three states are displayed from the API.
- No fabricated structured fields (company, work mode, event dates, application steps, confidence scores). Missing values are shown as "not specified", not invented.
- Only supported filters and ordering are exposed. No semantic/chat search is advertised.
- Admin publication cannot bypass the backend approval check; the UI links to review instead.
- PDF URLs come from short-lived (600s) backend-signed URLs; storage paths and keys are never exposed.
- Student onboarding reads institution and department directories from authenticated backend endpoints; production options are never hardcoded.

## Brand Commitments

- Name: **Oppora**.
- Voice: quiet, precise, institutional, candid. Plain verbs. No hype, no "AI magic", no fake urgency.
- Core vocabulary: signal, notice, notice board, verified, published, eligibility, deadline, evidence, official.
- Honesty commitments: AI summaries are labelled "AI-assisted — verify important details against the official notice"; rule-based eligibility carries its disclaimer wherever a verdict appears; demo data, when enabled, is visibly marked as demo.
- No photography of people, no fabricated testimonials, customer logos, counts or press.

## Evidence on Hand

- Real API contracts and enums from `src/` and `supabase/migrations/`.
- Seed institution `Example Institute of Technology` with departments `Computer Science`, `Information Technology` (development seed only).
- No production notices, brand assets, logos, institutional marks, testimonials or metrics. The radar mark is drawn for this product. All notice copy in demo mode is clearly fictional sample content.

## Product Principles

1. **Verification over velocity.** Publishing is a reviewed act, not an automated one. The review workspace is the product's centre of gravity.
2. **Show the working.** Eligibility explains itself in reasons and missing fields; extraction shows its source quote and page. Nothing is a black box.
3. **Meet the notice where it lives.** The PDF is the authority; the structured record is the convenience. Always keep a path back to the original document.
4. **Calm by default.** One feed, three states, near deadlines first. No red badges for everything, no infinite scroll, no dark patterns.
5. **Only the true state.** A control exists only if its backend exists. Empty, failed and unavailable states are designed, not hidden.

## Accessibility & Inclusion

WCAG 2.2 AA target. Keyboard-operable navigation, dialogs and menus; visible focus; 4.5:1 body text contrast; no colour-only eligibility or status; reduced-motion support; 44px touch targets on mobile; page titles announced on route change; tables convert to labelled lists on narrow screens.

## Assumptions

- The user asked for a complete design/frontend; the existing Express backend is runnable in principle but credentials and migrations were not executed here.
- The frontend uses the Express API for application data. Configure `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `app/.env` for local development.
- The institution/department directory endpoint does not exist yet; the frontend calls the specified paths and fails honestly rather than hardcoding options in production mode.
