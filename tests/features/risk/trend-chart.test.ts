import { describe, expect, it } from "vitest";
import {
  monthLabel,
  niceTicks,
  stepAreaPath,
} from "@/features/risk/trend-chart";

describe("monthLabel", () => {
  it("uses Indonesian short names", () => {
    expect(monthLabel("2025-05")).toBe("Mei");
    expect(monthLabel("2025-08")).toBe("Agu");
    expect(monthLabel("2025-12", true)).toBe("Des 2025");
  });
});

describe("niceTicks", () => {
  it("returns 0 plus round steps covering the max", () => {
    expect(niceTicks(69)).toEqual([0, 25, 50, 75]);
    expect(niceTicks(8)).toEqual([0, 5, 10]);
  });
  it("falls back for an empty series", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

describe("stepAreaPath", () => {
  it("steps horizontally across each slot then closes to the baseline", () => {
    const { line, area } = stepAreaPath([2, 4], 100, 50, 4);
    // slot width 50; y = 50 - v/4*50
    expect(line).toBe("M0 25H50V0H100");
    expect(area).toBe("M0 50V25H50V0H100V50Z");
  });
});
