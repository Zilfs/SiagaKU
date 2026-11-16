import { describe, expect, it } from "vitest";
import { getRainOutlook, parseRainOutlook } from "@/lib/data/open-meteo";
import { memoryCacheStore } from "@/lib/data/cache";

const hours = Array.from(
  { length: 48 },
  (_, i) => `2026-11-16T${String(i % 24).padStart(2, "0")}:00`,
);
const fixture = {
  daily: {
    time: ["2026-11-16", "2026-11-17"],
    precipitation_sum: [4.5, null],
    temperature_2m_max: [31.2, 30],
    weather_code: [63, null],
  },
  hourly: {
    time: hours,
    precipitation: Array.from({ length: 48 }, (_, i) =>
      i === 15 ? 2.1 : i === 30 ? 9 : null,
    ),
  },
};

describe("parseRainOutlook", () => {
  it("parses daily rows and the first 24 hours", () => {
    const r = parseRainOutlook(fixture)!;
    expect(r.daily).toEqual([
      { date: "2026-11-16", rainMm: 4.5, tempMax: 31.2, weatherCode: 63 },
      { date: "2026-11-17", rainMm: null, tempMax: 30, weatherCode: null },
    ]);
    expect(r.hourlyToday).toHaveLength(24);
    expect(r.hourlyToday[15]).toEqual({ hour: 15, rainMm: 2.1 });
    expect(r.hourlyToday[6]).toEqual({ hour: 6, rainMm: null });
  });
  it("missing or malformed -> null", () => {
    expect(parseRainOutlook({})).toBeNull();
    expect(parseRainOutlook(null)).toBeNull();
    expect(parseRainOutlook({ daily: { time: [] } })).toBeNull();
  });
});

describe("getRainOutlook", () => {
  it("failure -> null", async () => {
    const r = await getRainOutlook(1, 0, 0, {
      fetch: (async () => {
        throw new Error("x");
      }) as unknown as typeof fetch,
      store: memoryCacheStore(),
    });
    expect(r).toBeNull();
  });
  it("success -> parsed and cached", async () => {
    let calls = 0;
    const f = (async () => {
      calls++;
      return new Response(JSON.stringify(fixture));
    }) as typeof fetch;
    const store = memoryCacheStore();
    const a = await getRainOutlook(1, 0, 0, { fetch: f, store });
    await getRainOutlook(1, 0, 0, { fetch: f, store });
    expect(a?.daily).toHaveLength(2);
    expect(calls).toBe(1);
  });
});
