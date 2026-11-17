/**
 * Seeds `subdistricts` (docs/06: kelurahan) for the early warning.
 *
 *   npm run db:seed-subdistricts
 *
 * No subdistrict dataset is needed: for every district it probes the BMKG forecast API with the
 * district's region code plus .1001, .1002, ... and stops after two codes in a row return 404.
 * Name and lat/lng come from the response's `lokasi`. `flood_prone` is set when the name is in
 * `flood_prone_subdistricts`. Paced under BMKG's ~60 requests/minute. Re-running is safe (upsert).
 */
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the ambient environment.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === "local-preview-placeholder") {
  console.warn("Supabase credentials missing or placeholder. Skipping seeding.");
  process.exit(0);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const REQUEST_DELAY_MS = 1_300; // ~46 requests/minute
const MAX_MISSES = 2;
const MAX_PER_DISTRICT = 40;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Kampung Melayu" and "KAMPUNG  MELAYU" match. */
const normalizeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z]/g, "");

type Location = { desa: string; lat: number; lon: number };

/** Returns the location, null for an unknown code (404), and throws on any other failure. */
async function probe(code: string): Promise<Location | null> {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(
      `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${code}`,
      { signal: AbortSignal.timeout(15_000) },
    ).catch((error: unknown) => error as Error);
    if (!(res instanceof Error) && res.status === 404) return null;
    if (!(res instanceof Error) && res.ok) {
      const json = (await res.json()) as { lokasi?: Partial<Location> };
      const l = json.lokasi;
      if (!l?.desa || typeof l.lat !== "number" || typeof l.lon !== "number") {
        throw new Error(`BMKG ${code}: response without lokasi`);
      }
      return { desa: l.desa, lat: l.lat, lon: l.lon };
    }
    const reason = res instanceof Error ? res.message : `HTTP ${res.status}`;
    if (attempt >= 3) throw new Error(`BMKG ${code}: ${reason}`);
    console.warn(`  ${code}: ${reason}, retrying in 30 s`);
    await sleep(30_000);
  }
}

async function main() {
  const { data: districts, error } = await db
    .from("districts")
    .select("id, name, region_code")
    .order("id");
  if (error) throw new Error(error.message);

  const { data: prone, error: proneError } = await db
    .from("flood_prone_subdistricts")
    .select("district_id, subdistrict");
  if (proneError) throw new Error(proneError.message);
  const proneKeys = new Set(
    (prone ?? []).map(
      (p) => `${p.district_id}:${normalizeName(p.subdistrict)}`,
    ),
  );

  const rows: {
    code: string;
    district_id: number;
    name: string;
    lat: number;
    lng: number;
    flood_prone: boolean;
  }[] = [];

  for (const d of districts as {
    id: number;
    name: string;
    region_code: string;
  }[]) {
    let misses = 0;
    let found = 0;
    for (
      let n = 1001;
      n < 1001 + MAX_PER_DISTRICT && misses < MAX_MISSES;
      n += 1
    ) {
      const code = `${d.region_code}.${n}`;
      const location = await probe(code);
      await sleep(REQUEST_DELAY_MS);
      if (!location) {
        misses += 1;
        continue;
      }
      misses = 0;
      found += 1;
      rows.push({
        code,
        district_id: d.id,
        name: location.desa,
        lat: location.lat,
        lng: location.lon,
        flood_prone: proneKeys.has(`${d.id}:${normalizeName(location.desa)}`),
      });
    }
    console.log(`${d.name}: ${found} subdistricts`);
    if (found === 0)
      console.warn(`  warning: nothing found for ${d.region_code}`);
  }

  const { error: upsertError } = await db
    .from("subdistricts")
    .upsert(rows, { onConflict: "code" });
  if (upsertError) throw new Error(upsertError.message);

  const matchedProne = rows.filter((r) => r.flood_prone).length;
  console.log("");
  console.log(`subdistricts: ${rows.length} (docs/06 expects ~267)`);
  console.log(
    `flood prone:  ${matchedProne} of ${proneKeys.size} listed names matched`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
