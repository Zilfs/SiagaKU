import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/risk/server/risk-repository", () => ({
  findDistrict: vi.fn(),
  listDistricts: vi.fn(),
  listFloodEvents: vi.fn(async () => []),
  listShelters: vi.fn(async () => []),
}));
vi.mock("@/lib/data/open-meteo", () => ({
  getMaxRainfall3Days: vi.fn(async () => ({ maxMm: null, stale: false })),
}));
vi.mock("@/lib/data/bmkg", () => ({
  getBmkgForecast: vi.fn(async () => ({ data: null, stale: false })),
}));

import { GET } from "@/app/api/risk/[id]/route";
import { findDistrict } from "@/features/risk/server/risk-repository";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (id: string) => new Request(`http://x/api/risk/${id}`);

const jatinegara = {
  id: 12,
  slug: "jatinegara",
  name: "Jatinegara",
  city: "Jakarta Timur",
  lat: -6.23,
  lng: 106.87,
  tidalFloodProne: false,
  baseVulnerability: 80,
  bmkgAdm4: "31.75.03.1001",
};

beforeEach(() => vi.mocked(findDistrict).mockReset());

describe("GET /api/risk/[id]", () => {
  it("returns 404 NOT_FOUND for an unknown district", async () => {
    vi.mocked(findDistrict).mockResolvedValue(null);
    const res = await GET(req("999"), ctx("999"));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("returns 200 without rainfall when Open-Meteo fails and nothing is cached", async () => {
    vi.mocked(findDistrict).mockResolvedValue(jatinegara);
    const res = await GET(req("jatinegara"), ctx("jatinegara"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.components.rainfallFactor).toBe(0);
    expect(body.noRainfallData).toBe(true);
    expect(body.score).toBe(44); // round(0.55 * 80)
    expect(body.level).toBe("moderate");
    expect(body.district).toMatchObject({ lat: -6.23, lng: 106.87 });
    expect(body.weather).toEqual({
      source: "BMKG",
      updatedAt: null,
      stale: false,
      slots: [],
    });
  });

  it("looks up numeric ids as ids and other values as slugs", async () => {
    vi.mocked(findDistrict).mockResolvedValue(null);
    await GET(req("12"), ctx("12"));
    await GET(req("jatinegara"), ctx("jatinegara"));
    expect(vi.mocked(findDistrict).mock.calls).toEqual([[12], ["jatinegara"]]);
  });
});
