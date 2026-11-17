import type { ReportPoint } from "./types";

/** One item of GET /api/reports?hours=72 (docs/07), with camelCase tolerated. */
export type RawReport = {
  id?: string;
  lat?: number;
  lng?: number;
  foto_url?: string;
  photo_url?: string;
  photoUrl?: string;
  keparahan?: number;
  severity?: number;
  ringkasan?: string;
  summary?: string;
  is_demo?: boolean;
  isDemo?: boolean;
  created_at?: string;
  createdAt?: string;
};

/** POST /api/reports: docs/07 keys or the English translation, whichever W3 lands. */
export type RawReportCreated = {
  id?: string;
  ai_status?: string;
  aiStatus?: string;
  ai_hasil?: RawVision;
  aiResult?: RawVision;
  error?: { code?: string; message?: string };
};

type RawVision = {
  apakah_banjir?: boolean;
  isFlood?: boolean;
  estimasi_tinggi_air?: string;
  estimatedWaterHeight?: string;
  ringkasan?: string;
  summary?: string;
};

/** What the form shows after a report: the AI's verdict, already normalised. */
export type ReportResult = {
  id?: string;
  status?: string;
  summary: string;
  waterHeight: string;
  rejected: boolean;
};

/** Normalise one API row; a row without an id or coordinates is dropped. */
export function toReportPoint(raw: RawReport): ReportPoint | null {
  if (!raw.id || typeof raw.lat !== "number" || typeof raw.lng !== "number") {
    return null;
  }
  const severity = raw.keparahan ?? raw.severity ?? 0;
  return {
    id: raw.id,
    lat: raw.lat,
    lng: raw.lng,
    photoUrl: raw.foto_url ?? raw.photo_url ?? raw.photoUrl ?? "",
    severity: Math.min(4, Math.max(0, Math.round(severity))),
    summary: raw.ringkasan ?? raw.summary ?? "",
    isDemo: raw.is_demo === true || raw.isDemo === true,
    createdAt: raw.created_at ?? raw.createdAt ?? "",
  };
}

/** The severity labels (0 is "not a flood", which the API never returns to this list). */
const SEVERITY_LABELS = [
  "Tidak terlihat banjir",
  "Genangan tipis",
  "Genangan sedang",
  "Genangan dalam",
  "Banjir parah",
] as const;

export function severityLabel(severity: number): string {
  const index = Math.min(4, Math.max(0, Math.round(severity)));
  return SEVERITY_LABELS[index];
}

/** Normalise the POST response. "rejected" and `apakah_banjir: false` mean not shown. */
export function toReportResult(raw: RawReportCreated): ReportResult {
  const vision = raw.ai_hasil ?? raw.aiResult ?? {};
  const status = raw.ai_status ?? raw.aiStatus;
  const isFlood = vision.apakah_banjir ?? vision.isFlood;
  return {
    id: raw.id,
    status,
    summary: vision.ringkasan ?? vision.summary ?? "",
    waterHeight: vision.estimasi_tinggi_air ?? vision.estimatedWaterHeight ?? "",
    rejected: status === "rejected" || isFlood === false,
  };
}
