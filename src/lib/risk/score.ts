import { getRiskLevel, type RiskLevel } from "./level";

export type RainfallCategory =
  "none" | "light" | "moderate" | "heavy" | "very_heavy" | "extreme";

export const RAINFALL_CATEGORY_LABELS: Record<RainfallCategory, string> = {
  none: "Tidak/sangat ringan",
  light: "Ringan",
  moderate: "Sedang",
  heavy: "Lebat",
  very_heavy: "Sangat lebat",
  extreme: "Ekstrem",
};

export function classifyRainfall(mm: number): {
  category: RainfallCategory;
  factor: number;
} {
  if (mm < 5) return { category: "none", factor: 0 };
  if (mm < 20) return { category: "light", factor: 20 };
  if (mm < 50) return { category: "moderate", factor: 45 };
  if (mm < 100) return { category: "heavy", factor: 70 };
  if (mm <= 150) return { category: "very_heavy", factor: 90 };
  return { category: "extreme", factor: 100 };
}

export function calculateRiskScore(i: {
  baseVulnerability: number;
  maxRainfallMm: number | null;
}): {
  score: number;
  level: RiskLevel;
  rainfallFactor: number;
  rainfallCategory: RainfallCategory | null;
  noRainfallData: boolean;
} {
  const rain =
    i.maxRainfallMm === null ? null : classifyRainfall(i.maxRainfallMm);
  const rainfallFactor = rain?.factor ?? 0;
  const score = Math.round(0.55 * i.baseVulnerability + 0.45 * rainfallFactor);
  return {
    score,
    level: getRiskLevel(score),
    rainfallFactor,
    rainfallCategory: rain?.category ?? null,
    noRainfallData: rain === null,
  };
}
