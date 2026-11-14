import { readFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { calculateBaseVulnerability } from "../../src/lib/risk/vulnerability";
import {
  DistrictRow,
  EmergencyContactRow,
  FloodEventRow,
  FloodProneRow,
  ShelterRow,
  parseCsv,
  validateRows,
} from "./csv";

function read<T>(dir: string, file: string, schema: z.ZodType<T>): T[] {
  const text = readFileSync(path.join(dir, file), "utf8");
  return validateRows(file, parseCsv(text), schema);
}

/**
 * Reads and validates the five CSVs in `data/`, maps district slugs to ids and computes
 * base_vulnerability. Pure apart from reading files, so it is tested against the real data.
 */
export function buildSeed(dataDir: string, now = new Date()) {
  const districts = read(dataDir, "districts.csv", DistrictRow);
  const events = read(dataDir, "flood_events.csv", FloodEventRow);
  const prone = read(dataDir, "flood_prone_subdistricts.csv", FloodProneRow);
  const shelters = read(dataDir, "shelters.csv", ShelterRow);
  const contacts = read(dataDir, "emergency_contacts.csv", EmergencyContactRow);

  const idBySlug = new Map(districts.map((d) => [d.slug, d.id]));
  const unknown = new Set<string>();
  const toId = (slug: string) => {
    const id = idBySlug.get(slug);
    if (id === undefined) unknown.add(slug);
    return id ?? 0;
  };

  const floodEvents = events.map(({ district_slug, ...e }) => ({
    district_id: toId(district_slug),
    ...e,
  }));
  const floodProne = prone.map(({ district_slug, ...p }) => ({
    district_id: toId(district_slug),
    ...p,
  }));
  const shelterRows = shelters.map(({ district_slug, ...s }) => ({
    district_id: toId(district_slug),
    ...s,
  }));
  if (unknown.size > 0) {
    throw new Error(`Slug kecamatan tidak dikenal: ${[...unknown].join(", ")}`);
  }

  const since = new Date(now);
  since.setFullYear(since.getFullYear() - 5);
  const sinceIso = since.toISOString().slice(0, 10);

  const districtRows = districts.map((d) => {
    // One flood day = one event, even when several subdistricts flooded that day.
    const days = new Set(
      floodEvents
        .filter((e) => e.district_id === d.id && e.event_date >= sinceIso)
        .map((e) => e.event_date),
    );
    const proneCount = floodProne.filter((p) => p.district_id === d.id).length;
    return {
      ...d,
      base_vulnerability: calculateBaseVulnerability({
        floodEvents5y: days.size,
        floodProneSubdistricts: proneCount,
        // shortcut: flat +30 when any subdistrict is flood-prone (docs/06 allows it), because the
        // subdistrict count per district only arrives with the subdistricts table in Task 14.
        totalSubdistricts: Math.max(proneCount, 1),
        tidalFloodProne: d.tidal_flood_prone,
      }),
    };
  });

  return {
    districts: districtRows,
    floodEvents,
    floodProne,
    shelters: shelterRows,
    contacts,
  };
}
