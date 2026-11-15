import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PlanView } from "@/features/plan/components/plan-view";
import {
  findPlanBySlug,
  listEmergencyContacts,
} from "@/features/plan/server/plan-repository";
import type { PlanResponse } from "@/features/plan/ui-types";
import { listShelters } from "@/features/risk/server/risk-repository";

export const metadata: Metadata = {
  title: "Rencana siaga keluarga · SiagaKU",
  description:
    "Rencana siaga banjir keluarga: ringkasan, daftar perlengkapan, langkah sebelum-saat-setelah, titik aman, dan kontak darurat.",
};

export const instant = false;

export default async function PlanDetailPage({
  params,
}: PageProps<"/rencana/[slug]">) {
  const { slug } = await params;
  await connection();

  // same composition as handlePlanDetail: call the feature services, not our own route handler
  let plan: PlanResponse | null = null;
  try {
    const stored = await findPlanBySlug(slug);
    if (stored) {
      const [safePoints, emergencyContacts] = await Promise.all([
        listShelters(stored.districtId),
        listEmergencyContacts(),
      ]);
      plan = {
        slug: stored.slug,
        createdAt: stored.createdAt,
        district: stored.district,
        profile: stored.profile,
        plan: stored.plan,
        safePoints,
        emergencyContacts,
      };
    }
  } catch (error) {
    console.error("GET plan detail failed", slug, error);
  }

  if (!plan) notFound();

  return <PlanView plan={plan} />;
}
