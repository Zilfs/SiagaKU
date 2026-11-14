import { jsonError } from "@/lib/http";
import { listShelters } from "@/features/risk/server/risk-repository";
import type { SafePoint } from "@/features/risk/types";
import {
  findPlanBySlug,
  listEmergencyContacts,
} from "@/features/plan/server/plan-repository";

export type PlanDetailDeps = {
  find?: typeof findPlanBySlug;
  listSafePoints?: (districtId: number) => Promise<SafePoint[]>;
  listContacts?: typeof listEmergencyContacts;
};

export async function handlePlanDetail(
  slug: string,
  deps: PlanDetailDeps = {},
): Promise<Response> {
  const find = deps.find ?? findPlanBySlug;
  const listSafePoints = deps.listSafePoints ?? listShelters;
  const listContacts = deps.listContacts ?? listEmergencyContacts;

  try {
    const stored = await find(slug);
    if (!stored) {
      return jsonError("NOT_FOUND", "Rencana tidak ditemukan.", 404);
    }

    const [safePoints, emergencyContacts] = await Promise.all([
      listSafePoints(stored.districtId),
      listContacts(),
    ]);

    return Response.json({
      slug: stored.slug,
      createdAt: stored.createdAt,
      district: stored.district,
      profile: stored.profile,
      plan: stored.plan,
      safePoints,
      emergencyContacts,
    });
  } catch (error) {
    console.error("GET /api/plans/[slug] failed", slug, error);
    return jsonError("INTERNAL", "Gagal memuat rencana siaga.", 500);
  }
}

export function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  return ctx.params.then(({ slug }) => handlePlanDetail(slug));
}
