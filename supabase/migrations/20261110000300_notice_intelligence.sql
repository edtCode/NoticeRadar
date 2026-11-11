-- Phase 2: notice intelligence, review workflow, saved notices and notifications

create type public.extraction_status as enum ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'OCR_REQUIRED');
create type public.review_status as enum ('NOT_REVIEWED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

alter table public.notices
    add column summary text,
    add column eligible_branches text[] not null default '{}',
    add column minimum_cpi numeric(4, 2) check (minimum_cpi is null or (minimum_cpi >= 0 and minimum_cpi <= 10)),
    add column minimum_semester smallint check (minimum_semester is null or (minimum_semester between 1 and 8)),
    add column maximum_semester smallint check (maximum_semester is null or (maximum_semester between 1 and 8)),
    add column eligible_graduation_years integer[] not null default '{}',
    add column requires_no_backlogs boolean,
    add column required_documents text[] not null default '{}',
    add column duration text,
    add column extracted_data jsonb,
    add column extraction_evidence jsonb,
    add column extraction_status public.extraction_status not null default 'PENDING',
    add column extraction_error text,
    add column extracted_at timestamptz,
    add column review_status public.review_status not null default 'NOT_REVIEWED',
    add column reviewed_by uuid references public.profiles(id) on delete set null,
    add column reviewed_at timestamptz,
    add constraint valid_semester_range check (
        minimum_semester is null or maximum_semester is null or minimum_semester <= maximum_semester
    );

create index notices_institution_review_status_idx on public.notices (institution_id, review_status);
create index notices_extraction_status_idx on public.notices (extraction_status);

create table public.saved_notices (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    notice_id uuid not null references public.notices(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, notice_id)
);

create index saved_notices_notice_id_idx on public.saved_notices (notice_id);

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    notice_id uuid references public.notices(id) on delete cascade,
    type text not null default 'DEADLINE_REMINDER',
    title text not null,
    message text not null,
    scheduled_for timestamptz not null,
    created_at timestamptz not null default now(),
    read_at timestamptz,
    dedupe_key text not null unique
);

create index notifications_user_schedule_idx on public.notifications (user_id, scheduled_for desc);
create index notifications_notice_id_idx on public.notifications (notice_id);

create table public.notice_processing_logs (
    id uuid primary key default gen_random_uuid(),
    notice_id uuid not null references public.notices(id) on delete cascade,
    status public.extraction_status not null,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create index notice_processing_logs_notice_id_idx on public.notice_processing_logs (notice_id, created_at desc);

create table public.notice_versions (
    id uuid primary key default gen_random_uuid(),
    notice_id uuid not null references public.notices(id) on delete cascade,
    previous_data jsonb not null,
    updated_data jsonb not null,
    changed_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create index notice_versions_notice_id_idx on public.notice_versions (notice_id, created_at desc);

alter table public.saved_notices enable row level security;
alter table public.notifications enable row level security;
alter table public.notice_processing_logs enable row level security;
alter table public.notice_versions enable row level security;

-- Saved notices: own rows only, and only published notices of the student's institution.
create policy "Students can read their saved notices"
    on public.saved_notices for select to authenticated
    using (auth.uid() = user_id);

create policy "Students can save published notices of their institution"
    on public.saved_notices for insert to authenticated
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.status = 'PUBLISHED'
                and notices.institution_id = public.current_institution_id()
        )
    );

create policy "Students can remove their saved notices"
    on public.saved_notices for delete to authenticated
    using (auth.uid() = user_id);

-- Notifications are created by trusted background jobs only.
create policy "Students can read their own notifications"
    on public.notifications for select to authenticated
    using (auth.uid() = user_id);

create policy "Students can mark their own notifications as read"
    on public.notifications for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Processing logs and versions are visible to admins of the notice's institution.
create policy "Admins can read processing logs of their institution"
    on public.notice_processing_logs for select to authenticated
    using (
        public.is_admin()
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.institution_id = public.current_institution_id()
        )
    );

create policy "Admins can write processing logs of their institution"
    on public.notice_processing_logs for insert to authenticated
    with check (
        public.is_admin()
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.institution_id = public.current_institution_id()
        )
    );

create policy "Admins can update processing logs of their institution"
    on public.notice_processing_logs for update to authenticated
    using (
        public.is_admin()
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.institution_id = public.current_institution_id()
        )
    )
    with check (
        public.is_admin()
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.institution_id = public.current_institution_id()
        )
    );

create policy "Admins can read notice versions of their institution"
    on public.notice_versions for select to authenticated
    using (
        public.is_admin()
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.institution_id = public.current_institution_id()
        )
    );

create policy "Admins can write notice versions of their institution"
    on public.notice_versions for insert to authenticated
    with check (
        public.is_admin()
        and exists (
            select 1 from public.notices
            where notices.id = notice_id
                and notices.institution_id = public.current_institution_id()
        )
    );

-- A notice can only be published after an admin approved its review.
drop policy "Admins can update notices of their institution" on public.notices;

create policy "Admins can update notices of their institution"
    on public.notices for update to authenticated
    using (public.is_admin() and institution_id = public.current_institution_id())
    with check (
        public.is_admin()
        and institution_id = public.current_institution_id()
        and (status <> 'PUBLISHED' or review_status = 'APPROVED')
    );
