import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SubdistrictBreakdown } from "@/features/risk/components/subdistrict-breakdown";
import type {
  SubdistrictBreakdown as Breakdown,
  SubdistrictSummary,
} from "@/features/risk/types";

const row = (
  code: string,
  overrides: Partial<SubdistrictSummary> = {},
): SubdistrictSummary => ({
  code,
  name: `Kelurahan ${code}`,
  eventCount: 0,
  maxDepthCm: null,
  lastEventDate: null,
  floodProne: false,
  floodProneRwCount: null,
  nearestSafePoint: null,
  ...overrides,
});

const render = (breakdown: Breakdown | null) =>
  renderToStaticMarkup(
    <SubdistrictBreakdown breakdown={breakdown} districtName="Jatinegara" />,
  );

/** Visible and screen-reader text with tags removed, as a reader hears it. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

describe("SubdistrictBreakdown", () => {
  it("shows counts, depth, flood-prone badge and nearest point", () => {
    const html = render({
      unmatchedEventCount: 0,
      rows: [
        row("a", {
          name: "Bali Mester",
          eventCount: 3,
          maxDepthCm: 60,
          floodProne: true,
          floodProneRwCount: 4,
          nearestSafePoint: { name: "Kantor Lurah Bali Mester", km: 0.4 },
        }),
      ],
    });
    const t = text(html);
    expect(t).toContain("Kelurahan di Jatinegara");
    expect(t).toContain("3 kejadian");
    expect(t).toContain("terdalam 60 cm");
    expect(t).toContain("Rawan 2023 · 4 RW");
    expect(t).toContain("Titik aman terdekat: Kantor Lurah Bali Mester 400 m");
  });

  it("says no events recorded, never 'aman'", () => {
    const html = render({ unmatchedEventCount: 0, rows: [row("a")] });
    const t = text(html);
    expect(t).toContain("Belum ada kejadian tercatat");
    expect(t).toContain("Titik aman terdekat: belum ada data lokasi");
    const rest = t.replaceAll("Titik aman terdekat", "");
    expect(rest).not.toMatch(/\baman\b/i);
  });

  it("puts rows after the fifth inside details", () => {
    const rows = Array.from({ length: 7 }, (_, i) => row(String(i)));
    const html = render({ unmatchedEventCount: 0, rows });
    expect(html).toContain("Lihat 2 kelurahan lainnya");
    expect(html).toContain("<details");
    const details = html.indexOf("<details");
    expect(html.indexOf("Kelurahan 4")).toBeLessThan(details);
    expect(html.indexOf("Kelurahan 5")).toBeGreaterThan(details);
  });

  it("drops depth and RW count when they are null", () => {
    const html = render({
      unmatchedEventCount: 0,
      rows: [
        row("a", {
          eventCount: 2,
          maxDepthCm: null,
          floodProne: true,
          floodProneRwCount: null,
        }),
      ],
    });
    const t = text(html);
    expect(t).toContain("2 kejadian");
    expect(t).not.toContain("terdalam");
    expect(t).toContain("Rawan 2023");
    expect(t).not.toContain(" RW");
  });

  it("summarises how many subdistricts have events and are flood-prone", () => {
    const html = render({
      unmatchedEventCount: 0,
      rows: [
        row("a", { eventCount: 3, maxDepthCm: 60, floodProne: true }),
        row("b", { eventCount: 1, maxDepthCm: 30 }),
        row("c"),
      ],
    });
    expect(text(html)).toContain(
      "2 dari 3 kelurahan punya kejadian tercatat · 1 masuk daftar rawan 2023",
    );
  });

  it("scales the bar to the subdistrict with the most events", () => {
    const html = render({
      unmatchedEventCount: 0,
      rows: [
        row("a", { eventCount: 4, maxDepthCm: 30 }),
        row("b", { eventCount: 1, maxDepthCm: 60 }),
      ],
    });
    expect(html).toContain("--share:100%");
    expect(html).toContain("--share:25%");
  });

  it("labels each cell for screen readers and hides the visual column header", () => {
    const html = render({
      unmatchedEventCount: 0,
      rows: [row("a", { eventCount: 1, maxDepthCm: 30 })],
    });
    expect(html).toMatch(
      /<div class="sk-subdistricts__cols" aria-hidden="true">/,
    );
    expect(text(html)).toContain("Genangan tercatat:");
  });

  it("notes unmatched events", () => {
    const html = render({ unmatchedEventCount: 2, rows: [row("a")] });
    expect(html).toContain(
      "2 kejadian lain tidak menyebut kelurahan yang cocok",
    );
  });

  it("shows the empty state for null or empty breakdown", () => {
    const empty = "Daftar kelurahan untuk kecamatan ini belum tersedia.";
    expect(render(null)).toContain(empty);
    expect(render({ unmatchedEventCount: 0, rows: [] })).toContain(empty);
  });
});
