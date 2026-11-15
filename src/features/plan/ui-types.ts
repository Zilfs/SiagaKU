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
import type { SafePoint } from "@/features/risk/types";

export type Vehicle = PlanRequest["conditions"]["vehicle"];
export type RiverDistance = PlanRequest["conditions"]["riverDistance"];
export type VulnerableGroup = PreparednessPlan["vulnerableGroups"][number];

/** A district row as the wizard's select needs it; also the plan's district in the response. */
export type PlanDistrict = {
  id: number;
  slug: string;
  name: string;
  city: string;
};

export type PlanResponse = {
  slug: string;
  createdAt: string;
  district: PlanDistrict;
  profile: PlanRequest;
  plan: PreparednessPlan;
  safePoints: SafePoint[];
  emergencyContacts: EmergencyContact[];
};
