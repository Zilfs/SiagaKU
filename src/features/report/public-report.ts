import { parseVisionResult } from "./schemas";
import type { PublicReport, ReportRow } from "./server/report-repository";

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
