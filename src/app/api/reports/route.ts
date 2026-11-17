import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import {
  checkRateLimit,
  getClientIp,
  hashIp,
  limitRequest,
} from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/db/client";
import { findDistrictByPoint } from "@/lib/geo";
import { listDistricts } from "@/features/risk/server/risk-repository";
import type { District } from "@/features/risk/types";
import {
  CreateReportSchema,
  ReportsQuerySchema,
  isPublicReport,
  parseVisionResult,
  type CreateReportInput,
  type VisionResult,
} from "@/features/report/schemas";
import {
  finishReport,
  insertReport,
  listRecentReports,
  signPhotoUrl,
  type PublicReport,
  type ReportRow,
} from "@/features/report/server/report-repository";
import { analyzePhoto, type VisionAnalysis } from "@/features/report/server/vision";

const MEDIA_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Row -> API item. A report without a confident flood verdict never reaches this function. */
export function toPublicReport(row: ReportRow, photoUrl: string): PublicReport {
  const result = parseVisionResult(row.ai_result);
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    foto_url: photoUrl,
    keparahan: Math.min(4, Math.max(0, Math.round(result?.keparahan ?? 0))),
    ringkasan: result?.ringkasan ?? "",
    is_demo: row.is_demo,
    created_at: row.created_at,
  };
}

export type ReportHandlerDeps = {
  rateLimit?: typeof checkRateLimit;
  districts?: () => Promise<District[]>;
  matchDistrict?: (point: { lat: number; lng: number }, list: District[]) => Promise<District | null>;
  downloadPhoto?: (path: string) => Promise<Uint8Array>;
  analyze?: (bytes: Uint8Array, mediaType: string) => Promise<VisionAnalysis>;
  insert?: typeof insertReport;
  finish?: typeof finishReport;
  listRecent?: typeof listRecentReports;
  signPhoto?: typeof signPhotoUrl;
  now?: () => Date;
};

async function downloadPhoto(path: string): Promise<Uint8Array> {
  const { data, error } = await supabaseServer()
    .storage.from("laporan")
    .download(path);
  if (error || !data) throw new Error("photo not found");
  return new Uint8Array(await data.arrayBuffer());
}

/** POST /api/reports: keep the row first (status menunggu), then ask the vision model. */
export async function handleCreateReport(
  req: Request,
  deps: ReportHandlerDeps = {},
): Promise<Response> {
  let body: CreateReportInput;
  try {
    body = await parseJson(req, CreateReportSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }

  const limited = await limitRequest(
    req,
    "report",
    env.IP_SALT,
    deps.rateLimit ?? checkRateLimit,
  );
  if (limited) return limited;

  const match = deps.matchDistrict ?? findDistrictByPoint;
  const insert = deps.insert ?? insertReport;
  const finish = deps.finish ?? finishReport;
  const analyze = deps.analyze ?? analyzePhoto;
  const download = deps.downloadPhoto ?? downloadPhoto;

  let districtId: number | null = null;
  try {
    const districts = await (deps.districts ?? listDistricts)();
    const district = await match({ lat: body.lat, lng: body.lng }, districts);
    districtId = district?.id ?? null;
  } catch (error) {
    console.error("GET districts for a report failed", error);
  }

  let bytes: Uint8Array;
  try {
    bytes = await download(body.path);
  } catch {
    return jsonError(
      "INVALID_INPUT",
      "Foto tidak ditemukan. Unggah ulang fotonya.",
      400,
    );
  }

  let id: string;
  try {
    id = await insert({
      districtId,
      lat: body.lat,
      lng: body.lng,
      photoPath: body.path,
      description: body.description ?? "",
      ipHash: hashIp(getClientIp(req), env.IP_SALT),
    });
  } catch (error) {
    console.error("POST /api/reports insert failed", error);
    return jsonError("INTERNAL", "Laporan gagal disimpan. Coba lagi.", 500);
  }

  const mediaType = MEDIA_TYPE[body.path.split(".").pop() ?? "jpg"] ?? "image/jpeg";
  let verdict: VisionResult | null = null;
  let status = "menunggu";
  try {
    const analysis = await analyze(bytes, mediaType);
    verdict = analysis.result;
    status = isPublicReport(verdict) ? "selesai" : "ditolak";
    await finish(id, status as "selesai" | "ditolak", verdict, analysis.provider);
  } catch (error) {
    // The photo is already stored; the row stays 'menunggu' instead of failing the upload.
    console.error("report vision failed", id, error);
  }

  return Response.json(
    { id, ai_status: status, ai_hasil: verdict },
    { status: 201 },
  );
}

/** GET /api/reports?hours=72: done reports the model called a flood, plus the demo rows. */
export async function handleListReports(
  req: Request,
  deps: ReportHandlerDeps = {},
): Promise<Response> {
  const url = new URL(req.url);
  const parsed = ReportsQuerySchema.safeParse({
    hours: url.searchParams.get("hours") ?? undefined,
  });
  if (!parsed.success) {
    return jsonError("INVALID_INPUT", "Rentang waktu tidak valid.", 400);
  }

  const listRecent = deps.listRecent ?? listRecentReports;
  const sign = deps.signPhoto ?? signPhotoUrl;

  try {
    const rows = await listRecent(parsed.data.hours);
    const visible = rows.filter(
      (row) => row.is_demo || isPublicReport(row.ai_result),
    );
    const data = await Promise.all(
      visible.map(async (row) => toPublicReport(row, await sign(row.photo_path))),
    );
    return Response.json({ data });
  } catch (error) {
    console.error("GET /api/reports failed", error);
    return jsonError("INTERNAL", "Laporan warga belum bisa dimuat.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handleCreateReport(req);
}

export function GET(req: Request): Promise<Response> {
  return handleListReports(req);
}
