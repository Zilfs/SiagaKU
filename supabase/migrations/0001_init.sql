-- SiagaKU initial schema. Names are English; docs/06 uses Indonesian names:
-- districts (docs: kecamatan)
-- flood_events (docs: riwayat_banjir)
-- flood_prone_subdistricts (docs: kelurahan_rawan)
-- shelters (docs: posko_evakuasi)
-- emergency_contacts (docs: kontak_darurat)
-- cache_kv (docs: cache_kv)
-- documents (docs: dokumen)
-- document_chunks (docs: dokumen_chunk)
-- preparedness_plans (docs: rencana_siaga)
-- reports (docs: laporan)
-- rate_limits (docs: rate_limit)
-- ai_logs (docs: ai_log)
-- Not here (later tasks): iklim_tahunan, kelurahan, push_subscription, peringatan_status.

create extension if not exists vector;

create table districts (
  id                  smallint primary key,
  slug                text unique not null,
  name                text not null,
  city                text not null,
  region_code         text unique not null,           -- Kemendagri code, e.g. '31.75.03'
  bmkg_adm4           text not null,                  -- representative subdistrict for BMKG
  lat                 double precision not null,      -- centroid
  lng                 double precision not null,
  tidal_flood_prone   boolean not null default false,
  base_vulnerability  smallint not null default 0 check (base_vulnerability between 0 and 100),
  notes               text,
  geojson             jsonb                           -- optional boundary polygon
);

create table flood_events (
  id                bigint generated always as identity primary key,
  district_id       smallint not null references districts(id),
  subdistrict       text,
  event_date        date not null,
  max_depth_cm      integer,
  affected_rt_count integer,
  description       text,
  source_url        text not null
);
create index on flood_events (district_id, event_date desc);

create table flood_prone_subdistricts (
  id           bigint generated always as identity primary key,
  district_id  smallint not null references districts(id),
  subdistrict  text not null,
  rw_count     integer,
  data_year    smallint,
  source_url   text not null
);

create table shelters (
  id           bigint generated always as identity primary key,
  district_id  smallint not null references districts(id),
  name         text not null,
  type         text not null,     -- 'official_post' | 'subdistrict_office' | 'school' | 'mosque' | 'other'
  address      text,
  lat          double precision,
  lng          double precision,
  is_verified  boolean not null default false,  -- false = "estimated safe location"
  source_url   text
);

create table emergency_contacts (
  id          smallint generated always as identity primary key,
  name        text not null,      -- 'Jakarta Siaga'
  phone       text not null,      -- '112'
  scope       text not null,      -- 'DKI' | 'national' | a specific city
  sort_order  smallint not null default 0
);

create table cache_kv (
  key         text primary key,   -- 'bmkg:31.75.03.1001', 'om:forecast:12', 'ai:explanation:12'
  value       jsonb not null,
  expires_at  timestamptz not null
);

create table documents (
  id         smallint generated always as identity primary key,
  title      text not null,
  publisher  text not null,       -- 'BNPB', 'BPBD DKI Jakarta'
  year       smallint,
  url        text not null
);

create table document_chunks (
  id             bigint generated always as identity primary key,
  document_id    smallint not null references documents(id) on delete cascade,
  position       integer not null,
  page           integer,
  section_title  text,
  content        text not null,
  embedding      vector(768),
  fts            tsvector generated always as (to_tsvector('indonesian', content)) stored
);
create index on document_chunks using hnsw (embedding vector_cosine_ops);
create index on document_chunks using gin (fts);

create table preparedness_plans (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,     -- 10-char nanoid for the URL
  district_id  smallint not null references districts(id),
  profile      jsonb not null,           -- form input (no identity data)
  plan         jsonb not null,           -- AI output validated by zod
  provider     text not null,            -- 'gemini' | 'groq'
  model        text not null,
  created_at   timestamptz not null default now()
);

create table reports (
  id           uuid primary key default gen_random_uuid(),
  district_id  smallint references districts(id),
  lat          double precision not null,
  lng          double precision not null,
  photo_path   text not null,            -- path in the 'reports' bucket
  description  text,
  ai_status    text not null default 'pending',  -- 'pending' | 'done' | 'failed' | 'rejected'
  ai_result    jsonb,
  ai_provider  text,
  is_demo      boolean not null default false,
  ip_hash      text,
  created_at   timestamptz not null default now()
);
create index on reports (created_at desc);

create table rate_limits (
  ip_hash       text not null,
  bucket        text not null,           -- 'chat' | 'plan' | 'report'
  window_start  timestamptz not null,
  count         integer not null default 1,
  primary key (ip_hash, bucket, window_start)
);

create table ai_logs (
  id          bigint generated always as identity primary key,
  feature     text not null,             -- 'chat' | 'plan' | 'explanation' | 'vision' | 'embed'
  provider    text not null,
  model       text not null,
  status      text not null,             -- 'ok' | 'fallback' | 'error'
  latency_ms  integer,
  error_code  text,
  created_at  timestamptz not null default now()
);

-- RLS on, no policies: all access is server-side with the service role key.
alter table districts enable row level security;
alter table flood_events enable row level security;
alter table flood_prone_subdistricts enable row level security;
alter table shelters enable row level security;
alter table emergency_contacts enable row level security;
alter table cache_kv enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table preparedness_plans enable row level security;
alter table reports enable row level security;
alter table rate_limits enable row level security;
alter table ai_logs enable row level security;

create or replace function match_chunks(
  query_embedding vector(768),
  match_count int default 5,
  min_similarity float default 0.55
)
returns table (id bigint, document_id smallint, content text, page int, section_title text, similarity float)
language sql stable as $$
  select c.id, c.document_id, c.content, c.page, c.section_title,
         1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  where 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Keyword fallback when embedding fails
create or replace function search_chunks_fts(q text, match_count int default 5)
returns table (id bigint, document_id smallint, content text, page int, section_title text, rank real)
language sql stable as $$
  select c.id, c.document_id, c.content, c.page, c.section_title,
         ts_rank(c.fts, websearch_to_tsquery('indonesian', q)) as rank
  from document_chunks c
  where c.fts @@ websearch_to_tsquery('indonesian', q)
  order by rank desc
  limit match_count;
$$;

insert into storage.buckets (id, name, public) values ('reports', 'reports', true) on conflict (id) do nothing;
