import { getOrSet, type CacheStore } from "./cache";

export function parseMaxRainfall(json: unknown): number | null {
  const sums =
    typeof json === "object" && json !== null
      ? (json as { daily?: { precipitation_sum?: unknown } }).daily
          ?.precipitation_sum
      : null;
  if (!Array.isArray(sums)) return null;
  const nums = sums.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  return nums.length ? Math.max(...nums) : null;
}

export async function getMaxRainfall3Days(
  districtId: number,
  lat: number,
  lng: number,
  deps: { fetch?: typeof fetch; store?: CacheStore; now?: () => Date } = {},
): Promise<{ maxMm: number | null; stale: boolean }> {
  const doFetch = deps.fetch ?? fetch;
  try {
    const { value, stale } = await getOrSet(
      `om:fc:${districtId}`,
      3600,
      async () => {
        const res = await doFetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&timezone=Asia%2FJakarta&forecast_days=3`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        return parseMaxRainfall(await res.json());
      },
      deps.store,
      deps.now,
    );
    return { maxMm: value, stale };
  } catch (e) {
    console.error("open-meteo fetch failed", districtId, e);
    return { maxMm: null, stale: false };
  }
}
