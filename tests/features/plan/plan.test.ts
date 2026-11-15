import { describe, expect, it, vi } from "vitest";
import { AllProvidersFailed } from "@/lib/ai/router";
import {
  PlanRequestSchema,
  PreparednessPlanSchema,
  type PlanRequest,
} from "@/features/plan/schemas";
import { buildBasePlan, type PlanDistrict } from "@/features/plan/base-plan";
import {
  generatePlan,
  type PlanGenerator,
} from "@/features/plan/server/generate-plan";
import { selectSafePointIds } from "@/features/plan/safe-points";

const district: PlanDistrict = {
  name: "Jatinegara",
  city: "Jakarta Timur",
  level: "high",
  score: 68,
  tidalFloodProne: false,
  maxRainfallMm: 62.4,
  floodSummary: "Banjir 3 Mar 2025 hingga 250 cm di Kampung Melayu",
};

const request: PlanRequest = {
  district_id: 12,
  housing: { type: "single_story", floor: 1 },
  members: {
    adults: 2,
    children: 0,
    infants: 1,
    elderly: 1,
    pregnant: 0,
    disabilities: [{ type: "wheelchair_user" }],
    routineMedicine: 1,
    pets: ["cat"],
  },
  conditions: {
    vehicle: "motorcycle",
    riverDistance: "close",
    floodedBefore: true,
  },
};

const available = [
  { id: 31, name: "Posko 31", type: "official_post", isVerified: true },
  { id: 32, name: "Posko 32", type: "subdistrict_office", isVerified: false },
  { id: 33, name: "Posko 33", type: "school", isVerified: false },
];

function validPlan() {
  const plan = buildBasePlan(request, district, [31, 32]);
  return PreparednessPlanSchema.parse(plan);
}

describe("PlanRequestSchema", () => {
  it("accepts the golden path profile", () => {
    expect(PlanRequestSchema.safeParse(request).success).toBe(true);
  });

  it("rejects a household with zero members", () => {
    const body = {
      ...request,
      members: { ...request.members, adults: 0, infants: 0, elderly: 0 },
    };
    expect(PlanRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects a household with more than 15 members", () => {
    const body = {
      ...request,
      members: { ...request.members, adults: 10, children: 6 },
    };
    expect(PlanRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects unknown fields such as a name", () => {
    expect(
      PlanRequestSchema.safeParse({ ...request, name: "Budi" }).success,
    ).toBe(false);
    expect(
      PlanRequestSchema.safeParse({
        ...request,
        members: { ...request.members, phone: "0812" },
      }).success,
    ).toBe(false);
  });

  it("rejects a floor outside 0-60", () => {
    expect(
      PlanRequestSchema.safeParse({
        ...request,
        housing: { type: "apartment", floor: 61 },
      }).success,
    ).toBe(false);
  });
});

describe("selectSafePointIds", () => {
  it("drops unknown and duplicate ids", () => {
    expect(selectSafePointIds([99, 31, 31], available)).toEqual([31]);
  });

  it("falls back to the first two available points", () => {
    expect(selectSafePointIds([99], available)).toEqual([31, 32]);
  });

  it("keeps at most three ids in the requested order", () => {
    expect(selectSafePointIds([33, 31, 32, 31], available)).toEqual([
      33, 31, 32,
    ]);
  });

  it("returns an empty list when the district has no safe points", () => {
    expect(selectSafePointIds([31], [])).toEqual([]);
  });
});

describe("buildBasePlan", () => {
  it("passes the output schema", () => {
    expect(() => validPlan()).not.toThrow();
  });

  it("adds items for infants, older adults, wheelchair users and pets", () => {
    const audiences = validPlan().goKit.map((item) => item.audience);
    expect(audiences).toContain("bayi");
    expect(audiences).toContain("lansia");
    expect(audiences).toContain("pengguna kursi roda");
    expect(audiences).toContain("hewan");
    expect(audiences).toContain("semua");
  });

  it("names the district and keeps the requested safe points", () => {
    const plan = validPlan();
    expect(plan.summary).toContain("Jatinegara");
    expect(plan.safePointIds).toEqual([31, 32]);
  });
});

describe("generatePlan", () => {
  const generator = (candidate: unknown): PlanGenerator =>
    vi.fn(async () => ({
      plan: candidate,
      provider: "gemini" as const,
      modelId: "gemini-3.5-flash-lite",
      fallback: false,
    }));

  it("returns the model plan with provider metadata", async () => {
    const out = await generatePlan(request, district, available, {
      generate: generator(validPlan()),
    });
    expect(PreparednessPlanSchema.safeParse(out.plan).success).toBe(true);
    expect(out).toMatchObject({
      provider: "gemini",
      modelId: "gemini-3.5-flash-lite",
      fallback: false,
    });
  });

  it("replaces safe point ids the model invented", async () => {
    const plan = { ...validPlan(), safePointIds: [99, 31] };
    const out = await generatePlan(request, district, available, {
      generate: generator(plan),
    });
    expect(out.plan.safePointIds).toEqual([31]);
  });

  it("falls back to the base plan when every provider fails", async () => {
    const generate: PlanGenerator = async () => {
      throw new AllProvidersFailed(["quota", "timeout"]);
    };
    const out = await generatePlan(request, district, available, { generate });
    expect(out.provider).toBe("template");
    expect(out.modelId).toBeNull();
    expect(out.fallback).toBe(true);
    expect(PreparednessPlanSchema.safeParse(out.plan).success).toBe(true);
  });

  it("falls back when the model output misses the schema", async () => {
    const out = await generatePlan(request, district, available, {
      generate: generator({ summary: "terlalu pendek" }),
    });
    expect(out.provider).toBe("template");
  });
});
