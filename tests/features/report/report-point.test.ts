import { describe, expect, it } from "vitest";
import {
  severityLabel,
  toReportPoint,
  toReportResult,
} from "@/features/report/report-point";

describe("toReportPoint", () => {
  it("reads the documented snake_case row", () => {
    expect(
      toReportPoint({
        id: "abc",
        lat: -6.225,
        lng: 106.867,
        foto_url: "https://example.test/a.jpg",
        keparahan: 2,
        ringkasan: "Air setinggi lutut",
        is_demo: true,
        created_at: "2026-11-14T07:00:00Z",
      }),
    ).toEqual({
      id: "abc",
      lat: -6.225,
      lng: 106.867,
      photoUrl: "https://example.test/a.jpg",
      severity: 2,
      summary: "Air setinggi lutut",
      isDemo: true,
      createdAt: "2026-11-14T07:00:00Z",
    });
  });

  it("tolerates camelCase and clamps the severity to 0..4", () => {
    const point = toReportPoint({
      id: "x",
      lat: -6.2,
      lng: 106.8,
      photoUrl: "https://example.test/b.jpg",
      severity: 9,
      summary: "Banjir",
      createdAt: "2026-11-14T07:00:00Z",
    });
    expect(point?.severity).toBe(4);
    expect(point?.isDemo).toBe(false);
  });

  it("drops a row without an id or coordinates", () => {
    expect(toReportPoint({ lat: -6.2, lng: 106.8 })).toBeNull();
    expect(toReportPoint({ id: "x", lng: 106.8 })).toBeNull();
  });
});

describe("severityLabel", () => {
  it("labels 2 as a medium flood and keeps values in range", () => {
    expect(severityLabel(2)).toBe("Genangan sedang");
    expect(severityLabel(-1)).toBe("Tidak terlihat banjir");
    expect(severityLabel(8)).toBe("Banjir parah");
  });
});

describe("toReportResult", () => {
  it("reads the documented result and keeps a flood visible", () => {
    expect(
      toReportResult({
        id: "abc",
        ai_status: "selesai",
        ai_hasil: {
          apakah_banjir: true,
          ringkasan: "Air setinggi lutut",
          estimasi_tinggi_air: "30-50 cm",
        },
      }),
    ).toEqual({
      id: "abc",
      status: "selesai",
      summary: "Air setinggi lutut",
      waterHeight: "30-50 cm",
      rejected: false,
    });
  });

  it("treats a rejected or non-flood photo as not shown", () => {
    expect(toReportResult({ ai_status: "ditolak" }).rejected).toBe(true);
    expect(
      toReportResult({ aiResult: { isFlood: false, summary: "Bukan banjir" } }).rejected,
    ).toBe(true);
  });

  it("keeps a pending report visible and readable", () => {
    const result = toReportResult({ aiStatus: "menunggu" });
    expect(result.rejected).toBe(false);
    expect(result.status).toBe("menunggu");
    expect(result.summary).toBe("");
  });
});
