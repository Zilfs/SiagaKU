import "server-only";
import { supabaseServer } from "@/lib/db/client";
import type { AiLogEntry } from "./router";

/**
 * Best-effort write to the ai_logs table. Logging must never break a request,
 * so every failure is swallowed after printing a console warning.
 */
export async function logAi(entry: AiLogEntry): Promise<void> {
  try {
    const { error } = await supabaseServer()
      .from("ai_logs")
      .insert({
        feature: entry.task,
        provider: entry.provider,
        model: entry.modelId,
        status: entry.status,
        latency_ms: Math.round(entry.latencyMs),
        error_code: entry.errorKind ?? null,
      });

    if (error) {
      console.error("ai_logs insert failed:", error.message);
    }
  } catch (error) {
    console.error("ai_logs insert failed:", error);
  }
}
