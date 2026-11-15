import {
  RAINFALL_CATEGORY_LABELS,
  type RainfallCategory,
} from "@/lib/risk/score";

/** Normalise the early-warning and subdistrict APIs (docs/07), whatever casing W3 lands. */

export const STATUS_NAMES = ["Normal", "Waspada", "Siaga", "Awas"] as const;
export type StatusName = (typeof STATUS_NAMES)[number];

const STATUS_ALIASES: Record<string, StatusName> = {
  normal: "Normal",
  waspada: "Waspada",
  advisory: "Waspada",
  siaga: "Siaga",
  watch: "Siaga",
  awas: "Awas",
  warning: "Awas",
};

/** Accept the Indonesian label or the English enum from the glossary. */
export function toStatusName(value: unknown): StatusName | null {
  if (typeof value !== "string") return null;
  return STATUS_ALIASES[value.trim().toLowerCase()] ?? null;
}

export type RawAlert = {
  status?: string;
  skor?: number;
  score?: number;
  hujan_24j_mm?: number;
  hujan24jMm?: number;
  rainfall_24h_mm?: number;
  rainfall24hMm?: number;
  kategori_hujan?: string | null;
  kategoriHujan?: string | null;
  rainfall_category?: string | null;
  rainfallCategory?: string | null;
  jendela?: { mulai?: string; selesai?: string } | null;
  window?: { start?: string; end?: string } | null;
};

export type AlertInfo = {
  status: StatusName | null;
  score: number | null;
  rainfallMm: number | null;
  category: string | null;
  windowLabel: string | null;
};

function clock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}.${minute}`;
}

/** "15.00–18.00 WIB", or null when the API sends no window. */
export function formatWindow(
  start: string | undefined,
  end: string | undefined,
): string | null {
  if (!start || !end) return null;
  return `${clock(start)}–${clock(end)} WIB`;
}

/** The API sends the English enum ("moderate"); show its Indonesian label ("Sedang"). */
function categoryLabel(value: string | null): string | null {
  if (value && value in RAINFALL_CATEGORY_LABELS) {
    return RAINFALL_CATEGORY_LABELS[value as RainfallCategory];
  }
  return value;
}

export function toAlertInfo(raw: RawAlert | null | undefined): AlertInfo {
  if (!raw) {
    return {
      status: null,
      score: null,
      rainfallMm: null,
      category: null,
      windowLabel: null,
    };
  }
  return {
    status: toStatusName(raw.status),
    score: raw.skor ?? raw.score ?? null,
    rainfallMm:
      raw.rainfall24hMm ??
      raw.hujan_24j_mm ??
      raw.hujan24jMm ??
      raw.rainfall_24h_mm ??
      null,
    category: categoryLabel(
      raw.rainfallCategory ??
        raw.kategori_hujan ??
        raw.kategoriHujan ??
        raw.rainfall_category ??
        null,
    ),
    windowLabel: formatWindow(
      raw.jendela?.mulai ?? raw.window?.start,
      raw.jendela?.selesai ?? raw.window?.end,
    ),
  };
}

export type Subdistrict = {
  kode: string;
  nama: string;
  kecamatan: string;
  kota: string;
};

type RawSubdistrict = {
  kode?: string;
  code?: string;
  nama?: string;
  name?: string;
  kecamatan?: string;
  district?: string;
  kota?: string;
  city?: string;
};

/** One row of GET /api/subdistricts, tolerating docs/07 and English keys. */
export function toSubdistrict(raw: RawSubdistrict): Subdistrict | null {
  const kode = raw.kode ?? raw.code;
  const nama = raw.nama ?? raw.name;
  if (!kode || !nama) return null;
  return {
    kode,
    nama,
    kecamatan: raw.kecamatan ?? raw.district ?? "",
    kota: raw.kota ?? raw.city ?? "",
  };
}

/** The endpoint may return an array or `{ data: [...] }`. */
export function parseSubdistricts(payload: unknown): Subdistrict[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];
  return rows
    .map((row) => toSubdistrict(row as RawSubdistrict))
    .filter((item): item is Subdistrict => item !== null);
}

/** "kebayoran-baru" → "Kebayoran Baru", used when the query carries a district slug. */
export function districtNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
