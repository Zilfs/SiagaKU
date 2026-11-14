import "server-only";
import { generateText } from "ai";
import { getProviderChain, type ProviderName } from "@/lib/ai/router";
import { supabaseServer } from "@/lib/db/client";
import type { Env } from "@/lib/env";

export type Check = "ok" | "error" | "skip";

/** One cheap query; the daily cron calls this, which also keeps the free Supabase project awake. */
export async function checkDb(): Promise<"ok" | "error"> {
  try {
    const { error } = await supabaseServer()
      .from("districts")
      .select("id", { head: true, count: "exact" });
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

/** Sends a 1-token prompt to every configured provider. Missing env (or a provider in cooldown) reports "skip". */
export async function pingProviders(
  e: Env,
): Promise<Record<ProviderName, Check>> {
  const out: Record<ProviderName, Check> = {
    gemini: "skip",
    groq: "skip",
    alt: "skip",
  };
  await Promise.all(
    getProviderChain("explanation", e).map(async (p) => {
      try {
        await generateText({
          model: p.model,
          prompt: "ping",
          maxOutputTokens: 1,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(p.timeoutMs),
        });
        out[p.name] = "ok";
      } catch {
        out[p.name] = "error";
      }
    }),
  );
  return out;
}
