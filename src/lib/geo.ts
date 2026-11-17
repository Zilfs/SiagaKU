import type { DistrictBoundary } from "./district-boundaries";

export type LatLng = { lat: number; lng: number };

/** A district that can be matched to a GPS point. */
export type DistrictCandidate = LatLng & { slug: string };

/** Lazy loader for the boundary table; injected by tests to simulate a failed chunk. */
export type BoundaryLoader = () => Promise<{
  DISTRICT_BOUNDARIES: import("./district-boundaries").DistrictBoundary[];
}>;

/** ~110 m: precise enough for a flood map, too coarse to point at a front door. */
export function roundPoint(value: number): number {
  return Math.round(value * 1000) / 1000;
}

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

const insideBbox = (
  point: LatLng,
  bbox: [number, number, number, number],
): boolean =>
  point.lng >= bbox[0] &&
  point.lat >= bbox[1] &&
  point.lng <= bbox[2] &&
  point.lat <= bbox[3];

/** Ray casting on a flat [lng, lat, ...] ring. */
function insideRing(lng: number, lat: number, ring: number[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i];
    const yi = ring[i + 1];
    const xj = ring[j];
    const yj = ring[j + 1];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** Outer ring containment minus holes. */
function insidePolygon(lng: number, lat: number, rings: number[][]): boolean {
  if (rings.length === 0 || !insideRing(lng, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i += 1) {
    if (insideRing(lng, lat, rings[i])) return false;
  }
  return true;
}

/**
 * The district whose boundary contains the point, else the nearest centroid within `maxKm`.
 * Centroid matching alone put Cibubur (Ciracas) in Cipayung: the district's southern arm is
 * closer to Cipayung's centre than to Ciracas's. Boundaries are OpenStreetMap kecamatan
 * polygons (see district-boundaries.ts) and load on first use, so pages that never geolocate
 * pay nothing. A failed chunk load falls back to the centroid instead of leaving the UI stuck.
 */
export async function findDistrictByPoint<T extends DistrictCandidate>(
  point: LatLng,
  list: T[],
  maxKm = 15,
  loadBoundaries: BoundaryLoader = () => import("./district-boundaries"),
): Promise<T | null> {
  let boundaries: DistrictBoundary[];
  try {
    ({ DISTRICT_BOUNDARIES: boundaries } = await loadBoundaries());
  } catch (error) {
    console.error("district boundaries failed to load", error);
    return findNearestDistrict(point, list, maxKm);
  }
  const bySlug = new Map(list.map((district) => [district.slug, district]));
  for (const boundary of boundaries) {
    const district = bySlug.get(boundary.slug);
    if (!district || !insideBbox(point, boundary.bbox)) continue;
    if (
      boundary.polygons.some((rings) =>
        insidePolygon(point.lng, point.lat, rings),
      )
    ) {
      return district;
    }
  }
  return findNearestDistrict(point, list, maxKm);
}
