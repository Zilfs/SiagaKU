import { jsonError } from "@/lib/http";
import { SubdistrictCodeSchema } from "@/features/early-warning/schemas";
import {
  getEarlyWarning,
  type EarlyWarningDeps,
} from "@/features/early-warning/server/run";

/** GET /api/early-warning/[code]: status of one subdistrict for the banner and /peringatan. */
export async function handleEarlyWarning(
  code: string,
  deps: EarlyWarningDeps = {},
): Promise<Response> {
  if (!SubdistrictCodeSchema.safeParse(code).success) {
    return jsonError("INVALID_INPUT", "Kode kelurahan tidak valid.", 400);
  }
  try {
    const body = await getEarlyWarning(code, deps);
    if (!body) {
      return jsonError("NOT_FOUND", "Kelurahan tidak ditemukan.", 404);
    }
    return Response.json(body);
  } catch (error) {
    console.error("GET /api/early-warning failed", code, error);
    return jsonError(
      "UPSTREAM_FAILED",
      "Prakiraan BMKG belum bisa dimuat. Coba lagi nanti.",
      502,
    );
  }
}

export function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
): Promise<Response> {
  return ctx.params.then(({ code }) => handleEarlyWarning(code));
}
