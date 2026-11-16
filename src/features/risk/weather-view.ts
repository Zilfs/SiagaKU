import type { WeatherSlot } from "@/lib/data/bmkg";

/** The icon families the dashboard draws; components map each to a lucide icon. */
export type WeatherKind =
  "sun" | "cloud-sun" | "cloud" | "drizzle" | "rain" | "storm" | "fog";

export const WEATHER_KIND_LABELS: Record<WeatherKind, string> = {
  sun: "Cerah",
  "cloud-sun": "Cerah berawan",
  cloud: "Berawan",
  drizzle: "Hujan ringan",
  rain: "Hujan",
  storm: "Hujan petir",
  fog: "Berkabut",
};

/** Open-Meteo `weather_code` (WMO) to an icon family. */
export function kindFromCode(code: number | null): WeatherKind {
  if (code === null) return "cloud";
  if (code === 0) return "sun";
  if (code <= 2) return "cloud-sun";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95) return "storm";
  return "cloud";
}

/** BMKG `weather_desc` (Indonesian) to an icon family. */
export function kindFromDescription(description: string): WeatherKind {
  const d = description.toLowerCase();
  if (d.includes("petir")) return "storm";
  if (d.includes("hujan ringan")) return "drizzle";
  if (d.includes("hujan")) return "rain";
  if (/kabut|kabur|asap/.test(d)) return "fog";
  if (d.includes("cerah berawan")) return "cloud-sun";
  if (d.includes("cerah")) return "sun";
  return "cloud";
}

const HOUR = 3_600_000;

/** BMKG local times ("2026-11-16 15:00:00") are WIB, UTC+7. */
const slotTime = (slot: WeatherSlot) =>
  Date.parse(`${slot.localTime.replace(" ", "T")}+07:00`);

/** The forecast slot nearest to now, or null when no slot has a valid time. */
export function pickCurrentSlot(
  slots: WeatherSlot[],
  now: Date,
): WeatherSlot | null {
  let best: WeatherSlot | null = null;
  let bestGap = Infinity;
  for (const slot of slots) {
    const gap = Math.abs(slotTime(slot) - now.getTime());
    if (gap < bestGap) {
      best = slot;
      bestGap = gap;
    }
  }
  return best;
}

const isRainy = (slot: WeatherSlot) =>
  (slot.rainfallMm ?? 0) > 0 || /hujan|petir/i.test(slot.description);

/** The first slot with rain from the current 3-hour slot up to 24 hours ahead. */
export function pickNextRainSlot(
  slots: WeatherSlot[],
  now: Date,
): WeatherSlot | null {
  const from = now.getTime() - 1.5 * HOUR;
  const to = now.getTime() + 24 * HOUR;
  return (
    slots.find((slot) => {
      const t = slotTime(slot);
      return t >= from && t <= to && isRainy(slot);
    }) ?? null
  );
}

/** The current hour (0–23) in Asia/Jakarta. */
export const jakartaHour = (now: Date) => (now.getUTCHours() + 7) % 24;

const jakartaDate = (ms: number) =>
  new Date(ms + 7 * HOUR).toISOString().slice(0, 10);

/** "Hujan lebat diprakirakan 15:00 di Jatinegara." with "besok" when the slot is tomorrow. */
export function rainHeadline(
  slot: WeatherSlot,
  now: Date,
  districtName: string,
): string {
  const desc = /hujan|petir/i.test(slot.description)
    ? slot.description.charAt(0).toUpperCase() +
      slot.description.slice(1).toLowerCase()
    : "Hujan";
  const day =
    jakartaDate(slotTime(slot)) === jakartaDate(now.getTime()) ? "" : "besok ";
  return `${desc} diprakirakan ${day}${slot.localTime.slice(11, 16)} di ${districtName}.`;
}
