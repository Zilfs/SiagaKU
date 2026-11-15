/**
 * The shapes the plan UI exchanges with the API. The household/plan enums and objects come from
 * the W3 schema, so there is one source of truth; only the page's composed response and the
 * form's district option live here.
 */
export type {
  DisabilityType,
  EmergencyContact,
  GoKitItem,
  HousingType,
  PlanRequest,
  PreparednessPlan,
  Priority,
  ReadinessLevel,
} from "./schemas";

import type {
  EmergencyContact,
  PlanRequest,
  PreparednessPlan,
} from "./schemas";

export type Vehicle = PlanRequest["conditions"]["vehicle"];
export type RiverDistance = PlanRequest["conditions"]["riverDistance"];
export type VulnerableGroup = PreparednessPlan["vulnerableGroups"][number];

export type PlanDistrict = {
  id: number;
  slug: string;
  name: string;
  city: string;
};

export type PlanSafePoint = {
  id: number;
  name: string;
  type: string;
  isVerified: boolean;
  lat: number | null;
  lng: number | null;
};

export type PlanResponse = {
  slug: string;
  createdAt: string;
  district: PlanDistrict;
  profile: PlanRequest;
  plan: PreparednessPlan;
  safePoints: PlanSafePoint[];
  emergencyContacts: EmergencyContact[];
};

export type PlanCreated = {
  slug: string;
  url: string;
  meta?: { provider?: string; model?: string | null; fallback?: boolean };
};

export type DistrictOption = {
  id: number;
  slug: string;
  name: string;
  city: string;
};
