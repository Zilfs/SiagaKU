/**
 * Seeds the curated data in `data/*.csv` into Supabase.
 *
 *   npm run db:seed
 *
 * Validates all five CSVs first (nothing is written if one row is bad), then upserts `districts`
 * (with computed base_vulnerability) and replaces flood_events, flood_prone_subdistricts, shelters
 * and emergency_contacts. Re-running is safe.
 */
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildSeed } from "./lib/seed-data";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the ambient environment.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi",
  );
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function must<T extends { error: unknown }>(
  p: PromiseLike<T>,
  what: string,
) {
  const r = await p;
  if (r.error) throw new Error(`${what}: ${JSON.stringify(r.error)}`);
  return r;
}

async function replace(table: string, rows: object[]) {
  // shortcut: delete + insert gives new ids on every run; fine while no table stores shelter or
  // contact ids. Switch to an upsert on a natural key once something references them.
  await must(db.from(table).delete().gte("id", 0), `hapus ${table}`);
  for (let i = 0; i < rows.length; i += 500) {
    await must(db.from(table).insert(rows.slice(i, i + 500)), `isi ${table}`);
  }
  console.log(`${table}: ${rows.length} baris`);
}

async function main() {
  const seed = buildSeed(path.resolve("data"));

  await must(
    db.from("districts").upsert(seed.districts, { onConflict: "id" }),
    "isi districts",
  );
  console.log(`districts: ${seed.districts.length} baris`);
  await replace("flood_events", seed.floodEvents);
  await replace("flood_prone_subdistricts", seed.floodProne);
  await replace("shelters", seed.shelters);
  await replace("emergency_contacts", seed.contacts);

  const { count } = await must(
    db.from("districts").select("id", { count: "exact", head: true }),
    "cek districts",
  );
  console.log(`Selesai. districts di DB: ${count} (harus 44).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
