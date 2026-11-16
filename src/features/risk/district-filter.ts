import type { DistrictSummary } from "./types";

/** Districts whose name or city contains the query (case-insensitive); an empty query keeps all. */
export function filterDistricts(
  districts: DistrictSummary[],
  query: string,
): DistrictSummary[] {
  const term = query.trim().toLowerCase();
  if (!term) return districts;
  return districts.filter(
    (district) =>
      district.name.toLowerCase().includes(term) ||
      district.city.toLowerCase().includes(term),
  );
}
