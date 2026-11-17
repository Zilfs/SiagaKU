import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { IP_SALT: "test-salt" } }));

import {
  handleCreateReport,
  handleListReports,
  toPublicReport,
  type ReportHandlerDeps,
} from "@/app/api/reports/route";
import { handleUploadUrl } from "@/app/api/reports/upload-url/route";
import {
  UploadPhotoSchema,
  CreateReportSchema,
  isPublicReport,
} from "@/features/report/schemas";
import type { ReportRow } from "@/features/report/server/report-repository";
import type { District } from "@/features/risk/types";

const allow = (async () => ({ ok: true, retryAfterSec: 0 })) as never;
const deny = (async () => ({ ok: false, retryAfterSec: 60 })) as never;

const district: District = {
  id: 12,
  slug: "ciracas",
  name: "Ciracas",
  city: "Jakarta Timur",
  lat: -6.326,
  lng: 106.875,
  tidalFloodProne: false,
  baseVulnerability: 60,
  bmkgAdm4: "31.75.10.1001",
};

const validPath = "2026/11/17/11111111-1111-1111-1111-111111111111.jpg";

const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const verdict = {
  apakah_banjir: true,
  keparahan: 2,
  estimasi_tinggi_air: "± 30 cm",
  ringkasan: "Air menggenang setinggi lutut di depan gang.",
  confidence: 0.82,
};

const row = (over: Partial<ReportRow>): ReportRow => ({
  id: "r1",
  lat: -6.3,
  lng: 106.9,
  photo_path: validPath,
  ai_status: "selesai",
  ai_result: verdict,
  is_demo: false,
  created_at: "2026-11-17T03:00:00.000Z",
  ...over,
});

describe("report schemas", () => {
  it("rejects a photo over 1.5 MB or the wrong type", () => {
    expect(
      UploadPhotoSchema.safeParse({ content_type: "image/jpeg", size: 1_500_001 })
        .success,
    ).toBe(false);
    expect(
      UploadPhotoSchema.safeParse({ content_type: "image/gif", size: 100 }).success,
    ).toBe(false);
    expect(
      UploadPhotoSchema.safeParse({ content_type: "image/webp", size: 900 }).success,
    ).toBe(true);
  });

  it("only accepts a generated date/uuid path", () => {
    expect(
      CreateReportSchema.safeParse({
        path: validPath,
        lat: -6.3,
        lng: 106.9,
      }).success,
    ).toBe(true);
    expect(
      CreateReportSchema.safeParse({
        path: "../../etc/passwd",
        lat: -6.3,
        lng: 106.9,
      }).success,
    ).toBe(false);
  });

  it("shows a report only for a confident flood verdict", () => {
    expect(isPublicReport(verdict)).toBe(true);
    expect(isPublicReport({ ...verdict, confidence: 0.49 })).toBe(false);
    expect(isPublicReport({ ...verdict, apakah_banjir: false })).toBe(false);
    expect(isPublicReport({ nonsense: true })).toBe(false);
    expect(isPublicReport(null)).toBe(false);
  });
});

