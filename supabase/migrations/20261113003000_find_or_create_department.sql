-- Students type their department name during onboarding instead of picking from
-- a fixed list. This resolves the typed name to a departments row, creating it
-- when it does not exist yet for that institution.

create or replace function public.find_or_create_department(p_institution_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_name text := btrim(coalesce(p_name, ''));
    v_id uuid;
begin
    if v_name = '' then
        raise exception 'Department name is required';
    end if;

    select id into v_id
    from public.departments
    where institution_id = p_institution_id and lower(name) = lower(v_name)
    limit 1;

    if v_id is not null then
        return v_id;
    end if;

    begin
        insert into public.departments (name, institution_id)
        values (v_name, p_institution_id)
        returning id into v_id;
    exception when unique_violation then
        select id into v_id
        from public.departments
        where institution_id = p_institution_id and lower(name) = lower(v_name)
        limit 1;
    end;

    return v_id;
end;
$$;

revoke all on function public.find_or_create_department(uuid, text) from public;
grant execute on function public.find_or_create_department(uuid, text) to anon, authenticated, service_role;
