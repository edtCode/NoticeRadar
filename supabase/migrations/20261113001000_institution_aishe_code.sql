-- Preserve the official AISHE identifier so catalogue rows can be refreshed
-- safely from the national college and university exports.
alter table public.institutions
    add column if not exists aishe_code text;

create unique index if not exists institutions_aishe_code_unique_idx
    on public.institutions (aishe_code)
    where aishe_code is not null;
