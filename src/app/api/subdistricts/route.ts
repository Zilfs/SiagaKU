import { jsonError } from "@/lib/http";
import { SubdistrictQuerySchema } from "@/features/early-warning/schemas";
import { searchSubdistricts } from "@/features/early-warning/server/early-warning-repository";

/** GET /api/subdistricts?q=ceg: watch-area autocomplete (max 10). */
export async function handleSubdistricts(
  req: Request,
  search: typeof searchSubdistricts = searchSubdistricts,
): Promise<Response> {
  const q = SubdistrictQuerySchema.safeParse(
    new URL(req.url).searchParams.get("q") ?? "",
  );
  if (!q.success) {
    return jsonError("INVALID_INPUT", "Ketik minimal 2 huruf.", 400);
  }
  try {
    const rows = await search(q.data);
    return Response.json(
      rows.map((s) => ({
        code: s.code,
        name: s.name,
        district: s.district.name,
        districtSlug: s.district.slug,
        city: s.district.city,
      })),
    );
  } catch (error) {
    console.error("GET /api/subdistricts failed", error);
    return jsonError("INTERNAL", "Gagal mencari kelurahan.", 500);
  }
}

export function GET(req: Request): Promise<Response> {
  return handleSubdistricts(req);
}
