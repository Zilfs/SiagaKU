-- Task 6: atomic fixed-window counter for rate_limits (see src/lib/rate-limit.ts).
create or replace function hit_rate_limit(
  p_ip_hash text,
  p_bucket text,
  p_window_start timestamptz
)
returns integer
language sql as $$
  insert into rate_limits (ip_hash, bucket, window_start, count)
  values (p_ip_hash, p_bucket, p_window_start, 1)
  on conflict (ip_hash, bucket, window_start)
  do update set count = rate_limits.count + 1
  returning count;
$$;

-- Server only (service role). Keep it off the public PostgREST API.
revoke execute on function hit_rate_limit(text, text, timestamptz) from public, anon, authenticated;
