import { describe, expect, it } from "vitest";
import { filterDistricts } from "@/features/risk/district-filter";
import type { DistrictSummary } from "@/features/risk/types";

const district = (name: string, city: string): DistrictSummary => ({
  id: 1,
  slug: name.toLowerCase(),
  name,
  city,
  lat: 0,
  lng: 0,
  score: 50,
  level: "high",
  tidalFloodProne: false,
});

const DISTRICTS = [
  district("Jatinegara", "Jakarta Timur"),
  district("Cengkareng", "Jakarta Barat"),
  district("Penjaringan", "Jakarta Utara"),
];

describe("filterDistricts", () => {
  it("keeps every district for a blank query", () => {
    expect(filterDistricts(DISTRICTS, "  ")).toEqual(DISTRICTS);
  });

  it("matches the name case-insensitively", () => {
    expect(filterDistricts(DISTRICTS, "JATI").map((d) => d.name)).toEqual([
      "Jatinegara",
    ]);
  });

  it("matches the city", () => {
    expect(filterDistricts(DISTRICTS, "utara").map((d) => d.name)).toEqual([
      "Penjaringan",
    ]);
  });

  it("returns nothing when no district matches", () => {
    expect(filterDistricts(DISTRICTS, "bogor")).toEqual([]);
  });
});
