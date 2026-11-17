import "server-only";
import { supabaseServer } from "@/lib/db/client";
import type { VisionResult } from "../schemas";

export type NewReport = {
  districtId: number | null;
  lat: number;
  lng: number;
  photoPath: string;
  description: string;
  ipHash: string;
};

export type ReportRow = {
  id: string;
  lat: number;
  lng: number;
  photo_path: string;
  ai_status: string;
  ai_result: VisionResult | null;
  is_demo: boolean;
  created_at: string;
};

export type PublicReport = {
  id: string;
  lat: number;
  lng: number;
  foto_url: string;
  keparahan: number;
  ringkasan: string;
  is_demo: boolean;
  created_at: string;
};

export async function insertReport(row: NewReport): Promise<string> {
  const { data, error } = await supabaseServer()
    .from("reports")
    .insert({
      district_id: row.districtId,
      lat: row.lat,
      lng: row.lng,
      photo_path: row.photoPath,
      description: row.description || null,
      ip_hash: row.ipHash,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function finishReport(
  id: string,
  status: "selesai" | "ditolak",
  result: VisionResult,
  provider: string,
): Promise<void> {
  const { error } = await supabaseServer()
    .from("reports")
    .update({ ai_status: status, ai_result: result, ai_provider: provider })
    .eq("id", id);
  if (error) throw error;
}

/** Rows from the last N hours that are either done or demo; the AI rule filters in JS. */
export async function listRecentReports(hours: number): Promise<ReportRow[]> {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data, error } = await supabaseServer()
    .from("reports")
    .select(
      "id, lat, lng, photo_path, ai_status, ai_result, is_demo, created_at",
    )
    .gte("created_at", since)
    .or("is_demo.eq.true,ai_status.in.(selesai,ditolak)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function signPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabaseServer()
    .storage.from("laporan")
    .createSignedUrl(path, 3600);
  if (error || !data) return "";
  return data.signedUrl;
}
