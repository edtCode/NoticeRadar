-- Phase 6: Gmail email intelligence — per-user extracted announcements
--
-- Email announcements are personal, user-scoped records produced by AI
-- extraction of authorized Gmail messages. They are NOT institution
-- notices (those live in `public.notices` and are admin-published).

create type public.email_announcement_status as enum ('active', 'dismissed', 'archived');
create type public.email_announcement_importance as enum ('critical', 'high', 'medium', 'low');

-- A student's connected Gmail account (OAuth 2.0 tokens encrypted at rest).
create table public.gmail_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    google_sub text not null,
    email_address text not null,
    access_token text not null,
    refresh_token text not null,
    token_expires_at timestamptz,
    scope text,
    last_history_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id),
    unique (google_sub)
);

-- Every Gmail message that has been picked up for processing, so we never
-- process the same message twice and can trace each announcement to its source.
create table public.processed_emails (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    gmail_account_id uuid not null references public.gmail_accounts(id) on delete cascade,
    gmail_message_id text not null,
    gmail_thread_id text,
    gmail_history_id text,
    subject text,
    sender text,
    received_at timestamptz,
    processing_status text not null default 'pending'
        check (processing_status in ('pending', 'completed', 'failed')),
    processing_error text,
    announcement_count integer not null default 0,
    processed_at timestamptz,
    created_at timestamptz not null default now(),

    unique (user_id, gmail_message_id)
);

create index processed_emails_user_status_idx on public.processed_emails (user_id, processing_status);
create index processed_emails_gmail_message_idx on public.processed_emails (gmail_message_id);

-- One row per distinct announcement extracted from an email. A single email
-- may produce many announcements (e.g. three companies in one placement email).
create table public.email_announcements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    processed_email_id uuid not null references public.processed_emails(id) on delete cascade,

    title text not null,
    short_title text,
    description text,

    primary_category text not null,
    secondary_category text,
    announcement_type text,

    organization_name text,
    organization_type text,

    opportunity_details jsonb not null default '{}',
    eligibility_details jsonb not null default '{}',
    important_dates jsonb not null default '{}',
    event_details jsonb not null default '{}',
    links jsonb not null default '{}',
    contact_details jsonb not null default '{}',

    source_email_subject text,
    source_email_sender text,
    source_email_received_at timestamptz,

    extraction_confidence numeric(3, 2)
        check (extraction_confidence is null or (extraction_confidence >= 0 and extraction_confidence <= 1)),
    review_required boolean not null default false,
    extraction_warnings text[] not null default '{}',

    status public.email_announcement_status not null default 'active',
    importance public.email_announcement_importance not null default 'medium',
    is_bookmarked boolean not null default false,
    is_read boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index email_announcements_user_status_idx
    on public.email_announcements (user_id, status, created_at desc);
create index email_announcements_user_category_idx
    on public.email_announcements (user_id, primary_category);
create index email_announcements_user_importance_idx
    on public.email_announcements (user_id, importance);
create index email_announcements_processed_email_idx
    on public.email_announcements (processed_email_id);
create index email_announcements_user_bookmark_idx
    on public.email_announcements (user_id, is_bookmarked) where is_bookmarked = true;

-- Dedupe fingerprint: normalized title + organization + application URL +
-- application deadline, so the same opportunity arriving via forwarded or
-- reminder emails is recognised without merging genuinely different roles.
alter table public.email_announcements
    add column if not exists dedupe_fingerprint text;

create unique index if not exists email_announcements_dedupe_unique_idx
    on public.email_announcements (user_id, dedupe_fingerprint)
    where dedupe_fingerprint is not null;

-- Row level security — students only ever see their own announcements.
alter table public.gmail_accounts enable row level security;
alter table public.processed_emails enable row level security;
alter table public.email_announcements enable row level security;

create policy "Users can read their own gmail accounts"
    on public.gmail_accounts for select to authenticated
    using (auth.uid() = user_id);

create policy "Users can manage their own gmail accounts"
    on public.gmail_accounts for all to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can read their own processed emails"
    on public.processed_emails for select to authenticated
    using (auth.uid() = user_id);

create policy "Users can read their own email announcements"
    on public.email_announcements for select to authenticated
    using (auth.uid() = user_id);

create policy "Users can update their own email announcements"
    on public.email_announcements for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own email announcements"
    on public.email_announcements for delete to authenticated
    using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
