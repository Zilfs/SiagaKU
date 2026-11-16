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
        const max = parseMaxRainfall(await res.json());
        if (max === null) throw new Error("Open-Meteo empty forecast");
        return max;
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

export type RainOutlook = {
  daily: {
    date: string;
    rainMm: number | null;
    tempMax: number | null;
    weatherCode: number | null;
  }[];
  hourlyToday: { hour: number; rainMm: number | null }[];
};

const numOrNull = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export function parseRainOutlook(json: unknown): RainOutlook | null {
  if (typeof json !== "object" || json === null) return null;
  const { daily, hourly } = json as {
    daily?: Record<string, unknown>;
    hourly?: Record<string, unknown>;
  };
  const dates = daily?.time;
  if (!Array.isArray(dates) || dates.length === 0) return null;
  const col = (src: Record<string, unknown> | undefined, k: string) =>
    Array.isArray(src?.[k]) ? (src[k] as unknown[]) : [];
  const rain = col(daily, "precipitation_sum");
  const temp = col(daily, "temperature_2m_max");
  const code = col(daily, "weather_code");
  const hourlyRain = col(hourly, "precipitation");
  return {
    daily: dates.map((d, i) => ({
      date: String(d),
      rainMm: numOrNull(rain[i]),
      tempMax: numOrNull(temp[i]),
      weatherCode: numOrNull(code[i]),
    })),
    hourlyToday: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      rainMm: numOrNull(hourlyRain[hour]),
    })),
  };
}

export async function getRainOutlook(
  districtId: number,
  lat: number,
  lng: number,
  deps: { fetch?: typeof fetch; store?: CacheStore; now?: () => Date } = {},
): Promise<RainOutlook | null> {
  const doFetch = deps.fetch ?? fetch;
  try {
    const { value } = await getOrSet(
      `om:outlook:${districtId}`,
      3600,
      async () => {
        const res = await doFetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum,temperature_2m_max,weather_code&hourly=precipitation&timezone=Asia%2FJakarta&forecast_days=7`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        const parsed = parseRainOutlook(await res.json());
        if (parsed === null) throw new Error("Open-Meteo empty outlook");
        return parsed;
      },
      deps.store,
      deps.now,
    );
    return value;
  } catch (e) {
    console.error("open-meteo outlook fetch failed", districtId, e);
    return null;
  }
}
