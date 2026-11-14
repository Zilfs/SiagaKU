import "server-only";
import { supabaseServer } from "@/lib/db/client";
import type { District, FloodEvent, SafePoint } from "../types";

const DISTRICT_COLUMNS =
  "id, slug, name, city, lat, lng, tidal_flood_prone, base_vulnerability, bmkg_adm4";

type DistrictRow = {
  id: number;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  tidal_flood_prone: boolean;
  base_vulnerability: number;
  bmkg_adm4: string;
};

const toDistrict = (r: DistrictRow): District => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  city: r.city,
  lat: r.lat,
  lng: r.lng,
  tidalFloodProne: r.tidal_flood_prone,
  baseVulnerability: r.base_vulnerability,
  bmkgAdm4: r.bmkg_adm4,
});

export async function listDistricts(): Promise<District[]> {
  const { data, error } = await supabaseServer()
    .from("districts")
    .select(DISTRICT_COLUMNS)
    .order("id");
  if (error) throw error;
  return (data as DistrictRow[]).map(toDistrict);
}

export async function findDistrict(
  idOrSlug: number | string,
): Promise<District | null> {
  const { data, error } = await supabaseServer()
    .from("districts")
    .select(DISTRICT_COLUMNS)
    .eq(typeof idOrSlug === "number" ? "id" : "slug", idOrSlug)
    .maybeSingle();
  if (error) throw error;
  return data ? toDistrict(data as DistrictRow) : null;
}

export async function listFloodEvents(
  districtId: number,
  limit = 10,
): Promise<FloodEvent[]> {
  const { data, error } = await supabaseServer()
    .from("flood_events")
    .select("event_date, subdistrict, max_depth_cm, source_url")
    .eq("district_id", districtId)
    .order("event_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    date: r.event_date,
    subdistrict: r.subdistrict,
    maxDepthCm: r.max_depth_cm,
    sourceUrl: r.source_url,
  }));
}

export async function listShelters(districtId: number): Promise<SafePoint[]> {
  const { data, error } = await supabaseServer()
    .from("shelters")
    .select("id, name, type, is_verified, lat, lng")
    .eq("district_id", districtId)
    .order("is_verified", { ascending: false })
    .order("id");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    isVerified: r.is_verified,
    lat: r.lat,
    lng: r.lng,
  }));
}
