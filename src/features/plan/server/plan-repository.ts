import "server-only";
import { supabaseServer } from "@/lib/db/client";
import type { ProviderName } from "@/lib/ai/router";
import {
  PlanRequestSchema,
  PreparednessPlanSchema,
  type EmergencyContact,
  type PlanRequest,
  type PreparednessPlan,
  type StoredPlan,
} from "../schemas";

export type NewPlan = {
  slug: string;
  districtId: number;
  profile: PlanRequest;
  plan: PreparednessPlan;
  provider: ProviderName | "template";
  model: string | null;
};

type PlanRow = {
  slug: string;
  created_at: string;
  district_id: number;
  profile: unknown;
  plan: unknown;
  provider: string;
  model: string;
  districts:
    | { id: number; slug: string; name: string; city: string }
    | { id: number; slug: string; name: string; city: string }[]
    | null;
};

export async function insertPlan(plan: NewPlan): Promise<void> {
  const { error } = await supabaseServer()
    .from("preparedness_plans")
    .insert({
      slug: plan.slug,
      district_id: plan.districtId,
      profile: plan.profile,
      plan: plan.plan,
      provider: plan.provider,
      // The column is NOT NULL, so the template plan stores "template".
      model: plan.model ?? "template",
    });
  if (error) throw error;
}

export async function findPlanBySlug(slug: string): Promise<StoredPlan | null> {
  const { data, error } = await supabaseServer()
    .from("preparedness_plans")
    .select(
      "slug, created_at, district_id, profile, plan, provider, model, districts(id, slug, name, city)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as PlanRow;
  const district = Array.isArray(row.districts)
    ? row.districts[0]
    : row.districts;
  if (!district) return null;

  return {
    slug: row.slug,
    createdAt: row.created_at,
    districtId: row.district_id,
    district,
    profile: PlanRequestSchema.parse(row.profile),
    plan: PreparednessPlanSchema.parse(row.plan),
    provider: row.provider,
    model: row.model,
  };
}

export async function listEmergencyContacts(): Promise<EmergencyContact[]> {
  const { data, error } = await supabaseServer()
    .from("emergency_contacts")
    .select("name, phone, scope")
    .order("sort_order")
    .order("id");
  if (error) throw error;
  return (data ?? []) as EmergencyContact[];
}
