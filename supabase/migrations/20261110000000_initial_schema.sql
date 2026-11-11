-- NoticeRadar initial schema

create type public.user_role as enum ('STUDENT', 'ADMIN');
create type public.notice_category as enum ('PLACEMENT', 'INTERNSHIP', 'SCHOLARSHIP', 'EXAM', 'EVENT', 'GENERAL');
create type public.notice_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table public.institutions (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.departments (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    institution_id uuid not null references public.institutions(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (institution_id, name)
);

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text not null,
    role public.user_role not null default 'STUDENT',
    institution_id uuid references public.institutions(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.student_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.profiles(id) on delete cascade,
    department_id uuid not null references public.departments(id) on delete restrict,
    branch text not null,
    semester smallint not null check (semester between 1 and 8),
    cpi numeric(4, 2) not null check (cpi >= 0 and cpi <= 10),
    graduation_year smallint not null check (graduation_year between 2000 and 2100),
    active_backlogs smallint not null default 0 check (active_backlogs >= 0),
    interests text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.notices (
    id uuid primary key default gen_random_uuid(),
    institution_id uuid not null references public.institutions(id) on delete cascade,
    title text not null,
    description text not null,
    category public.notice_category not null,
    application_url text,
    source_url text,
    deadline timestamptz,
    published_at timestamptz,
    status public.notice_status not null default 'DRAFT',
    created_by uuid not null references public.profiles(id) on delete restrict,
    approved_by uuid references public.profiles(id) on delete set null,
    file_path text,
    file_name text,
    file_size integer check (file_size is null or file_size > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz,
    constraint published_notice_requires_date check (status <> 'PUBLISHED' or published_at is not null)
);

create index profiles_institution_id_idx on public.profiles (institution_id);
create index departments_institution_id_idx on public.departments (institution_id);
create index student_profiles_department_id_idx on public.student_profiles (department_id);
create index notices_institution_status_published_idx on public.notices (institution_id, status, published_at desc);
create index notices_institution_category_idx on public.notices (institution_id, category);
create index notices_deadline_idx on public.notices (deadline);
create index notices_created_by_idx on public.notices (created_by);

create trigger institutions_set_updated_at before update on public.institutions
    for each row execute function public.set_updated_at();

create trigger departments_set_updated_at before update on public.departments
    for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger student_profiles_set_updated_at before update on public.student_profiles
    for each row execute function public.set_updated_at();

create trigger notices_set_updated_at before update on public.notices
    for each row execute function public.set_updated_at();

-- Profile rows are always created server side, role is never taken from client metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, email, role)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
        coalesce(new.email, ''),
        'STUDENT'
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
