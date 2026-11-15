import "server-only";
import { generateText, Output } from "ai";
import { withFallback, type ProviderName } from "@/lib/ai/router";
import { buildBasePlan, type PlanDistrict } from "../base-plan";
import {
  PreparednessPlanSchema,
  type PlanRequest,
  type PreparednessPlan,
} from "../schemas";
import { selectSafePointIds, type PlanSafePoint } from "../safe-points";
import { PLAN_SYSTEM, buildPlanPrompt } from "./plan-prompt";

export type PlanGenerator = (args: {
  input: PlanRequest;
  district: PlanDistrict;
  safePoints: PlanSafePoint[];
}) => Promise<{
  plan: unknown;
  provider: ProviderName;
  modelId: string;
  fallback: boolean;
}>;

export type GeneratedPlan = {
  plan: PreparednessPlan;
  provider: ProviderName | "template";
  modelId: string | null;
  fallback: boolean;
};

const defaultGenerator: PlanGenerator = async ({
  input,
  district,
  safePoints,
}) => {
  const { result, provider, modelId, fallback } = await withFallback(
    "plan",
    async (entry) => {
      const response = await generateText({
        model: entry.model,
        output: Output.object({ schema: PreparednessPlanSchema }),
        system: PLAN_SYSTEM,
        prompt: buildPlanPrompt(input, district, safePoints),
        temperature: 0.4,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(entry.timeoutMs),
      });
      return PreparednessPlanSchema.parse(response.output);
    },
  );
  return { plan: result, provider, modelId, fallback };
};

/**
 * Validates the model plan, strips safe point ids the district does not offer,
 * and falls back to the rule-based plan when every provider fails.
 */
export async function generatePlan(
  input: PlanRequest,
  district: PlanDistrict,
  safePoints: PlanSafePoint[],
  deps: { generate?: PlanGenerator } = {},
): Promise<GeneratedPlan> {
  const generate = deps.generate ?? defaultGenerator;

  try {
    const out = await generate({ input, district, safePoints });
    const parsed = PreparednessPlanSchema.parse(out.plan);
    return {
      plan: {
        ...parsed,
        safePointIds: selectSafePointIds(parsed.safePointIds, safePoints),
      },
      provider: out.provider,
      modelId: out.modelId,
      fallback: out.fallback,
    };
  } catch (error) {
    console.error("plan ai failed", district.name, error);
    return {
      plan: buildBasePlan(input, district, selectSafePointIds([], safePoints)),
      provider: "template",
      modelId: null,
      fallback: true,
    };
  }
}
