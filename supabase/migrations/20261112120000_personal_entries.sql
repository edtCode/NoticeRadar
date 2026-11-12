-- Personal notices and events a student tracks themselves
-- (added manually, uploaded as a PDF, or imported from email).

create type public.personal_entry_source as enum ('MANUAL', 'UPLOAD', 'EMAIL');

create table public.personal_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text,
    category public.notice_category not null default 'GENERAL',
    deadline timestamptz,
    event_date timestamptz,
    source public.personal_entry_source not null default 'MANUAL',
    source_email text,
    file_path text,
    file_name text,
    file_size integer check (file_size is null or file_size > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index personal_entries_user_deadline_idx on public.personal_entries (user_id, deadline);
create index personal_entries_user_created_idx on public.personal_entries (user_id, created_at desc);

create trigger personal_entries_set_updated_at before update on public.personal_entries
    for each row execute function public.set_updated_at();

alter table public.personal_entries enable row level security;

create policy "Users can read their own personal entries"
    on public.personal_entries for select to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own personal entries"
    on public.personal_entries for insert to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own personal entries"
    on public.personal_entries for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own personal entries"
    on public.personal_entries for delete to authenticated
    using (auth.uid() = user_id);

-- Private PDFs for personal entries live under {user_id}/{entry_id}/{file}.pdf
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('personal-files', 'personal-files', false, 5242880, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf'];

create policy "Users can upload their own personal files"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'personal-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can read their own personal files"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'personal-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can replace their own personal files"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'personal-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can delete their own personal files"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'personal-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
