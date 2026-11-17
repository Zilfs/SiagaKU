import { distanceKm } from "@/lib/geo";
import type {
  FloodEvent,
  FloodProneSubdistrict,
  SafePoint,
  Subdistrict,
  SubdistrictBreakdown,
  SubdistrictSummary,
} from "./types";

// Spelling variants between data releases, see data/README.md "Nama kelurahan mengikuti rilis".
const ALIASES: Record<string, string> = {
  jelmbar: "jelambar",
  bidarancina: "bidaracina",
  cillitan: "cililitan",
  kampungtengah: "tengah",
};

/** Join key for a subdistrict name: lower-case letters only, spelling variants unified. */
export function subdistrictKey(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  return ALIASES[key] ?? key;
}

export function summarizeSubdistricts(input: {
  subdistricts: Subdistrict[];
  events: FloodEvent[];
  floodProne: FloodProneSubdistrict[];
  safePoints: SafePoint[];
}): SubdistrictBreakdown {
  const known = new Set(input.subdistricts.map((s) => subdistrictKey(s.name)));
  const eventsByKey = new Map<string, FloodEvent[]>();
  let unmatchedEventCount = 0;
  for (const event of input.events) {
    const key = event.subdistrict ? subdistrictKey(event.subdistrict) : null;
    if (key === null || !known.has(key)) {
      unmatchedEventCount += 1;
      continue;
    }
    eventsByKey.set(key, [...(eventsByKey.get(key) ?? []), event]);
  }
  const proneByKey = new Map(
    input.floodProne.map((p) => [subdistrictKey(p.subdistrict), p]),
  );
  const located = input.safePoints.filter(
    (p): p is SafePoint & { lat: number; lng: number } =>
      p.lat !== null && p.lng !== null,
  );

  const rows: SubdistrictSummary[] = input.subdistricts.map((s) => {
    const key = subdistrictKey(s.name);
    const events = eventsByKey.get(key) ?? [];
    const depths = events.flatMap((e) =>
      e.maxDepthCm === null ? [] : [e.maxDepthCm],
    );
    const prone = proneByKey.get(key);

    let nearestSafePoint: SubdistrictSummary["nearestSafePoint"] = null;
    if (s.lat !== null && s.lng !== null) {
      const origin = { lat: s.lat, lng: s.lng };
      for (const p of located) {
        const km = distanceKm(origin, p);
        if (nearestSafePoint === null || km < nearestSafePoint.km) {
          nearestSafePoint = { name: p.name, km };
        }
      }
    }

    return {
      code: s.code,
      name: s.name,
      eventCount: events.length,
      maxDepthCm: depths.length > 0 ? Math.max(...depths) : null,
      lastEventDate:
        events.length > 0
          ? events.reduce((a, e) => (e.date > a ? e.date : a), events[0].date)
          : null,
      floodProne: prone !== undefined,
      floodProneRwCount: prone?.rwCount ?? null,
      nearestSafePoint,
    };
  });

  rows.sort(
    (a, b) =>
      b.eventCount - a.eventCount ||
      Number(b.floodProne) - Number(a.floodProne) ||
      a.name.localeCompare(b.name, "id"),
  );
  return { rows, unmatchedEventCount };
}
