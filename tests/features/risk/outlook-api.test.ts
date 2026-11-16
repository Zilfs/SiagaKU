import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/risk/server/risk-repository", () => ({
  findDistrict: vi.fn(),
  listDistricts: vi.fn(),
  listFloodEvents: vi.fn(),
  listFloodEventDates: vi.fn(),
  listShelters: vi.fn(),
}));
vi.mock("@/lib/data/open-meteo", () => ({
  getMaxRainfall3Days: vi.fn(),
  getRainOutlook: vi.fn(async () => null),
}));
vi.mock("@/lib/data/bmkg", () => ({ getBmkgForecast: vi.fn() }));

import { GET } from "@/app/api/risk/[id]/outlook/route";
import { findDistrict } from "@/features/risk/server/risk-repository";

const call = (id: string) =>
  GET(new Request(`http://x/api/risk/${id}/outlook`), {
    params: Promise.resolve({ id }),
  });

describe("GET /api/risk/[id]/outlook", () => {
  it("404 for unknown district", async () => {
    vi.mocked(findDistrict).mockResolvedValue(null);
    const res = await call("nope");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
  it("returns outlook null when upstream fails", async () => {
    vi.mocked(findDistrict).mockResolvedValue({
      id: 1,
      lat: 0,
      lng: 0,
    } as never);
    const res = await call("1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outlook: null });
  });
  it("500 INTERNAL when the repository throws", async () => {
    vi.mocked(findDistrict).mockRejectedValue(new Error("db"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await call("1");
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("INTERNAL");
  });
});
