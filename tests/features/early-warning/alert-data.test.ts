import { describe, expect, it } from "vitest";
import {
  districtNameFromSlug,
  formatWindow,
  parseSubdistricts,
  toAlertInfo,
  toStatusName,
} from "@/features/early-warning/alert-data";

describe("toStatusName", () => {
  it("accepts the Indonesian label and the English enum", () => {
    expect(toStatusName("Siaga")).toBe("Siaga");
    expect(toStatusName("watch")).toBe("Siaga");
    expect(toStatusName("warning")).toBe("Awas");
    expect(toStatusName("advisory")).toBe("Waspada");
    expect(toStatusName("normal")).toBe("Normal");
  });

  it("returns null for an unknown or missing status", () => {
    expect(toStatusName("banjir")).toBeNull();
    expect(toStatusName(undefined)).toBeNull();
  });
});

describe("toAlertInfo", () => {
  it("reads the documented snake_case payload", () => {
    const info = toAlertInfo({
      status: "Siaga",
      skor: 62,
      hujan_24j_mm: 38.5,
      kategori_hujan: "Sedang",
      jendela: {
        mulai: "2026-11-18T08:00:00.000Z",
        selesai: "2026-11-18T11:00:00.000Z",
      },
    });
    expect(info.status).toBe("Siaga");
    expect(info.score).toBe(62);
    expect(info.rainfallMm).toBe(38.5);
    expect(info.category).toBe("Sedang");
    expect(info.windowLabel).toBe("15.00–18.00 WIB");
  });

  it("tolerates camelCase and a missing window", () => {
    const info = toAlertInfo({
      status: "watch",
      hujan24jMm: 12,
      kategoriHujan: "Ringan",
    });
    expect(info.status).toBe("Siaga");
    expect(info.rainfallMm).toBe(12);
    expect(info.windowLabel).toBeNull();
  });

  it("reads the /api/early-warning/[code] response and labels the category", () => {
    const info = toAlertInfo({
      status: "watch",
      score: 64,
      rainfall24hMm: 30,
      rainfallCategory: "moderate",
      window: {
        start: "2026-11-18T08:00:00.000Z",
        end: "2026-11-18T11:00:00.000Z",
      },
    });
    expect(info).toEqual({
      status: "Siaga",
      score: 64,
      rainfallMm: 30,
      category: "Sedang",
      windowLabel: "15.00–18.00 WIB",
    });
  });

  it("handles a null body", () => {
    expect(toAlertInfo(null)).toMatchObject({ status: null, windowLabel: null });
  });
});

describe("formatWindow", () => {
  it("keeps an already short label readable", () => {
    expect(formatWindow("15.00", "18.00")).toBe("15.00–18.00 WIB");
  });

  it("returns null when either end is missing", () => {
    expect(formatWindow(undefined, "18.00")).toBeNull();
  });
});

describe("parseSubdistricts", () => {
  it("reads an array of docs/07 rows", () => {
    expect(
      parseSubdistricts([
        { kode: "31.75.10.1008", nama: "Ceger", kecamatan: "Cipayung", kota: "Jakarta Timur" },
        { kode: "", nama: "Tanpa kode" },
      ]),
    ).toEqual([
      {
        kode: "31.75.10.1008",
        nama: "Ceger",
        kecamatan: "Cipayung",
        kota: "Jakarta Timur",
      },
    ]);
  });

  it("reads a data envelope and English keys", () => {
    expect(
      parseSubdistricts({
        data: [{ code: "x", name: "Ceger", district: "Cipayung", city: "Jakarta Timur" }],
      }),
    ).toEqual([
      { kode: "x", nama: "Ceger", kecamatan: "Cipayung", kota: "Jakarta Timur" },
    ]);
  });

  it("returns an empty list for a bad payload", () => {
    expect(parseSubdistricts({ error: "nope" })).toEqual([]);
  });
});

describe("districtNameFromSlug", () => {
  it("prettifies a slug from the district link", () => {
    expect(districtNameFromSlug("kebayoran-baru")).toBe("Kebayoran Baru");
    expect(districtNameFromSlug("cipayung")).toBe("Cipayung");
  });
});
