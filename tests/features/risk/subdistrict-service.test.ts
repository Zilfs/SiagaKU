import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/risk/server/risk-repository", () => ({
  listSubdistricts: vi.fn(async () => [
    { code: "3171011001", name: "Gambir", lat: -6.17, lng: 106.82 },
  ]),
  listFloodProneSubdistricts: vi.fn(async () => [
    { subdistrict: "Gambir", rwCount: 3 },
  ]),
  listFloodEvents: vi.fn(async () => [
    {
      date: "2025-01-05",
      subdistrict: "Gambir",
      maxDepthCm: 40,
      sourceUrl: null,
    },
  ]),
}));
vi.mock("@/lib/data/open-meteo", () => ({
  getMaxRainfall3Days: vi.fn(async () => ({ maxMm: null, stale: false })),
}));
vi.mock("@/lib/data/bmkg", () => ({
  getBmkgForecast: vi.fn(async () => ({ data: null, stale: false })),
}));

import { listFloodEvents } from "@/features/risk/server/risk-repository";
import { getSubdistrictBreakdown } from "@/features/risk/server/risk-service";

describe("getSubdistrictBreakdown", () => {
  it("joins the district's subdistricts, events and flood-prone list", async () => {
    const { rows, unmatchedEventCount } = await getSubdistrictBreakdown(12, []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ eventCount: 1, floodProne: true });
    expect(unmatchedEventCount).toBe(0);
    expect(listFloodEvents).toHaveBeenCalledWith(12, 1000);
  });
});
