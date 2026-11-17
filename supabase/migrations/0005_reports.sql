-- Community flood reports (F4): bring the `reports` table from 0001_init in line with the
-- report API, and add the private photo bucket.
-- Apply through the Supabase MCP, not `supabase db push` (remote history uses dated versions).
-- The table was still empty when this ran, so the status change needs no data update.

-- The API writes menunggu (vision pending or failed), selesai and ditolak; 0001 used English
-- placeholders with no check.
alter table reports alter column ai_status set default 'menunggu';
alter table reports
  add constraint reports_ai_status_check
  check (ai_status in ('menunggu', 'selesai', 'gagal', 'ditolak'));

-- One uploaded photo becomes at most one report (the API answers 409 on a duplicate).
alter table reports add constraint reports_photo_path_key unique (photo_path);

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
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
