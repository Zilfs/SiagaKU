import { getRiskDetail } from "@/features/risk/server/risk-service";
import { jsonError } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const detail = await getRiskDetail(id);
    if (!detail) {
      return jsonError("NOT_FOUND", "Kecamatan tidak ditemukan.", 404);
    }
    return Response.json(detail);
  } catch (e) {
    console.error("GET /api/risk failed", id, e);
    return jsonError("INTERNAL", "Gagal memuat data risiko.", 500);
  }
}
