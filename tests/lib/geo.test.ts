import { describe, expect, it } from "vitest";
import { distanceKm, findNearestDistrict } from "@/lib/geo";

const monas = { lat: -6.1754, lng: 106.8272 };
const hi = { lat: -6.195, lng: 106.823 };

describe("distanceKm", () => {
  it("Monas to Bundaran HI is about 2.2 km", () => {
    expect(distanceKm(monas, hi)).toBeGreaterThan(2.0);
    expect(distanceKm(monas, hi)).toBeLessThan(2.4);
  });
});

describe("findNearestDistrict", () => {
  const list = [
    { slug: "gambir", lat: -6.176, lng: 106.818 },
    { slug: "jatinegara", lat: -6.23, lng: 106.87 },
  ];

  it("picks the nearest centroid", () => {
    expect(findNearestDistrict(hi, list)?.slug).toBe("gambir");
  });

  it("returns null outside the max distance (Bandung)", () => {
    expect(
      findNearestDistrict({ lat: -6.9175, lng: 107.6191 }, list),
    ).toBeNull();
  });
});
