import type { AlertStatus, Evaluation } from "./evaluate";

/** A subdistrict with what the early-warning rule needs from its district. */
export type Subdistrict = {
  code: string;
  name: string;
  floodProne: boolean;
  district: {
    id: number;
    slug: string;
    name: string;
    city: string;
    baseVulnerability: number;
  };
};

export type StoredStatus = Evaluation & { evaluatedAt: string };

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  subdistrictCode: string;
  lastSentAt: string | null;
  lastStatus: AlertStatus | null;
};

/** Body of GET /api/early-warning/[code]. */
export type EarlyWarningResponse = {
  subdistrict: {
    code: string;
    name: string;
    districtSlug: string;
    districtName: string;
  };
  status: AlertStatus;
  score: number;
  rainfall24hMm: number;
  rainfallCategory: Evaluation["rainfallCategory"];
  window: Evaluation["window"];
  evaluatedAt: string;
  stale: boolean;
  source: "BMKG";
};
