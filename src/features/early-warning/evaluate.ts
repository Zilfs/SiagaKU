import type { WeatherSlot } from "@/lib/data/bmkg";
import {
  RAINFALL_CATEGORY_LABELS,
  classifyRainfall,
  type RainfallCategory,
} from "@/lib/risk/score";

/** Normal / Waspada / Siaga / Awas (glossary in AGENTS.md §3). */
export type AlertStatus = "normal" | "advisory" | "watch" | "warning";

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  normal: "Normal",
  advisory: "Waspada",
  watch: "Siaga",
  warning: "Awas",
};

const STATUS_RANK: Record<AlertStatus, number> = {
  normal: 0,
  advisory: 1,
  watch: 2,
  warning: 3,
};

export type Evaluation = {
  status: AlertStatus;
  score: number;
  rainfall24hMm: number;
  rainfallCategory: RainfallCategory;
  /** ISO times; `end` is the end of the last rainy 3-hour slot. */
  window: { start: string; end: string } | null;
};

const HOUR_MS = 3_600_000;
const SLOT_MS = 3 * HOUR_MS;

/** BMKG `local_datetime` is "YYYY-MM-DD HH:mm:ss" in WIB without an offset. */
function slotTime(slot: WeatherSlot): number {
  return new Date(`${slot.localTime.replace(" ", "T")}+07:00`).getTime();
}

const isHeavy = (description: string) => /lebat|petir/i.test(description);

/** docs/06 §7: a slot without tp is estimated from its description. */
function estimateMm(description: string): number {
  if (isHeavy(description)) return 40;
  if (/sedang/i.test(description)) return 15;
  if (/ringan/i.test(description)) return 5;
  return 0;
}

const isRainy = (slot: WeatherSlot) =>
  /sedang|lebat|petir/i.test(slot.description) || (slot.rainfallMm ?? 0) >= 2;

/** Early-warning rule for one subdistrict from the BMKG 3-hour forecast (docs/06 §7). */
export function evaluateEarlyWarning(input: {
  baseVulnerability: number;
  floodProne: boolean;
  slots: WeatherSlot[];
  now: Date;
}): Evaluation {
  const from = input.now.getTime();
  const next24h = input.slots
    .map((slot) => ({ slot, time: slotTime(slot) }))
    .filter(({ time }) => time >= from && time < from + 24 * HOUR_MS)
    .sort((a, b) => a.time - b.time);

  const rainfall24hMm =
    Math.round(
      next24h.reduce(
        (sum, { slot }) =>
          sum + (slot.rainfallMm ?? estimateMm(slot.description)),
        0,
      ) * 10,
    ) / 10;

  let { category, factor } = classifyRainfall(rainfall24hMm);
  if (next24h.some(({ slot }) => isHeavy(slot.description)) && factor < 70) {
    category = "heavy";
    factor = 70;
  }

  const vulnerability = Math.min(
    100,
    input.baseVulnerability + (input.floodProne ? 15 : 0),
  );
  const score = Math.round(0.55 * vulnerability + 0.45 * factor);

  let status: AlertStatus;
  if (factor < 20) status = "normal";
  else if (score < 50) status = "advisory";
  else if (score < 75) status = "watch";
  else status = "warning";

  const rainy = next24h.filter(({ slot }) => isRainy(slot));
  const first = rainy[0];
  const last = rainy[rainy.length - 1];
  const window =
    first && last
      ? {
          start: new Date(first.time).toISOString(),
          end: new Date(last.time + SLOT_MS).toISOString(),
        }
      : null;

  return { status, score, rainfall24hMm, rainfallCategory: category, window };
}

/** Push dedupe (docs/06 §7): watch/warning, and never sent, sent > 6 h ago, or the status rose. */
export function shouldSendPush(s: {
  status: AlertStatus;
  lastSentAt: Date | null;
  lastStatus: AlertStatus | null;
  now: Date;
}): boolean {
  if (s.status !== "watch" && s.status !== "warning") return false;
  if (!s.lastSentAt || !s.lastStatus) return true;
  if (s.now.getTime() - s.lastSentAt.getTime() > 6 * HOUR_MS) return true;
  return STATUS_RANK[s.status] > STATUS_RANK[s.lastStatus];
}

function wibClock(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date(iso));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}.${minute}`;
}

/** "15.00–18.00 WIB" */
export function formatWindowWib(window: {
  start: string;
  end: string;
}): string {
  return `${wibClock(window.start)}–${wibClock(window.end)} WIB`;
}

/** Push notification text (user-facing Indonesian). */
export function notificationText(
  name: string,
  e: Evaluation,
): { title: string; body: string } {
  const icon = e.status === "warning" ? "🚨" : "⚠️";
  const rain = RAINFALL_CATEGORY_LABELS[e.rainfallCategory].toLowerCase();
  const when = e.window ? ` diperkirakan ${formatWindowWib(e.window)}` : "";
  return {
    title: `${icon} ${ALERT_STATUS_LABELS[e.status]} banjir: ${name}`,
    body: `Potensi banjir. Hujan ${rain}${when}. Siapkan tas siaga dan pantau info resmi. Darurat: 112.`,
  };
}
