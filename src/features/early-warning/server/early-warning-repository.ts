import "server-only";
import { supabaseServer } from "@/lib/db/client";
import type { AlertStatus, Evaluation } from "../evaluate";
import type { PushSubscriptionRow, StoredStatus, Subdistrict } from "../types";

const SUBDISTRICT_COLUMNS =
  "code, name, flood_prone, districts(id, slug, name, city, base_vulnerability)";

type DistrictJoin = {
  id: number;
  slug: string;
  name: string;
  city: string;
  base_vulnerability: number;
};

type SubdistrictRow = {
  code: string;
  name: string;
  flood_prone: boolean;
  districts: DistrictJoin | DistrictJoin[] | null;
};

function toSubdistrict(row: SubdistrictRow): Subdistrict | null {
  const d = Array.isArray(row.districts) ? row.districts[0] : row.districts;
  if (!d) return null;
  return {
    code: row.code,
    name: row.name,
    floodProne: row.flood_prone,
    district: {
      id: d.id,
      slug: d.slug,
      name: d.name,
      city: d.city,
      baseVulnerability: d.base_vulnerability,
    },
  };
}

const toSubdistricts = (rows: unknown) =>
  ((rows ?? []) as SubdistrictRow[])
    .map(toSubdistrict)
    .filter((s): s is Subdistrict => s !== null);

/** Name search for the watch-area autocomplete (max 10). `q` is validated by the route. */
export async function searchSubdistricts(q: string): Promise<Subdistrict[]> {
  const { data, error } = await supabaseServer()
    .from("subdistricts")
    .select(SUBDISTRICT_COLUMNS)
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(10);
  if (error) throw error;
  return toSubdistricts(data);
}

export async function findSubdistrict(
  code: string,
): Promise<Subdistrict | null> {
  const { data, error } = await supabaseServer()
    .from("subdistricts")
    .select(SUBDISTRICT_COLUMNS)
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data ? toSubdistrict(data as SubdistrictRow) : null;
}

export async function findSubdistricts(
  codes: string[],
): Promise<Subdistrict[]> {
  if (codes.length === 0) return [];
  const { data, error } = await supabaseServer()
    .from("subdistricts")
    .select(SUBDISTRICT_COLUMNS)
    .in("code", codes);
  if (error) throw error;
  return toSubdistricts(data);
}

/** Codes of the most vulnerable subdistricts, so the banner has data before anyone subscribes. */
export async function listMostVulnerableCodes(
  limit: number,
): Promise<string[]> {
  const { data, error } = await supabaseServer()
    .from("subdistricts")
    .select("code, flood_prone, districts!inner(base_vulnerability)");
  if (error) throw error;
  // ~270 rows; PostgREST cannot sort parent rows by an embedded column, so sort here.
  type Row = {
    code: string;
    flood_prone: boolean;
    districts:
      { base_vulnerability: number } | { base_vulnerability: number }[];
  };
  const score = (r: Row) => {
    const d = Array.isArray(r.districts) ? r.districts[0] : r.districts;
    return (d?.base_vulnerability ?? 0) + (r.flood_prone ? 15 : 0);
  };
  return ((data ?? []) as Row[])
    .sort((a, b) => score(b) - score(a) || a.code.localeCompare(b.code))
    .slice(0, limit)
    .map((r) => r.code);
}

type StatusRow = {
  status: AlertStatus;
  score: number;
  rainfall_24h_mm: number | string;
  rainfall_category: Evaluation["rainfallCategory"];
  window_start: string | null;
  window_end: string | null;
  evaluated_at: string;
};

export async function getStatus(code: string): Promise<StoredStatus | null> {
  const { data, error } = await supabaseServer()
    .from("early_warning_status")
    .select(
      "status, score, rainfall_24h_mm, rainfall_category, window_start, window_end, evaluated_at",
    )
    .eq("subdistrict_code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as StatusRow;
  return {
    status: row.status,
    score: row.score,
    rainfall24hMm: Number(row.rainfall_24h_mm),
    rainfallCategory: row.rainfall_category,
    window:
      row.window_start && row.window_end
        ? {
            start: new Date(row.window_start).toISOString(),
            end: new Date(row.window_end).toISOString(),
          }
        : null,
    evaluatedAt: new Date(row.evaluated_at).toISOString(),
  };
}

export async function upsertStatus(
  code: string,
  e: Evaluation,
  evaluatedAt: Date,
): Promise<void> {
  const { error } = await supabaseServer()
    .from("early_warning_status")
    .upsert({
      subdistrict_code: code,
      status: e.status,
      score: e.score,
      rainfall_24h_mm: e.rainfall24hMm,
      rainfall_category: e.rainfallCategory,
      window_start: e.window?.start ?? null,
      window_end: e.window?.end ?? null,
      evaluated_at: evaluatedAt.toISOString(),
    });
  if (error) throw error;
}

type SubscriptionDbRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  subdistrict_code: string;
  last_sent_at: string | null;
  last_status: AlertStatus | null;
};

const toSubscription = (r: SubscriptionDbRow): PushSubscriptionRow => ({
  endpoint: r.endpoint,
  p256dh: r.p256dh,
  auth: r.auth,
  subdistrictCode: r.subdistrict_code,
  lastSentAt: r.last_sent_at,
  lastStatus: r.last_status,
});

const SUBSCRIPTION_COLUMNS =
  "endpoint, p256dh, auth, subdistrict_code, last_sent_at, last_status";

/** Upsert by endpoint: subscribing again moves the browser to the new subdistrict. */
export async function saveSubscription(s: {
  endpoint: string;
  p256dh: string;
  auth: string;
  subdistrictCode: string;
}): Promise<void> {
  const { error } = await supabaseServer().from("push_subscriptions").upsert(
    {
      endpoint: s.endpoint,
      p256dh: s.p256dh,
      auth: s.auth,
      subdistrict_code: s.subdistrictCode,
      last_sent_at: null,
      last_status: null,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await supabaseServer()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}

export async function findSubscription(
  endpoint: string,
): Promise<PushSubscriptionRow | null> {
  const { data, error } = await supabaseServer()
    .from("push_subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (error) throw error;
  return data ? toSubscription(data as SubscriptionDbRow) : null;
}

export async function listSubscriptions(): Promise<PushSubscriptionRow[]> {
  const { data, error } = await supabaseServer()
    .from("push_subscriptions")
    .select(SUBSCRIPTION_COLUMNS);
  if (error) throw error;
  return ((data ?? []) as SubscriptionDbRow[]).map(toSubscription);
}

export async function markSent(
  endpoint: string,
  status: AlertStatus,
  at: Date,
): Promise<void> {
  const { error } = await supabaseServer()
    .from("push_subscriptions")
    .update({ last_sent_at: at.toISOString(), last_status: status })
    .eq("endpoint", endpoint);
  if (error) throw error;
}
