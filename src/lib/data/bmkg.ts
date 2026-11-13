import { getOrSet, type CacheStore } from "./cache";

export type WeatherSlot = {
  localTime: string;
  temperature: number | null;
  humidity: number | null;
  description: string;
  icon: string | null;
  rainfallMm: number | null;
};

export type BmkgForecast = { updatedAt: string | null; slots: WeatherSlot[] };

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const str = (v: unknown) => (typeof v === "string" ? v : null);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export function parseBmkgForecast(json: unknown): BmkgForecast {
  const days =
    isObj(json) && Array.isArray(json.data) && isObj(json.data[0])
      ? json.data[0].cuaca
      : null;
  const raw = Array.isArray(days) ? days.flat() : [];
  const slots: WeatherSlot[] = [];
  let updatedAt: string | null = null;
  for (const s of raw) {
    if (!isObj(s)) continue;
    updatedAt ??= str(s.analysis_date);
    slots.push({
      localTime: str(s.local_datetime) ?? "",
      temperature: num(s.t),
      humidity: num(s.hu),
      description: str(s.weather_desc) ?? "",
      icon: str(s.image),
      rainfallMm: num(s.tp),
    });
  }
  return { updatedAt, slots };
}

export async function getBmkgForecast(
  adm4: string,
  deps: { fetch?: typeof fetch; store?: CacheStore; now?: () => Date } = {},
): Promise<{ data: BmkgForecast | null; stale: boolean }> {
  const doFetch = deps.fetch ?? fetch;
  try {
    const { value, stale } = await getOrSet(
      `bmkg:${adm4}`,
      10800,
      async () => {
        const res = await doFetch(
          `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`BMKG ${res.status}`);
        return parseBmkgForecast(await res.json());
      },
      deps.store,
      deps.now,
    );
    return { data: value, stale };
  } catch (e) {
    console.error("bmkg fetch failed", adm4, e);
    return { data: null, stale: false };
  }
}
