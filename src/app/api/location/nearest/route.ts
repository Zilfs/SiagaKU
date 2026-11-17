import { jsonError } from "@/lib/http";
import { findNearestDistrictByCoords } from "@/features/risk/server/risk-repository";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const latStr = url.searchParams.get("lat");
  const lngStr = url.searchParams.get("lng");

  const lat = latStr ? parseFloat(latStr) : NaN;
  const lng = lngStr ? parseFloat(lngStr) : NaN;

  if (isNaN(lat) || isNaN(lng)) {
    return jsonError("INVALID_INPUT", "Parameter lat dan lng harus berupa angka.", 400);
  }

  try {
    const result = await findNearestDistrictByCoords(lat, lng);
    if (!result) {
      return jsonError("NOT_FOUND", "SiagaKU saat ini hanya untuk DKI Jakarta.", 404);
    }
    return Response.json({ slug: result.slug });
  } catch (error) {
    console.error("GET /api/location/nearest failed", error);
    return jsonError("INTERNAL", "Gagal mencari lokasi terdekat.", 500);
  }
}