describe("upload-url", () => {
  const deps = {
    rateLimit: allow,
    createSignedUrl: async (path: string) => ({
      signedUrl: `https://storage.test/${path}?token=1`,
      token: "1",
    }),
    uuid: () => "11111111-1111-1111-1111-111111111111",
    now: () => new Date("2026-11-17T10:00:00.000Z"),
  };

  it("returns the dated path and the signed PUT url", async () => {
    const res = await handleUploadUrl(
      post("/api/reports/upload-url", {
        content_type: "image/jpeg",
        size: 900_000,
      }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.path).toBe(validPath);
    expect(body.signedUrl).toContain(validPath);
  });

  it("rejects a file that is too large", async () => {
    const res = await handleUploadUrl(
      post("/api/reports/upload-url", {
        content_type: "image/jpeg",
        size: 2_000_000,
      }),
      deps,
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when the IP is over the limit", async () => {
    const res = await handleUploadUrl(
      post("/api/reports/upload-url", {
        content_type: "image/jpeg",
        size: 900_000,
      }),
      { ...deps, rateLimit: deny },
    );
    expect(res.status).toBe(429);
  });
});

describe("POST /api/reports", () => {
  const base = (over: Partial<ReportHandlerDeps> = {}): ReportHandlerDeps => ({
    rateLimit: allow,
    districts: async () => [district],
    matchDistrict: async () => district,
    downloadPhoto: async () => new Uint8Array([1, 2, 3]),
    insert: async () => "report-id",
    finish: async () => {},
    analyze: async () => ({
      result: verdict,
      provider: "gemini",
      modelId: "gemini-test",
      fallback: false,
    }),
    ...over,
  });

  it("stores the report and marks it selesai when the photo shows water", async () => {
    const finish = vi.fn(async () => {});
    const res = await handleCreateReport(
      post("/api/reports", { path: validPath, lat: -6.3, lng: 106.9 }),
      base({ finish }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ai_status).toBe("selesai");
    expect(body.ai_hasil.apakah_banjir).toBe(true);
    expect(finish).toHaveBeenCalledWith("report-id", "selesai", verdict, "gemini");
  });

  it("marks a photo without water as ditolak", async () => {
    const finish = vi.fn(async () => {});
    const res = await handleCreateReport(
      post("/api/reports", { path: validPath, lat: -6.3, lng: 106.9 }),
      base({
        finish,
        analyze: async () => ({
          result: {
            ...verdict,
            apakah_banjir: false,
            keparahan: 0,
            confidence: 0.9,
            alasan_tolak: "Bukan genangan.",
          },
          provider: "gemini",
          modelId: "gemini-test",
          fallback: false,
        }),
      }),
    );
    expect((await res.json()).ai_status).toBe("ditolak");
    expect(finish).toHaveBeenCalledWith(
      "report-id",
      "ditolak",
      expect.objectContaining({ apakah_banjir: false }),
      "gemini",
    );
  });

  it("keeps the report on menunggu when the vision call fails", async () => {
    const finish = vi.fn(async () => {});
    const res = await handleCreateReport(
      post("/api/reports", { path: validPath, lat: -6.3, lng: 106.9 }),
      base({
        finish,
        analyze: async () => {
          throw new Error("all providers failed");
        },
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).ai_status).toBe("menunggu");
    expect(finish).not.toHaveBeenCalled();
  });

  it("returns 400 when the uploaded photo cannot be read", async () => {
    const res = await handleCreateReport(
      post("/api/reports", { path: validPath, lat: -6.3, lng: 106.9 }),
      base({
        downloadPhoto: async () => {
          throw new Error("missing");
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/reports", () => {
  const deps = (rows: ReportRow[]): ReportHandlerDeps => ({
    listRecent: async () => rows,
    signPhoto: async (path) => `https://storage.test/${path}`,
  });

  it("returns confident floods and demo rows only", async () => {
    const res = await handleListReports(
      new Request("http://localhost/api/reports?hours=72"),
      deps([
        row({}),
        row({ id: "r2", ai_result: { ...verdict, apakah_banjir: false } }),
        row({ id: "r3", is_demo: true, ai_result: null, ai_status: "ditolak" }),
      ]),
    );
    const body = await res.json();
    expect(body.data.map((item: { id: string }) => item.id)).toEqual(["r1", "r3"]);
    expect(body.data[0].foto_url).toContain(validPath);
  });

  it("maps the API keys and treats a malformed verdict as no verdict", () => {
    const item = toPublicReport(row({}), "u");
    expect(item.keparahan).toBe(2);
    expect(item.ringkasan).toContain("lutut");
    expect(item.foto_url).toBe("u");

    const malformed = toPublicReport(
      row({ ai_result: { ...verdict, keparahan: 9 } }),
      "u",
    );
    expect(malformed.keparahan).toBe(0);
  });
});
