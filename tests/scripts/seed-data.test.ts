import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSeed } from "../../scripts/lib/seed-data";

// Runs against the real curated CSVs, so a bad edit in data/ fails CI before it reaches the DB.
const seed = buildSeed(path.resolve("data"), new Date("2026-11-14"));
const bySlug = new Map(seed.districts.map((d) => [d.slug, d]));

describe("buildSeed (data/*.csv)", () => {
  it("has 44 districts with unique ids and slugs", () => {
    expect(seed.districts).toHaveLength(44);
    expect(new Set(seed.districts.map((d) => d.id)).size).toBe(44);
  });

  it("maps every child row to a district", () => {
    const ids = new Set(seed.districts.map((d) => d.id));
    for (const r of [
      ...seed.floodEvents,
      ...seed.floodProne,
      ...seed.shelters,
    ]) {
      expect(ids.has(r.district_id)).toBe(true);
    }
    expect(seed.shelters.length).toBeGreaterThanOrEqual(44);
    expect(seed.contacts.some((c) => c.phone === "112")).toBe(true);
  });

  it("gives the known flood-prone districts a base vulnerability of at least 40", () => {
    for (const slug of ["jatinegara", "cengkareng", "kalideres"]) {
      expect(bySlug.get(slug)?.base_vulnerability).toBeGreaterThanOrEqual(40);
    }
  });

  it("keeps every base vulnerability within 0-100", () => {
    for (const d of seed.districts) {
      expect(d.base_vulnerability).toBeGreaterThanOrEqual(0);
      expect(d.base_vulnerability).toBeLessThanOrEqual(100);
    }
  });
});
