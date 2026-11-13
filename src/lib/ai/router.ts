import type { LanguageModel } from "ai";
import { logAi } from "./log";
import { getProviderChain } from "./providers";

export { getProviderChain } from "./providers";

export type ProviderName = "gemini" | "groq" | "alt";
export type AiTask = "penjelasan" | "rencana" | "chat" | "vision" | "iklim";

export type ProviderEntry = {
  name: ProviderName;
  modelId: string;
  model: LanguageModel;
  timeoutMs: number;
};

export type ErrorKind =
  "quota" | "server" | "timeout" | "invalid" | "safety" | "unknown";

export type AiLogEntry = {
  task: AiTask;
  provider: ProviderName;
  modelId: string;
  status: "ok" | "fallback" | "error";
  latencyMs: number;
  errorKind?: ErrorKind;
};

export type WithFallbackResult<T> = {
  result: T;
  provider: ProviderName;
  modelId: string;
  fallback: boolean;
};

export type WithFallbackOptions = {
  /** Override the provider chain (tests and special callers). */
  chain?: ProviderEntry[];
  /** Override the ai_log writer. */
  log?: (entry: AiLogEntry) => Promise<void>;
  /** Backoff before retrying a 5xx on the same provider. */
  retryDelayMs?: number;
};

const COOLDOWN_MS = 60_000;

/** Name -> epoch millis when the cooldown ends. */
const cooldowns = new Map<ProviderName, number>();

export function markCooldown(name: ProviderName, ms: number): void {
  cooldowns.set(name, Date.now() + ms);
}

export function isCooldownActive(name: ProviderName): boolean {
  const until = cooldowns.get(name);
  if (until === undefined) return false;
  if (Date.now() < until) return true;
  cooldowns.delete(name);
  return false;
}

export function resetCooldowns(): void {
  cooldowns.clear();
}

export class AllProvidersFailed extends Error {
  readonly causes: ErrorKind[];
  readonly lastError: unknown;

  constructor(causes: ErrorKind[], lastError?: unknown) {
    super(
      `All AI providers failed (${causes.join(", ") || "no provider configured"})`,
    );
    this.name = "AllProvidersFailed";
    this.causes = causes;
    this.lastError = lastError;
  }
}

function asRecord(error: unknown): Record<string, unknown> {
  return typeof error === "object" && error !== null
    ? (error as Record<string, unknown>)
    : {};
}

/**
 * Maps provider and SDK errors to the routing categories used by the fallback
 * chain. Safety blocks must never fall through to another provider.
 */
export function classifyError(error: unknown): ErrorKind {
  const e = asRecord(error);
  const name = typeof e.name === "string" ? e.name : "";
  const message =
    typeof e.message === "string"
      ? e.message
      : typeof error === "string"
        ? error
        : "";
  const finishReason = typeof e.finishReason === "string" ? e.finishReason : "";
  const status =
    typeof e.status === "number"
      ? e.status
      : typeof e.statusCode === "number"
        ? e.statusCode
        : undefined;

  if (
    /content-filter|content_filter/i.test(finishReason) ||
    /\bSAFETY\b|safety block|content[- ]filter/i.test(message)
  ) {
    return "safety";
  }

  if (
    name === "AbortError" ||
    name === "TimeoutError" ||
    /timed? ?out|aborted|timeout/i.test(message)
  ) {
    return "timeout";
  }

  if (
    name === "ZodError" ||
    name === "AI_NoObjectGeneratedError" ||
    name === "NoObjectGeneratedError" ||
    name === "AI_JSONParseError" ||
    /no object generated|invalid json|did not match (the )?schema/i.test(
      message,
    )
  ) {
    return "invalid";
  }

  if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|rate.?limit|quota|too many requests/i.test(message)
  ) {
    return "quota";
  }

  if (
    (status !== undefined && status >= 500) ||
    /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|fetch failed|network error/i.test(
      message,
    )
  ) {
    return "server";
  }

  // AI SDK wraps retried attempts in a RetryError that keeps the inner errors.
  if (Array.isArray(e.errors) && e.errors.length > 0) {
    const inner = e.errors[e.errors.length - 1];
    const kind = classifyError(inner);
    if (kind !== "unknown") return kind;
  }

  return "unknown";
}

class ProviderTimeoutError extends Error {
  constructor(ms: number) {
    super(`AI provider timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ProviderTimeoutError(timeoutMs)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function writeLog(
  log: (entry: AiLogEntry) => Promise<void>,
  entry: AiLogEntry,
): Promise<void> {
  try {
    await log(entry);
  } catch (error) {
    console.error("ai log writer failed:", error);
  }
}

/**
 * Runs a task against the provider chain: gemini -> groq -> alt.
 *
 * - quota (429) marks the provider in cooldown and moves on immediately
 * - server (5xx/network) retries once on the same provider, then moves on
 * - timeout and invalid output move on
 * - safety blocks are rethrown and never retried or switched
 */
export async function withFallback<T>(
  task: AiTask,
  run: (provider: ProviderEntry) => Promise<T>,
  opts: WithFallbackOptions = {},
): Promise<WithFallbackResult<T>> {
  const chain = opts.chain ?? getProviderChain(task);
  const log = opts.log ?? logAi;
  const retryDelayMs = opts.retryDelayMs ?? 500;
  const causes: ErrorKind[] = [];
  let lastError: unknown;

  if (chain.length === 0) {
    throw new AllProvidersFailed([], new Error("No AI provider configured"));
  }

  for (const [index, provider] of chain.entries()) {
    let attempt = 0;

    for (;;) {
      const startedAt = Date.now();

      try {
        const result = await withTimeout(run(provider), provider.timeoutMs);
        await writeLog(log, {
          task,
          provider: provider.name,
          modelId: provider.modelId,
          status: "ok",
          latencyMs: Date.now() - startedAt,
        });
        return {
          result,
          provider: provider.name,
          modelId: provider.modelId,
          fallback: index > 0,
        };
      } catch (error) {
        lastError = error;
        const kind = classifyError(error);
        await writeLog(log, {
          task,
          provider: provider.name,
          modelId: provider.modelId,
          status: "error",
          latencyMs: Date.now() - startedAt,
          errorKind: kind,
        });

        if (kind === "safety") throw error;

        if (kind === "quota") {
          markCooldown(provider.name, COOLDOWN_MS);
          causes.push(kind);
          break;
        }

        if (kind === "server" && attempt === 0) {
          attempt += 1;
          if (retryDelayMs > 0) await sleep(retryDelayMs);
          continue;
        }

        causes.push(kind);
        break;
      }
    }
  }

  throw new AllProvidersFailed(causes, lastError);
}
