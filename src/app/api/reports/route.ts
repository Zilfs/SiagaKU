import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import { getClientIp, hashIp } from "@/lib/rate-limit";
import { findDistrictByPoint } from "@/lib/geo";
import { listDistricts } from "@/features/risk/server/risk-repository";
import type { District } from "@/features/risk/types";
import {
  CreateReportSchema,
  ReportsQuerySchema,
  isPublicReport,
  type CreateReportInput,
  type VisionResult,
} from "@/features/report/schemas";
import { toPublicReport } from "@/features/report/public-report";
import {
  downloadPhoto,
  finishReport,
  insertReport,
  listRecentReports,
  signPhotoUrls,
  type ReportRow,
} from "@/features/report/server/report-repository";
import { analyzePhoto, type VisionAnalysis } from "@/features/report/server/vision";

const MEDIA_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** ~110 m: precise enough for a flood map, too coarse to point at a front door. */
export function roundPoint(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export type ReportHandlerDeps = {
  districts?: () => Promise<District[]>;
  matchDistrict?: (
    point: { lat: number; lng: number },
    list: District[],
  ) => Promise<District | null>;
  downloadPhoto?: (path: string) => Promise<Uint8Array>;
  analyze?: (bytes: Uint8Array, mediaType: string) => Promise<VisionAnalysis>;
  insert?: typeof insertReport;
  finish?: typeof finishReport;
  listRecent?: typeof listRecentReports;
  signPhotos?: typeof signPhotoUrls;
};

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

  const lat = roundPoint(body.lat);
  const lng = roundPoint(body.lng);

  const match = deps.matchDistrict ?? findDistrictByPoint;
  const insert = deps.insert ?? insertReport;
  const finish = deps.finish ?? finishReport;
  const analyze = deps.analyze ?? analyzePhoto;
  const download = deps.downloadPhoto ?? downloadPhoto;

  let districtId: number | null = null;
  let districts: District[] | null = null;
  try {
    districts = await (deps.districts ?? listDistricts)();
  } catch (error) {
    // A DB hiccup must not block a report; it is stored without a district.
    console.error("GET districts for a report failed", error);
  }
  if (districts) {
    try {
      const district = await match({ lat, lng }, districts);
      if (!district) {
        return jsonError(
          "INVALID_INPUT",
          "SiagaKU saat ini hanya untuk DKI Jakarta.",
          400,
        );
      }
      districtId = district.id;
    } catch (error) {
      console.error("report district match failed", error);
    }
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
      lat,
      lng,
      photoPath: body.path,
      description: body.description ?? "",
      ipHash: hashIp(getClientIp(req), env.IP_SALT),
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return jsonError("INVALID_INPUT", "Foto ini sudah pernah dilaporkan.", 409);
    }
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
  const signPhotos = deps.signPhotos ?? signPhotoUrls;

  try {
    const rows: ReportRow[] = await listRecent(parsed.data.hours);
    const visible = rows.filter(
      (row) => row.is_demo || isPublicReport(row.ai_result),
    );
    const urls = await signPhotos(visible.map((row) => row.photo_path));
    const data = visible.map((row) =>
      toPublicReport(row, urls.get(row.photo_path) ?? ""),
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
