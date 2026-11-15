-- Task 14: early warning per subdistrict. Names are English; docs/06 §3.6 uses Indonesian names:
-- subdistricts (docs: kelurahan)
-- push_subscriptions (docs: push_subscription)
-- early_warning_status (docs: peringatan_status)

create extension if not exists pg_trgm;

create table subdistricts (
  code         text primary key,                      -- BMKG adm4, e.g. '31.75.10.1004'
  district_id  smallint not null references districts(id),
  name         text not null,
  lat          double precision,                      -- from the BMKG response location
  lng          double precision,
  flood_prone  boolean not null default false         -- listed in flood_prone_subdistricts
);
create index on subdistricts (district_id);
create index on subdistricts using gin (name gin_trgm_ops);

create table push_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  endpoint          text unique not null,
  p256dh            text not null,
  auth              text not null,
  subdistrict_code  text not null references subdistricts(code) on delete cascade,
  last_sent_at      timestamptz,
  last_status       text check (last_status in ('watch', 'warning')),
  created_at        timestamptz not null default now()
);
create index on push_subscriptions (subdistrict_code);

-- Latest evaluation per subdistrict (banner and cron).
create table early_warning_status (
  subdistrict_code   text primary key references subdistricts(code) on delete cascade,
  status             text not null check (status in ('normal', 'advisory', 'watch', 'warning')),
  score              smallint not null,
  rainfall_24h_mm    numeric not null,
  rainfall_category  text not null,
  window_start       timestamptz,
  window_end         timestamptz,
  evaluated_at       timestamptz not null default now()
);

-- RLS on, no policies: all access is server-side with the service role key.
alter table subdistricts enable row level security;
alter table push_subscriptions enable row level security;
alter table early_warning_status enable row level security;
