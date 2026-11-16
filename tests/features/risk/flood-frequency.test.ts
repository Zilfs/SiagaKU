import { describe, expect, it } from "vitest";
import { countFloodEvents, floodShade } from "@/features/risk/flood-frequency";

describe("floodShade", () => {
  it("is 0 without events and 4 for the busiest district", () => {
    expect(floodShade(0, 20)).toBe(0);
    expect(floodShade(20, 20)).toBe(4);
  });
  it("gives any district with events at least the lightest shade", () => {
    expect(floodShade(1, 100)).toBe(1);
    expect(floodShade(50, 100)).toBe(2);
    expect(floodShade(51, 100)).toBe(3);
  });
  it("is 0 when nothing was recorded anywhere", () => {
    expect(floodShade(0, 0)).toBe(0);
  });
});

describe("countFloodEvents", () => {
  it("counts per district and keeps the covered period", () => {
    expect(
      countFloodEvents([
        { districtId: 3, date: "2025-02-08" },
        { districtId: 3, date: "2024-01-02" },
        { districtId: 7, date: "2026-01-20" },
      ]),
    ).toEqual({
      counts: { 3: 2, 7: 1 },
      firstDate: "2024-01-02",
      lastDate: "2026-01-20",
    });
  });
  it("handles an empty history", () => {
    expect(countFloodEvents([])).toEqual({
      counts: {},
      firstDate: null,
      lastDate: null,
    });
  });
});
