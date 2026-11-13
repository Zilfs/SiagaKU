import { describe, expect, it } from "vitest";
import bmkgFixture from "../fixtures/bmkg-gambir.json";
import omFixture from "../fixtures/open-meteo-forecast.json";
import { getBmkgForecast, parseBmkgForecast } from "@/lib/data/bmkg";
import { getMaxRainfall3Days, parseMaxRainfall } from "@/lib/data/open-meteo";
import { memoryCacheStore } from "@/lib/data/cache";

const t0 = new Date("2026-01-01T00:00:00Z");
const later = new Date("2026-01-01T05:00:00Z");
const failing = (async () => {
  throw new Error("network");
}) as unknown as typeof fetch;
const json = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

describe("parseBmkgForecast", () => {
  it("parses the real fixture", () => {
    const r = parseBmkgForecast(bmkgFixture);
    expect(r.slots.length).toBeGreaterThanOrEqual(8);
    expect(typeof r.slots[0].temperature).toBe("number");
    expect(r.slots[0].localTime).toBe("2026-11-14 00:00:00");
    expect(r.updatedAt).toBe("2026-11-13T12:00:00");
  });
  it("empty object -> no throw", () => {
    expect(parseBmkgForecast({})).toEqual({ updatedAt: null, slots: [] });
  });
  it("non-numeric values -> null", () => {
    const r = parseBmkgForecast({
      data: [{ cuaca: [[{ local_datetime: "x", t: "a", hu: null, tp: "b" }]] }],
    });
    expect(r.slots[0]).toMatchObject({
      temperature: null,
      humidity: null,
      rainfallMm: null,
    });
  });
});

describe("parseMaxRainfall", () => {
  it("max of precipitation_sum", () => {
    expect(parseMaxRainfall(omFixture)).toBe(6.7);
  });
  it("ignores null", () => {
    expect(
      parseMaxRainfall({ daily: { precipitation_sum: [null, 3, null] } }),
    ).toBe(3);
  });
  it("all null / missing -> null", () => {
    expect(
      parseMaxRainfall({ daily: { precipitation_sum: [null] } }),
    ).toBeNull();
    expect(parseMaxRainfall({})).toBeNull();
  });
});

describe("fetchers", () => {
  it("bmkg: failure + no cache -> null", async () => {
    const r = await getBmkgForecast("1", {
      fetch: failing,
      store: memoryCacheStore(),
    });
    expect(r).toEqual({ data: null, stale: false });
  });
  it("bmkg: non-2xx is an error", async () => {
    const r = await getBmkgForecast("1", {
      fetch: json({}, 500),
      store: memoryCacheStore(),
    });
    expect(r).toEqual({ data: null, stale: false });
  });
  it("bmkg: failure + expired cache -> stale value", async () => {
    const store = memoryCacheStore();
    await store.set("bmkg:1", { updatedAt: null, slots: [] }, t0);
    const r = await getBmkgForecast("1", {
      fetch: failing,
      store,
      now: () => later,
    });
    expect(r).toEqual({ data: { updatedAt: null, slots: [] }, stale: true });
  });
  it("open-meteo: success parses and caches", async () => {
    const store = memoryCacheStore();
    const r = await getMaxRainfall3Days(5, -6.1, 106.8, {
      fetch: json(omFixture),
      store,
    });
    expect(r).toEqual({ maxMm: 6.7, stale: false });
    expect(await store.get("om:fc:5")).not.toBeNull();
  });
  it("open-meteo: failure + no cache -> null", async () => {
    const r = await getMaxRainfall3Days(5, -6.1, 106.8, {
      fetch: failing,
      store: memoryCacheStore(),
    });
    expect(r).toEqual({ maxMm: null, stale: false });
  });
  it("open-meteo: failure + expired cache -> stale", async () => {
    const store = memoryCacheStore();
    await store.set("om:fc:5", 12, t0);
    const r = await getMaxRainfall3Days(5, -6.1, 106.8, {
      fetch: failing,
      store,
      now: () => later,
    });
    expect(r).toEqual({ maxMm: 12, stale: true });
  });
});
