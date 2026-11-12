-- Institution autocomplete / typeahead search
--
-- Institutions gain the metadata the search endpoint filters on, plus a
-- trigram-backed lookup function so partial, case-insensitive and slightly
-- misspelled queries stay index-assisted instead of scanning the table.

-- Supabase installs extensions in its own schema, so make sure operator
-- classes and similarity() resolve whichever way pg_trgm is provisioned.
set search_path = public, extensions;

create extension if not exists pg_trgm;

alter table public.institutions
    add column if not exists city text,
    add column if not exists state text,
    add column if not exists institution_type text,
    add column if not exists aliases text[] not null default '{}';

-- Trigram indexes power both ILIKE '%term%' matching and similarity() ranking.
create index if not exists institutions_name_trgm_idx
    on public.institutions using gin (name gin_trgm_ops);

create index if not exists institutions_city_trgm_idx
    on public.institutions using gin (city gin_trgm_ops);

-- Aliases are a text array; index their flattened form. array_to_string()
-- is only STABLE, so wrap it in an IMMUTABLE function before indexing.
create or replace function public.institution_aliases_text(aliases text[])
returns text
language sql
immutable
parallel safe
as $$
    select coalesce(array_to_string(aliases, ' '), '');
$$;

create index if not exists institutions_aliases_trgm_idx
    on public.institutions using gin (public.institution_aliases_text(aliases) gin_trgm_ops);

create index if not exists institutions_name_lower_idx
    on public.institutions (lower(name));

create or replace function public.search_institutions(search_query text, max_results integer default 8)
returns table (
    id uuid,
    name text,
    city text,
    state text,
    institution_type text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
    with params as (
        select
            btrim(coalesce(search_query, '')) as term,
            -- Escape LIKE wildcards so user input can only ever be a literal.
            replace(replace(replace(btrim(coalesce(search_query, '')), '\', '\\'), '%', '\%'), '_', '\_') as escaped
    )
    select
        i.id,
        i.name,
        i.city,
        i.state,
        i.institution_type
    from public.institutions i
    cross join params p
    where p.term <> ''
      and (
          i.name ilike ('%' || p.escaped || '%')
          or i.city ilike ('%' || p.escaped || '%')
          or exists (
              select 1 from unnest(i.aliases) as a
              where a ilike ('%' || p.escaped || '%')
          )
          or i.name % p.term
      )
    order by
        (lower(i.name) = lower(p.term)) desc,
        (i.name ilike (p.escaped || '%')) desc,
        similarity(i.name, p.term) desc,
        i.name asc
    limit least(greatest(coalesce(max_results, 8), 1), 8);
$$;

grant execute on function public.search_institutions(text, integer) to anon, authenticated, service_role;

-- Students can ask for an institution that is missing from the catalogue.
-- Requests are reviewed by admins; nothing is auto-created or trusted.
create table if not exists public.institution_requests (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    city text,
    state text,
    institution_type text,
    requested_by uuid references public.profiles(id) on delete set null,
    status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists institution_requests_requested_by_idx
    on public.institution_requests (requested_by);

create index if not exists institution_requests_status_idx
    on public.institution_requests (status, created_at desc);

drop trigger if exists institution_requests_set_updated_at on public.institution_requests;
create trigger institution_requests_set_updated_at before update on public.institution_requests
    for each row execute function public.set_updated_at();

alter table public.institution_requests enable row level security;

create policy "Users can submit their own institution requests"
    on public.institution_requests for insert to authenticated
    with check (requested_by = auth.uid());

create policy "Users can read their own institution requests"
    on public.institution_requests for select to authenticated
    using (requested_by = auth.uid());

create policy "Admins can read institution requests"
    on public.institution_requests for select to authenticated
    using (public.is_admin());

create policy "Admins can review institution requests"
    on public.institution_requests for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());
