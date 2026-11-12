-- Eligibility criteria for notices and events a student tracks privately, so the
-- app can tell them whether they are eligible instead of leaving it unanswered.
-- These are read from the uploaded PDF/pasted text by the AI extractor (or typed
-- by the student) and never published to the institution feed.

alter table public.personal_entries
    add column if not exists eligible_branches text[] not null default '{}',
    add column if not exists minimum_cpi numeric(4, 2) check (minimum_cpi is null or minimum_cpi between 0 and 10),
    add column if not exists requires_no_backlogs boolean;
