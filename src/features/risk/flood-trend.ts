export type MonthlyFloodCount = { month: string; count: number };

/** Zero-filled monthly counts, oldest first, ending at the current Asia/Jakarta month. */
export function monthlyFloodCounts(
  dates: string[],
  now: Date,
  months = 12,
): MonthlyFloodCount[] {
  // Jakarta has no DST and is a fixed UTC+7.
  const jakarta = new Date(now.getTime() + 7 * 3600_000);
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth() - i, 1),
    );
    buckets.set(d.toISOString().slice(0, 7), 0);
  }
  for (const date of dates) {
    const key = date.slice(0, 7);
    const n = buckets.get(key);
    if (n !== undefined) buckets.set(key, n + 1);
  }
  return [...buckets].map(([month, count]) => ({ month, count }));
}

/** End of the trend window: the latest event month not after `now`, else `now` itself. */
export function trendWindowEnd(dates: string[], now: Date): Date {
  const current = new Date(now.getTime() + 7 * 3600_000)
    .toISOString()
    .slice(0, 7);
  const latest = dates
    .map((d) => d.slice(0, 7))
    .filter((m) => m <= current)
    .sort()
    .pop();
  // Mid-month noon UTC is the same month in Jakarta.
  return latest ? new Date(`${latest}-15T12:00:00Z`) : now;
}
