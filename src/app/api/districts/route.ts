import { connection } from "next/server";
import { listDistrictsWithScore } from "@/features/risk/server/risk-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  await connection(); // never prerender at build: data is live and needs env
  try {
    const data = await listDistrictsWithScore();
    return Response.json(
      { data, updatedAt: new Date().toISOString() },
      // 15 min at the CDN, matching docs/07 "revalidate 15 menit"
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    console.error("GET /api/districts failed", e);
    return jsonError("INTERNAL", "Gagal memuat data kecamatan.", 500);
  }
}
