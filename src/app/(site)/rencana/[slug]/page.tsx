import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PlanView } from "@/features/plan/components/plan-view";
import type { PlanResponse } from "@/features/plan/ui-types";

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

  let plan: PlanResponse | null = null;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (host) {
    const proto =
      requestHeaders.get("x-forwarded-proto") ??
      (host.includes("localhost") ? "http" : "https");
    try {
      const response = await fetch(`${proto}://${host}/api/plans/${slug}`, {
        cache: "no-store",
      });
      if (response.ok) plan = (await response.json()) as PlanResponse;
    } catch (error) {
      console.error("GET plan detail failed", slug, error);
    }
  }

  if (!plan) notFound();

  return <PlanView plan={plan} />;
}
