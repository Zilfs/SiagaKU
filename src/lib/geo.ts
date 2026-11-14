export type LatLng = { lat: number; lng: number };

/** Great-circle distance (haversine) in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Nearest item by centroid, or null when even the nearest is beyond maxKm (outside Jakarta). */
export function findNearestDistrict<T extends LatLng>(
  point: LatLng,
  list: T[],
  maxKm = 15,
): T | null {
  let best: T | null = null;
  let bestKm = maxKm;
  for (const item of list) {
    const km = distanceKm(point, item);
    if (km <= bestKm) {
      best = item;
      bestKm = km;
    }
  }
  return best;
}

/** Indonesian distance label: metres under 1 km, one decimal above. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
