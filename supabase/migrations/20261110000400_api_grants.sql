-- PostgREST needs explicit table/function privileges for objects created via SQL.
-- Row level security still decides which rows each role can see.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
    grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
    grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public
    grant execute on functions to anon, authenticated, service_role;
