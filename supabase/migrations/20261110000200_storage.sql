-- Private PDF storage for notices

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notice-files', 'notice-files', false, 5242880, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf'];

-- Files live under {institution_id}/{notice_id}/{file}.pdf
create policy "Institution admins can upload notice files"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'notice-files'
        and public.is_admin()
        and (storage.foldername(name))[1] = public.current_institution_id()::text
    );

create policy "Institution members can read notice files"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'notice-files'
        and (storage.foldername(name))[1] = public.current_institution_id()::text
        and (
            public.is_admin()
            or exists (
                select 1
                from public.notices
                where notices.file_path = storage.objects.name
                    and notices.status = 'PUBLISHED'
                    and notices.institution_id = public.current_institution_id()
            )
        )
    );

create policy "Institution admins can replace notice files"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'notice-files'
        and public.is_admin()
        and (storage.foldername(name))[1] = public.current_institution_id()::text
    );

create policy "Institution admins can delete notice files"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'notice-files'
        and public.is_admin()
        and (storage.foldername(name))[1] = public.current_institution_id()::text
    );
