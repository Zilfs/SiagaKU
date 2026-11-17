-- Community flood reports (F4): one photo, a coarse location and the AI verdict.
-- Apply through the Supabase MCP, not `supabase db push` (remote history uses dated versions).

create table reports (
  id            uuid primary key default gen_random_uuid(),
  district_id   smallint references districts(id),
  lat           double precision not null,
  lng           double precision not null,
  photo_path    text not null unique,
  description   text,
  ai_status     text not null default 'menunggu'
                check (ai_status in ('menunggu', 'selesai', 'gagal', 'ditolak')),
  ai_result     jsonb,
  ai_provider   text,
  is_demo       boolean not null default false,
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index reports_created_at_idx on reports (created_at desc);

alter table reports enable row level security;

-- The bucket is private: the browser only PUTs through a server-created signed URL,
-- and the feed reads through signed download URLs. No storage policy is needed.
-- Storage enforces the same type and size limits as the route.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'laporan',
  'laporan',
  false,
  1500000,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
