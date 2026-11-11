-- Row Level Security

create or replace function public.current_institution_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select institution_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((select role = 'ADMIN' from public.profiles where id = auth.uid()), false);
$$;

alter table public.institutions enable row level security;
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.notices enable row level security;

-- Institutions and departments are readable so users can complete their profile.
create policy "Institutions are readable by authenticated users"
    on public.institutions for select to authenticated
    using (true);

create policy "Departments are readable by authenticated users"
    on public.departments for select to authenticated
    using (true);

-- Profiles
create policy "Users can read their own profile"
    on public.profiles for select to authenticated
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Students may only change their name and institution, never their role.
revoke update on public.profiles from authenticated;
grant update (name, institution_id) on public.profiles to authenticated;

-- Student profiles
create policy "Students can read their own student profile"
    on public.student_profiles for select to authenticated
    using (auth.uid() = user_id);

create policy "Students can create their own student profile"
    on public.student_profiles for insert to authenticated
    with check (auth.uid() = user_id);

create policy "Students can update their own student profile"
    on public.student_profiles for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Notices
create policy "Students can read published notices of their institution"
    on public.notices for select to authenticated
    using (status = 'PUBLISHED' and institution_id = public.current_institution_id());

create policy "Admins can read notices of their institution"
    on public.notices for select to authenticated
    using (public.is_admin() and institution_id = public.current_institution_id());

create policy "Admins can create notices for their institution"
    on public.notices for insert to authenticated
    with check (
        public.is_admin()
        and institution_id = public.current_institution_id()
        and created_by = auth.uid()
    );

create policy "Admins can update notices of their institution"
    on public.notices for update to authenticated
    using (public.is_admin() and institution_id = public.current_institution_id())
    with check (public.is_admin() and institution_id = public.current_institution_id());

create policy "Admins can delete notices of their institution"
    on public.notices for delete to authenticated
    using (public.is_admin() and institution_id = public.current_institution_id());
