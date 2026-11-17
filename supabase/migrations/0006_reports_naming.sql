-- Engineering names in English (AGENTS.md §3): report statuses go back to 0001_init's values and
-- photos live in the `reports` bucket that 0001 created. Indonesian stays in UI labels only.
-- Apply through the Supabase MCP, not `supabase db push` (remote history uses dated versions).
-- Both buckets and the table were empty when this ran, so nothing is copied or lost.

-- Statuses: pending (vision not done yet, or failed), done, failed, rejected.
alter table reports drop constraint reports_ai_status_check;
update reports set ai_status = case ai_status
  when 'menunggu' then 'pending'
  when 'selesai'  then 'done'
  when 'gagal'    then 'failed'
  when 'ditolak'  then 'rejected'
  else ai_status
end;
alter table reports alter column ai_status set default 'pending';
alter table reports
  add constraint reports_ai_status_check
  check (ai_status in ('pending', 'done', 'failed', 'rejected'));

-- Photos: 0001 made `reports` public with no limits. Make it private with the limits 0005 put
-- on `laporan`. Server-created signed URLs need no storage policy.
-- The empty `laporan` bucket is removed through the Storage API (dashboard), because Supabase
-- blocks deleting from storage tables in SQL.
update storage.buckets
set public = false,
    file_size_limit = 1500000,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'reports';
