import { getDistrictOutlook } from "@/features/risk/server/risk-service";
import { jsonError } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const r = await getDistrictOutlook(id);
    if (!r.found) {
      return jsonError("NOT_FOUND", "Kecamatan tidak ditemukan.", 404);
    }
    return Response.json({ outlook: r.outlook });
  } catch (e) {
    console.error("GET /api/risk outlook failed", id, e);
    return jsonError("INTERNAL", "Gagal memuat prakiraan hujan.", 500);
  }
}
