import { getExplanation } from "@/features/risk/server/explanation";
import { getRiskDetail } from "@/features/risk/server/risk-service";
import { env } from "@/lib/env";
import { jsonError } from "@/lib/http";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  hashIp,
} from "@/lib/rate-limit";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { limit, windowSec } = RATE_LIMITS.explanation;
  const rl = await checkRateLimit(
    hashIp(getClientIp(req), env.IP_SALT),
    "explanation",
    limit,
    windowSec,
  );
  if (!rl.ok) {
    const res = jsonError(
      "RATE_LIMITED",
      "Terlalu banyak permintaan, coba lagi beberapa menit lagi.",
      429,
    );
    res.headers.set("Retry-After", String(rl.retryAfterSec));
    return res;
  }

  try {
    const detail = await getRiskDetail(id);
    if (!detail) {
      return jsonError("NOT_FOUND", "Kecamatan tidak ditemukan.", 404);
    }
    return Response.json(await getExplanation(detail));
  } catch (e) {
    console.error("GET /api/risk/explanation failed", id, e);
    return jsonError("INTERNAL", "Gagal memuat penjelasan risiko.", 500);
  }
}
