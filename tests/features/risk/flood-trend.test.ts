import { describe, expect, it } from "vitest";
import { monthlyFloodCounts } from "@/features/risk/flood-trend";

describe("monthlyFloodCounts", () => {
  it("zero-fills 12 months, oldest first, ending with the current month", () => {
    const r = monthlyFloodCounts([], new Date("2026-11-16T03:00:00Z"));
    expect(r).toHaveLength(12);
    expect(r[0]).toEqual({ month: "2025-12", count: 0 });
    expect(r[11]).toEqual({ month: "2026-11", count: 0 });
  });
  it("buckets by the first 7 chars and ignores out-of-range dates", () => {
    const r = monthlyFloodCounts(
      ["2026-11-01", "2026-11-30", "2026-01-15", "2025-11-30", "2027-01-01"],
      new Date("2026-11-16T03:00:00Z"),
    );
    expect(r.find((m) => m.month === "2026-11")?.count).toBe(2);
    expect(r.find((m) => m.month === "2026-01")?.count).toBe(1);
    expect(r.reduce((s, m) => s + m.count, 0)).toBe(3);
  });
  it("uses Asia/Jakarta for now (UTC 31 Oct 20:00 is already 1 Nov WIB)", () => {
    const r = monthlyFloodCounts([], new Date("2026-10-31T20:00:00Z"));
    expect(r[11].month).toBe("2026-11");
  });
  it("crosses the year boundary", () => {
    const r = monthlyFloodCounts([], new Date("2026-02-10T00:00:00Z"), 3);
    expect(r.map((m) => m.month)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});
