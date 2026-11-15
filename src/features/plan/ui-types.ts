/**
 * The shapes the plan UI exchanges with `/api/plans`, mirroring the W3 schema in
 * `src/features/plan/schemas.ts` on the preparedness-plan branch. When that branch merges,
 * these aliases can be replaced with imports from the schema module.
 */

export type HousingType =
  | "single_story"
  | "multi_story"
  | "rented_room"
  | "apartment";

export type DisabilityType =
  | "wheelchair_user"
  | "blind"
  | "deaf"
  | "intellectual"
  | "other";

export type Vehicle = "none" | "motorcycle" | "car" | "both";

export type RiverDistance = "close" | "medium" | "far" | "unknown";

export type ReadinessLevel = "advisory" | "watch" | "warning";

export type Priority = "required" | "important" | "optional";

export type PlanRequest = {
  district_id: number;
  housing: { type: HousingType; floor: number };
  members: {
    adults: number;
    children: number;
    infants: number;
    elderly: number;
    pregnant: number;
    disabilities: { type: DisabilityType }[];
    routineMedicine: number;
    pets: string[];
  };
  conditions: {
    vehicle: Vehicle;
    riverDistance: RiverDistance;
    floodedBefore: boolean;
  };
};

export type GoKitItem = {
  item: string;
  quantity: string;
  audience: string;
  priority: Priority;
  reason: string;
};

export type VulnerableGroup = { group: string; notes: string[] };

export type PreparednessPlan = {
  summary: string;
  recommendedReadinessLevel: ReadinessLevel;
  goKit: GoKitItem[];
  before: string[];
  during: string[];
  after: string[];
  vulnerableGroups: VulnerableGroup[];
  safePointIds: number[];
  safePointReason: string;
};

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

export type EmergencyContact = {
  name: string;
  phone: string;
  scope: string;
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
