/** Recorded flood events per district id, with the period the records cover. */
export type FloodFrequency = {
  counts: Record<number, number>;
  firstDate: string | null;
  lastDate: string | null;
};

/** The map's darkest shade; 0 is "no recorded events". */
export const MAX_FLOOD_SHADE = 4;

/** 0 for no events, else 1..4 by the district's share of the busiest district's count. */
export function floodShade(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(MAX_FLOOD_SHADE, Math.ceil((count / max) * MAX_FLOOD_SHADE));
}

export function countFloodEvents(
  events: { districtId: number; date: string }[],
): FloodFrequency {
  const counts: Record<number, number> = {};
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  for (const { districtId, date } of events) {
    counts[districtId] = (counts[districtId] ?? 0) + 1;
    if (!firstDate || date < firstDate) firstDate = date;
    if (!lastDate || date > lastDate) lastDate = date;
  }
  return { counts, firstDate, lastDate };
}
