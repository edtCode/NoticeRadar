-- Optional starter data for local development.

insert into public.institutions (name, slug)
values ('Example Institute of Technology', 'example-institute')
on conflict (slug) do nothing;

insert into public.departments (name, institution_id)
select department.name, institutions.id
from public.institutions
cross join (values ('Computer Science'), ('Information Technology')) as department(name)
where institutions.slug = 'example-institute'
on conflict (institution_id, name) do nothing;
