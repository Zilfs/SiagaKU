import "server-only";
import { generateText, Output } from "ai";
import { withFallback, type ProviderName } from "@/lib/ai/router";
import { getOrSet, type CacheStore } from "@/lib/data/cache";
import type { RiskLevel } from "@/lib/risk/level";
import { ExplanationSchema, type Explanation } from "../schemas";
import type { AiMeta, RiskDetail } from "../types";
import {
  EXPLANATION_SYSTEM,
  buildExplanationPrompt,
} from "./explanation-prompt";

const TEMPLATES: Record<RiskLevel, (name: string) => Explanation> = {
  low: (name) => ({
    explanation: `Risiko banjir di ${name} hari ini rendah. Prakiraan hujan dan riwayat banjir wilayah ini tidak menunjukkan potensi genangan yang berarti, tetapi tetap pantau info cuaca.`,
    mainAction: "Pastikan saluran air di sekitar rumah tidak tersumbat.",
  }),
  moderate: (name) => ({
    explanation: `Risiko banjir di ${name} hari ini sedang. Hujan atau riwayat genangan di wilayah ini membuat genangan mungkin terjadi, terutama di titik yang biasa tergenang.`,
    mainAction: "Siapkan tas siaga dan pantau info cuaca BMKG.",
  }),
  high: (name) => ({
    explanation: `Risiko banjir di ${name} hari ini tinggi. Kombinasi prakiraan hujan dan riwayat banjir wilayah ini membuat banjir berpotensi terjadi. Bersiaplah lebih awal.`,
    mainAction:
      "Pindahkan barang penting ke tempat tinggi dan siapkan rencana evakuasi.",
  }),
  very_high: (name) => ({
    explanation: `Risiko banjir di ${name} hari ini sangat tinggi. Hujan lebat diperkirakan turun di wilayah yang sering banjir, sehingga banjir sangat berpotensi terjadi. Utamakan keselamatan keluarga.`,
    mainAction: "Bersiap mengungsi, ikuti arahan RT/RW dan BPBD.",
  }),
};

export function templateExplanation(
  name: string,
  level: RiskLevel,
): Explanation {
  return TEMPLATES[level](name);
}

type AiExplanation = Explanation & {
  provider: ProviderName;
  model: string;
  fallback: boolean;
};

async function generateWithAi(d: RiskDetail): Promise<AiExplanation> {
  const { result, provider, modelId, fallback } = await withFallback(
    "explanation",
    (entry) =>
      generateText({
        model: entry.model,
        output: Output.object({ schema: ExplanationSchema }),
        system: EXPLANATION_SYSTEM,
        prompt: buildExplanationPrompt(d),
        temperature: 0.3,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(entry.timeoutMs),
      }),
  );
  const out = ExplanationSchema.parse(result.output);
  return { ...out, provider, model: modelId, fallback };
}

export async function getExplanation(
  d: RiskDetail,
  deps: {
    store?: CacheStore;
    generate?: (d: RiskDetail) => Promise<AiExplanation>;
  } = {},
): Promise<Explanation & { meta: AiMeta }> {
  const generate = deps.generate ?? generateWithAi;
  const key = `ai:explanation:${d.district.id}:${d.level}:${d.components.rainfallCategory ?? "none"}`;
  let fresh = false;
  try {
    const { value, stale } = await getOrSet(
      key,
      10800,
      () => {
        fresh = true;
        return generate(d);
      },
      deps.store,
    );
    return {
      explanation: value.explanation,
      mainAction: value.mainAction,
      meta: {
        provider: value.provider,
        model: value.model,
        fallback: value.fallback,
        cached: !fresh || stale,
      },
    };
  } catch (e) {
    // Any AI failure (all providers down, safety block, bad output) uses the template.
    console.error("explanation ai failed", d.district.id, e);
    return {
      ...templateExplanation(d.district.name, d.level),
      meta: {
        provider: "template",
        model: null,
        fallback: true,
        cached: false,
      },
    };
  }
}
