import { describe, expect, it, vi } from "vitest";
import { AllProvidersFailed } from "@/lib/ai/router";
import { memoryCacheStore } from "@/lib/data/cache";
import {
  getExplanation,
  templateExplanation,
} from "@/features/risk/server/explanation";
import type { RiskDetail } from "@/features/risk/types";

const detail = {
  district: {
    id: 12,
    slug: "jatinegara",
    name: "Jatinegara",
    city: "Jakarta Timur",
    lat: -6.23,
    lng: 106.87,
    tidalFloodProne: false,
  },
  score: 68,
  level: "high",
  components: {
    baseVulnerability: 80,
    rainfallFactor: 70,
    maxRainfallMm: 62.4,
    rainfallCategory: "heavy",
  },
  noRainfallData: false,
  weather: { source: "BMKG", updatedAt: null, stale: false, slots: [] },
  floodHistory: [],
  safePoints: [],
} satisfies RiskDetail;

describe("templateExplanation", () => {
  it("names the district and gives the level action", () => {
    const t = templateExplanation("Jatinegara", "high");
    expect(t.explanation).toContain("Jatinegara");
    expect(t.mainAction).toBe(
      "Pindahkan barang penting ke tempat tinggi dan siapkan rencana evakuasi.",
    );
    expect(t.explanation.length).toBeLessThanOrEqual(400);
  });
});

describe("getExplanation", () => {
  it("falls back to the template when all providers fail", async () => {
    const generate = vi.fn(async () => {
      throw new AllProvidersFailed(["quota", "timeout"]);
    });
    const r = await getExplanation(detail, {
      store: memoryCacheStore(),
      generate,
    });
    expect(r).toEqual({
      ...templateExplanation("Jatinegara", "high"),
      meta: {
        provider: "template",
        model: null,
        fallback: true,
        cached: false,
      },
    });
  });

  it("does not cache the template, so the next call retries AI", async () => {
    const store = memoryCacheStore();
    const failing = vi.fn(async () => {
      throw new AllProvidersFailed(["quota"]);
    });
    await getExplanation(detail, { store, generate: failing });
    expect(await store.get("ai:explanation:12:high:heavy")).toBeNull();
  });

  it("caches the AI answer per district, level and rainfall bucket", async () => {
    const store = memoryCacheStore();
    const generate = vi.fn(async () => ({
      explanation: "Risiko tinggi karena hujan lebat.",
      mainAction: "Siapkan tas siaga.",
      provider: "groq" as const,
      model: "llama",
      fallback: true,
    }));
    const first = await getExplanation(detail, { store, generate });
    const second = await getExplanation(detail, { store, generate });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(first.meta).toEqual({
      provider: "groq",
      model: "llama",
      fallback: true,
      cached: false,
    });
    expect(second.meta.cached).toBe(true);
    expect(second.explanation).toBe("Risiko tinggi karena hujan lebat.");
    expect(await store.get("ai:explanation:12:high:heavy")).not.toBeNull();
  });
});
