/** Safe point fields the plan needs; mapped from the risk detail by the route. */
export type PlanSafePoint = {
  id: number;
  name: string;
  type: string;
  isVerified: boolean;
};

export type SafePointOption = Pick<PlanSafePoint, "id">;

/**
 * Keeps only ids the district actually offers, drops duplicates and caps the
 * list at three. An empty result falls back to the first two available points
 * (docs/05 Desain AI §2.2).
 */
export function selectSafePointIds(
  requested: number[],
  available: SafePointOption[],
): number[] {
  const valid = new Set(available.map((point) => point.id));
  const kept = [...new Set(requested)].filter((id) => valid.has(id));
  if (kept.length > 0) return kept.slice(0, 3);
  return available.slice(0, 2).map((point) => point.id);
}

/** The six points offered to the model: verified shelters first (docs/13 T11). */
export function promptSafePoints(points: PlanSafePoint[]): PlanSafePoint[] {
  return [...points]
    .sort((a, b) => Number(b.isVerified) - Number(a.isVerified))
    .slice(0, 6);
}
