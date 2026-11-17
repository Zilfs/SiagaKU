-- Community flood reports (F4): one photo, a coarse location and the AI verdict.
-- Apply through the Supabase MCP, not `supabase db push` (remote history uses dated versions).

create table reports (
  id            uuid primary key default gen_random_uuid(),
  district_id   smallint references districts(id),
  lat           double precision not null,
  lng           double precision not null,
  photo_path    text not null,
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
insert into storage.buckets (id, name, public)
values ('laporan', 'laporan', false)
on conflict (id) do nothing;
