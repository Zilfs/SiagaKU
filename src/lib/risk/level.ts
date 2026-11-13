export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Rendah",
  moderate: "Sedang",
  high: "Tinggi",
  very_high: "Sangat Tinggi",
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "very_high";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}
