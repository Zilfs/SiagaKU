import { describe, expect, it, vi } from "vitest";
import { AllProvidersFailed } from "@/lib/ai/router";

vi.mock("@/lib/env", () => ({ env: { IP_SALT: "test-salt" } }));

import {
  handlePlanDetail,
  type PlanDetailDeps,
} from "@/app/api/plans/[slug]/route";
import { handlePlans, type PlanHandlerDeps } from "@/app/api/plans/route";
import { buildBasePlan } from "@/features/plan/base-plan";
import {
  PreparednessPlanSchema,
  type PlanRequest,
  type PreparednessPlan,
} from "@/features/plan/schemas";
import {
  generatePlan,
  type PlanGenerator,
} from "@/features/plan/server/generate-plan";
import type { RiskDetail } from "@/features/risk/types";

const body: PlanRequest = {
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

const safePoints = Array.from({ length: 7 }, (_, i) => ({
  id: 30 + i,
  name: `Posko ${i}`,
  type: "official_post",
  isVerified: i < 4,
  lat: null,
  lng: null,
}));

const risk: RiskDetail = {
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
  floodHistory: [
    {
      date: "2025-03-03",
      subdistrict: "Kampung Melayu",
      maxDepthCm: 250,
      sourceUrl: "https://example.com",
    },
  ],
  safePoints,
};

const plan = buildBasePlan(
  body,
  {
    name: "Jatinegara",
    city: "Jakarta Timur",
    level: "high",
    score: 68,
    tidalFloodProne: false,
    maxRainfallMm: 62.4,
    floodSummary: "Banjir 3 Mar 2025 hingga 250 cm di Kampung Melayu",
  },
  [30, 31],
);

type RouteGenerate = NonNullable<PlanHandlerDeps["generate"]>;

function planner(candidate: PreparednessPlan = plan): RouteGenerate {
  return async () => ({
    plan: candidate,
    provider: "gemini" as const,
    modelId: "gemini-3.5-flash-lite",
    fallback: false,
  });
}

function deps(overrides: Partial<PlanHandlerDeps> = {}) {
  return {
    rateLimit: async () => ({ ok: true, retryAfterSec: 0 }),
    getRisk: async () => risk,
    generate: planner(),
    insert: vi.fn(async () => undefined),
    newSlug: () => "k8f2ma9xq1",
    ...overrides,
  } satisfies PlanHandlerDeps;
}

function request(payload: unknown, ip = "1.2.3.4") {
  return new Request("http://x/api/plans", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/plans", () => {
  it("returns 400 for an invalid profile without calling the model", async () => {
    const generate = vi.fn();
    const res = await handlePlans(
      request({ ...body, name: "Budi" }),
      deps({ generate }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_INPUT");
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown district", async () => {
    const res = await handlePlans(
      request(body),
      deps({ getRisk: async () => null }),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("returns 429 with Retry-After when the plan rate limit is exhausted", async () => {
    const generate = vi.fn();
    const res = await handlePlans(
      request(body),
      deps({
        rateLimit: async () => ({ ok: false, retryAfterSec: 42 }),
        generate,
      }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect((await res.json()).error.code).toBe("RATE_LIMITED");
    expect(generate).not.toHaveBeenCalled();
  });

  it("stores the plan and returns the share url", async () => {
    const insert = vi.fn(async () => undefined);
    const res = await handlePlans(request(body), deps({ insert }));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      slug: "k8f2ma9xq1",
      url: "/rencana/k8f2ma9xq1",
      meta: {
        provider: "gemini",
        model: "gemini-3.5-flash-lite",
        fallback: false,
      },
    });
    expect(insert).toHaveBeenCalledWith({
      slug: "k8f2ma9xq1",
      districtId: 12,
      profile: body,
      plan,
      provider: "gemini",
      model: "gemini-3.5-flash-lite",
    });
  });

  it("passes at most six safe points to the model", async () => {
    let offered: { id: number }[] = [];
    const generate: RouteGenerate = async (_input, _district, safePoints) => {
      offered = safePoints;
      return {
        plan,
        provider: "gemini" as const,
        modelId: "gemini-3.5-flash-lite",
        fallback: false,
      };
    };
    await handlePlans(request(body), deps({ generate }));

    expect(offered).toHaveLength(6);
    expect(offered[0].id).toBe(30);
  });

  it("strips invented safe point ids before storing", async () => {
    const insert = vi.fn(async () => undefined);
    await handlePlans(
      request(body),
      deps({ generate: planner({ ...plan, safePointIds: [99, 31] }), insert }),
    );

    const stored = insert.mock.calls[0] as unknown as [
      { plan: { safePointIds: number[] } },
    ];
    expect(stored[0].plan.safePointIds).toEqual([31]);
  });

  it("still returns 201 with the base plan when every provider fails", async () => {
    const insert = vi.fn(async () => undefined);
    const failing: PlanGenerator = async () => {
      throw new AllProvidersFailed(["quota"]);
    };
    const res = await handlePlans(
      request(body),
      deps({
        generate: (input, district, safePoints) =>
          generatePlan(input, district, safePoints, { generate: failing }),
        insert,
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.meta).toEqual({
      provider: "template",
      model: null,
      fallback: true,
    });
    const stored = insert.mock.calls[0] as unknown as [
      { provider: string; plan: unknown },
    ];
    expect(stored[0].provider).toBe("template");
    expect(PreparednessPlanSchema.safeParse(stored[0].plan).success).toBe(true);
  });

  it("returns 500 when the plan cannot be stored", async () => {
    const res = await handlePlans(
      request(body),
      deps({
        insert: async () => {
          throw new Error("db down");
        },
      }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("INTERNAL");
  });
});

const storedRow = {
  slug: "k8f2ma9xq1",
  createdAt: "2026-11-14T10:00:00.000Z",
  districtId: 12,
  district: {
    id: 12,
    slug: "jatinegara",
    name: "Jatinegara",
    city: "Jakarta Timur",
  },
  profile: body,
  plan,
  provider: "gemini",
  model: "gemini-3.5-flash-lite",
};

const contacts = [{ name: "Jakarta Siaga", phone: "112", scope: "DKI" }];

function detailDeps(overrides: Partial<PlanDetailDeps> = {}) {
  return {
    find: async () => storedRow,
    listSafePoints: async () => risk.safePoints,
    listContacts: async () => contacts,
    ...overrides,
  } satisfies PlanDetailDeps;
}

describe("GET /api/plans/[slug]", () => {
  it("returns the plan with safe points and emergency contacts", async () => {
    const res = await handlePlanDetail("k8f2ma9xq1", detailDeps());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      slug: "k8f2ma9xq1",
      createdAt: "2026-11-14T10:00:00.000Z",
      district: storedRow.district,
      profile: body,
      plan,
      safePoints: risk.safePoints,
      emergencyContacts: contacts,
    });
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await handlePlanDetail(
      "missing",
      detailDeps({ find: async () => null }),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});
