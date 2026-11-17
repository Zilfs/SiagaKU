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
    expect(html).toContain("Kelurahan di Jatinegara");
    expect(html).toContain("3 kejadian · terdalam 60 cm");
    expect(html).toContain("Rawan 2023 · 4 RW");
    expect(html).toContain(
      "Titik aman terdekat: Kantor Lurah Bali Mester · 400 m",
    );
  });

  it("says no events recorded, never 'aman'", () => {
    const html = render({ unmatchedEventCount: 0, rows: [row("a")] });
    expect(html).toContain("Belum ada kejadian tercatat");
    expect(html).toContain("Titik aman terdekat: belum ada data lokasi");
    const text = html.replaceAll("Titik aman terdekat", "");
    expect(text).not.toContain("aman<");
    expect(text).not.toContain(" aman ");
    expect(text).not.toContain("Aman");
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
    expect(html).toContain("2 kejadian");
    expect(html).not.toContain("terdalam");
    expect(html).toContain("Rawan 2023");
    expect(html).not.toContain(" RW");
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
