-- Generate searchable acronyms for the imported AISHE catalogue, including
-- a district suffix where the full name does not already include that district.
create or replace function public.institution_generated_aliases(institution_name text, institution_city text)
returns text[]
language sql
immutable
parallel safe
as $$
  with words as (
    select token, ordinality
    from regexp_split_to_table(
      lower(regexp_replace(coalesce(institution_name, ''), '[^[:alnum:]]+', ' ', 'g')),
      '\s+'
    ) with ordinality as m(token, ordinality)
  ), significant as (
    select token, ordinality
    from words
    where token <> ''
      and token not in ('a', 'an', 'and', 'of', 'the', 'for', 'in', 'at', 'to', 'on', 'by', 'with', 'deemed')
      and token <> all(regexp_split_to_array(lower(regexp_replace(coalesce(institution_city, ''), '[^[:alnum:]]+', ' ', 'g')), '\s+'))
  ), acronym as (
    select upper(string_agg(left(token, 1), '' order by ordinality)) as value
    from significant
  )
  select case
    when length(value) between 2 and 10 then
      case when coalesce(institution_city, '') <> '' then array[value, value || ' ' || institution_city] else array[value] end
    else '{}'::text[]
  end
  from acronym;
$$;

update public.institutions
set aliases = coalesce(aliases, '{}') || public.institution_generated_aliases(name, city)
where aishe_code is not null;

update public.institutions
set aliases = (
  select coalesce(array_agg(distinct alias order by alias), '{}'::text[])
  from unnest(aliases) as alias
)
where aishe_code is not null;