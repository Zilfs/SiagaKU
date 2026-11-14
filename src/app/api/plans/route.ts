import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  hashIp,
} from "@/lib/rate-limit";
import { getRiskDetail } from "@/features/risk/server/risk-service";
import type { RiskDetail } from "@/features/risk/types";
import { PlanRequestSchema, type PlanRequest } from "@/features/plan/schemas";
import type { PlanDistrict } from "@/features/plan/base-plan";
import {
  promptSafePoints,
  selectSafePointIds,
  type PlanSafePoint,
} from "@/features/plan/safe-points";
import {
  generatePlan,
  type GeneratedPlan,
} from "@/features/plan/server/generate-plan";
import {
  insertPlan,
  type NewPlan,
} from "@/features/plan/server/plan-repository";
import { generateSlug } from "@/features/plan/slug";

export type PlanHandlerDeps = {
  rateLimit?: typeof checkRateLimit;
  getRisk?: (districtId: number) => Promise<RiskDetail | null>;
  generate?: (
    input: PlanRequest,
    district: PlanDistrict,
    safePoints: PlanSafePoint[],
  ) => Promise<GeneratedPlan>;
  insert?: (plan: NewPlan) => Promise<void>;
  newSlug?: () => string;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** One short sentence for the prompt and the base summary (docs/05 §2.1). */
function floodSummary(risk: RiskDetail): string {
  const event = risk.floodHistory[0];
  if (!event) return "";
  const [year, month, day] = event.date.split("-").map(Number);
  const date = `${day} ${MONTHS[month - 1] ?? ""} ${year}`.trim();
  const depth =
    event.maxDepthCm !== null ? ` hingga ${event.maxDepthCm} cm` : "";
  const place = event.subdistrict ? ` di ${event.subdistrict}` : "";
  return `Banjir ${date}${depth}${place}`;
}

function toPlanDistrict(risk: RiskDetail): PlanDistrict {
  return {
    name: risk.district.name,
    city: risk.district.city,
    level: risk.level,
    score: risk.score,
    tidalFloodProne: risk.district.tidalFloodProne,
    maxRainfallMm: risk.components.maxRainfallMm,
    floodSummary: floodSummary(risk),
  };
}

const loadRisk = (districtId: number): Promise<RiskDetail | null> =>
  getRiskDetail(String(districtId));

export async function handlePlans(
  req: Request,
  deps: PlanHandlerDeps = {},
): Promise<Response> {
  let body: PlanRequest;
  try {
    body = await parseJson(req, PlanRequestSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }

  const { limit, windowSec } = RATE_LIMITS.plan;
  const checkLimit = deps.rateLimit ?? checkRateLimit;
  const rl = await checkLimit(
    hashIp(getClientIp(req), env.IP_SALT),
    "plan",
    limit,
    windowSec,
  );
  if (!rl.ok) {
    const res = jsonError(
      "RATE_LIMITED",
      "Terlalu banyak permintaan, coba lagi beberapa menit lagi.",
      429,
    );
    res.headers.set("Retry-After", String(rl.retryAfterSec));
    return res;
  }

  const getRisk = deps.getRisk ?? loadRisk;
  const generate = deps.generate ?? generatePlan;
  const insert = deps.insert ?? insertPlan;
  const newSlug = deps.newSlug ?? generateSlug;

  try {
    const risk = await getRisk(body.district_id);
    if (!risk) {
      return jsonError("NOT_FOUND", "Kecamatan tidak ditemukan.", 404);
    }

    const safePoints = promptSafePoints(
      risk.safePoints.map((point) => ({
        id: point.id,
        name: point.name,
        type: point.type,
        isVerified: point.isVerified,
      })),
    );
    const generated = await generate(body, toPlanDistrict(risk), safePoints);
    const plan = {
      ...generated.plan,
      safePointIds: selectSafePointIds(generated.plan.safePointIds, safePoints),
    };

    const slug = newSlug();
    await insert({
      slug,
      districtId: body.district_id,
      profile: body,
      plan,
      provider: generated.provider,
      model: generated.modelId,
    });

    return Response.json(
      {
        slug,
        url: `/rencana/${slug}`,
        meta: {
          provider: generated.provider,
          model: generated.modelId,
          fallback: generated.fallback,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/plans failed", body.district_id, error);
    return jsonError("INTERNAL", "Gagal membuat rencana siaga.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handlePlans(req);
}
