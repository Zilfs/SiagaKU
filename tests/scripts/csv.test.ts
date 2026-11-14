import { describe, expect, it } from "vitest";
import { FloodEventRow, parseCsv, validateRows } from "../../scripts/lib/csv";

describe("parseCsv", () => {
  it("handles quoted commas, escaped quotes, CRLF and blank lines", () => {
    const rows = parseCsv(
      'name,note\r\n"Masjid A, Cakung","kata ""aman"""\r\n\r\nB,x\n',
    );
    expect(rows).toEqual([
      { name: "Masjid A, Cakung", note: 'kata "aman"' },
      { name: "B", note: "x" },
    ]);
  });
});

describe("validateRows", () => {
  const row = {
    district_slug: "jatinegara",
    subdistrict: "Kampung Melayu",
    event_date: "2025-03-03",
    max_depth_cm: "250",
    affected_rt_count: "",
    description: "Luapan Kali Ciliwung",
    source_url: "https://bpbd.jakarta.go.id/x",
  };

  it("coerces numbers and empty optionals", () => {
    const [r] = validateRows("flood_events.csv", [row], FloodEventRow);
    expect(r.max_depth_cm).toBe(250);
    expect(r.affected_rt_count).toBeNull();
  });

  it("rejects an empty source_url with the line number", () => {
    expect(() =>
      validateRows(
        "flood_events.csv",
        [row, { ...row, source_url: "" }],
        FloodEventRow,
      ),
    ).toThrow(/flood_events\.csv:3 source_url/);
  });
});
