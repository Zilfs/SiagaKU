import type { RiskLevel } from "@/lib/risk/level";

/** What the map draws for a district: only the fields the popup and the circle use. */
export type MapDistrict = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  level: RiskLevel;
};

/** A citizen report marker (camera), shared by the risk and report features. */
export type MapReport = {
  id: string;
  lat: number;
  lng: number;
  severity: number;
  summary: string;
  isDemo: boolean;
};
