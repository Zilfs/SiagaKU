import { describe, expect, it } from "vitest";
import {
  subdistrictKey,
  summarizeSubdistricts,
} from "@/features/risk/subdistrict-breakdown";
import type {
  FloodEvent,
  SafePoint,
  Subdistrict,
} from "@/features/risk/types";

const sub = (
  name: string,
  lat: number | null = -6.2,
  lng: number | null = 106.8,
): Subdistrict => ({ code: name, name, lat, lng });

const event = (
  subdistrict: string | null,
  date = "2025-01-01",
  maxDepthCm: number | null = 10,
): FloodEvent => ({ date, subdistrict, maxDepthCm, sourceUrl: "https://x" });

const point = (
  id: number,
  lat: number | null,
  lng: number | null,
): SafePoint => ({
  id,
  name: `P${id}`,
  type: "shelter",
  isVerified: true,
  lat,
  lng,
});

const run = (over: Partial<Parameters<typeof summarizeSubdistricts>[0]>) =>
  summarizeSubdistricts({
    subdistricts: [],
    events: [],
    floodProne: [],
    safePoints: [],
    ...over,
  });

describe("subdistrictKey", () => {
  it("ignores case, spaces and punctuation", () => {
    expect(subdistrictKey("KAMPUNG  MELAYU")).toBe(
      subdistrictKey("Kampung Melayu"),
    );
  });
  it("maps release spelling variants to the same key", () => {
    expect(subdistrictKey("Jelmbar")).toBe(subdistrictKey("Jelambar"));
    expect(subdistrictKey("Bidaran Cina")).toBe(subdistrictKey("Bidara Cina"));
    expect(subdistrictKey("Cillitan")).toBe(subdistrictKey("Cililitan"));
    expect(subdistrictKey("Kampung Tengah")).toBe(subdistrictKey("Tengah"));
  });
});

describe("summarizeSubdistricts", () => {
  it("counts events, deepest flood and last date per subdistrict", () => {
    const { rows } = run({
      subdistricts: [sub("Bali Mester")],
      events: [
        event("Bali Mester", "2025-02-08", 60),
        event("Bali Mester", "2026-01-22", 30),
      ],
    });
    expect(rows[0]).toMatchObject({
      eventCount: 2,
      maxDepthCm: 60,
      lastEventDate: "2026-01-22",
    });
  });

  it("keeps subdistricts without events with zero, not dropped", () => {
    const { rows } = run({ subdistricts: [sub("Bali Mester")] });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      eventCount: 0,
      maxDepthCm: null,
      lastEventDate: null,
    });
  });

  it("maxDepthCm is null when no event has a depth", () => {
    const { rows } = run({
      subdistricts: [sub("Bali Mester")],
      events: [event("Bali Mester", "2025-01-01", null)],
    });
    expect(rows[0]).toMatchObject({ eventCount: 1, maxDepthCm: null });
  });

  it("flags 2023 flood-prone subdistricts with their RW count", () => {
    const { rows } = run({
      subdistricts: [sub("Bali Mester"), sub("Cipinang")],
      floodProne: [{ subdistrict: "BALI MESTER", rwCount: 3 }],
    });
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
    expect(byName["Bali Mester"]).toMatchObject({
      floodProne: true,
      floodProneRwCount: 3,
    });
    expect(byName["Cipinang"]).toMatchObject({
      floodProne: false,
      floodProneRwCount: null,
    });
  });

  it("counts null and unknown subdistrict names as unmatched", () => {
    const { unmatchedEventCount } = run({
      subdistricts: [sub("Bali Mester")],
      events: [event(null), event("Tanah Abang"), event("Bali Mester")],
    });
    expect(unmatchedEventCount).toBe(2);
  });

  it("nearest safe point skips points without coordinates", () => {
    const { rows } = run({
      subdistricts: [sub("A", -6.2, 106.8), sub("B", null, null)],
      safePoints: [
        point(1, null, null),
        point(2, -6.3, 106.8),
        point(3, -6.21, 106.8),
      ],
    });
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
    expect(byName["A"].nearestSafePoint?.name).toBe("P3");
    expect(byName["A"].nearestSafePoint?.km).toBeCloseTo(1.1, 1);
    expect(byName["B"].nearestSafePoint).toBeNull();
  });

  it("has no nearest safe point when there are no safe points", () => {
    const { rows } = run({ subdistricts: [sub("A")] });
    expect(rows[0].nearestSafePoint).toBeNull();
  });

  it("sorts by events desc, then flood-prone first, then name", () => {
    const { rows } = run({
      subdistricts: [
        sub("Cipinang"),
        sub("Bidara Cina"),
        sub("Prone Zero"),
        sub("Busy"),
      ],
      events: [event("Busy"), event("Busy"), event("Busy")],
      floodProne: [{ subdistrict: "Prone Zero", rwCount: 1 }],
    });
    expect(rows.map((r) => r.name)).toEqual([
      "Busy",
      "Prone Zero",
      "Bidara Cina",
      "Cipinang",
    ]);
  });
});
