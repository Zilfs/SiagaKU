import { describe, expect, it } from "vitest";
import { getRiskLevel } from "@/lib/risk/level";
import { calculateRiskScore, classifyRainfall } from "@/lib/risk/score";
import { calculateBaseVulnerability } from "@/lib/risk/vulnerability";

describe("getRiskLevel", () => {
  it.each([
    [0, "low"],
    [24, "low"],
    [25, "moderate"],
    [49, "moderate"],
    [50, "high"],
    [74, "high"],
    [75, "very_high"],
    [100, "very_high"],
  ])("getRiskLevel(%i)=%s", (score, level) => {
    expect(getRiskLevel(score)).toBe(level);
  });
});

describe("classifyRainfall", () => {
  it.each([
    [0, 0],
    [4.9, 0],
    [5, 20],
    [19.9, 20],
    [20, 45],
    [50, 70],
    [100, 90],
    [150, 90],
    [150.1, 100],
  ])("rainfall factor %f mm -> %i", (mm, factor) => {
    expect(classifyRainfall(mm).factor).toBe(factor);
  });
});

describe("calculateRiskScore", () => {
  it("score = round(0.55*80 + 0.45*70) = 76", () => {
    const r = calculateRiskScore({ baseVulnerability: 80, maxRainfallMm: 62 });
    expect(r.score).toBe(76);
    expect(r.level).toBe("very_high");
    expect(r.rainfallCategory).toBe("heavy");
    expect(r.noRainfallData).toBe(false);
  });
  it("null rainfall -> factor 0, noRainfallData true", () => {
    const r = calculateRiskScore({
      baseVulnerability: 40,
      maxRainfallMm: null,
    });
    expect(r).toMatchObject({
      rainfallFactor: 0,
      rainfallCategory: null,
      noRainfallData: true,
      score: 22,
    });
  });
});

describe("calculateBaseVulnerability", () => {
  it("3 events, 2/7 prone, tidal -> 30 + 10 + 20 = 60", () => {
    expect(
      calculateBaseVulnerability({
        floodEvents5y: 3,
        floodProneSubdistricts: 2,
        totalSubdistricts: 7,
        tidalFloodProne: true,
      }),
    ).toBe(60);
  });
  it("capped at 100 and events capped at 50", () => {
    expect(
      calculateBaseVulnerability({
        floodEvents5y: 20,
        floodProneSubdistricts: 7,
        totalSubdistricts: 7,
        tidalFloodProne: true,
      }),
    ).toBe(100);
    expect(
      calculateBaseVulnerability({
        floodEvents5y: 20,
        floodProneSubdistricts: 0,
        totalSubdistricts: 7,
        tidalFloodProne: false,
      }),
    ).toBe(50);
  });
});
