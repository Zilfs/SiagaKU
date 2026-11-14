import type { ProviderName } from "@/lib/ai/router";
import type { WeatherSlot } from "@/lib/data/bmkg";
import type { RiskLevel } from "@/lib/risk/level";
import type { RainfallCategory } from "@/lib/risk/score";

export type District = {
  id: number;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  tidalFloodProne: boolean;
  baseVulnerability: number;
  bmkgAdm4: string;
};

/** One row of GET /api/districts. */
export type DistrictSummary = {
  id: number;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  score: number;
  level: RiskLevel;
  tidalFloodProne: boolean;
};

export type FloodEvent = {
  date: string;
  subdistrict: string | null;
  maxDepthCm: number | null;
  sourceUrl: string;
};

export type SafePoint = {
  id: number;
  name: string;
  type: string;
  isVerified: boolean;
  lat: number | null;
  lng: number | null;
};

/** Body of GET /api/risk/[id]. */
export type RiskDetail = {
  district: Pick<
    District,
    "id" | "slug" | "name" | "city" | "lat" | "lng" | "tidalFloodProne"
  >;
  score: number;
  level: RiskLevel;
  components: {
    baseVulnerability: number;
    rainfallFactor: number;
    maxRainfallMm: number | null;
    rainfallCategory: RainfallCategory | null;
  };
  noRainfallData: boolean;
  weather: {
    source: "BMKG";
    updatedAt: string | null;
    stale: boolean;
    slots: WeatherSlot[];
  };
  floodHistory: FloodEvent[];
  safePoints: SafePoint[];
};

export type AiMeta = {
  provider: ProviderName | "template";
  model: string | null;
  fallback: boolean;
  cached: boolean;
};
