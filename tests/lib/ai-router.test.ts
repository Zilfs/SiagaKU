import type { LanguageModel } from "ai";
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AllProvidersFailed,
  classifyError,
  getProviderChain,
  isCooldownActive,
  markCooldown,
  resetCooldowns,
  withFallback,
  type AiLogEntry,
  type ProviderEntry,
} from "@/lib/ai/router";
import type { Env } from "@/lib/env";

function entry(name: ProviderEntry["name"], timeoutMs = 50): ProviderEntry {
  return {
    name,
    modelId: `${name}-model`,
    model: {} as LanguageModel,
    timeoutMs,
  };
}

function logSpy() {
  const entries: AiLogEntry[] = [];
  return {
    entries,
    log: async (e: AiLogEntry) => {
      entries.push(e);
    },
  };
}

afterEach(() => {
  resetCooldowns();
});

describe("classifyError", () => {
  it("maps HTTP 429 to quota", () => {
    expect(classifyError({ status: 429 })).toBe("quota");
  });

  it("maps RESOURCE_EXHAUSTED message to quota", () => {
    expect(classifyError(new Error("RESOURCE_EXHAUSTED: quota"))).toBe("quota");
  });

  it("maps 5xx and network errors to server", () => {
    expect(classifyError({ statusCode: 503 })).toBe("server");
    expect(classifyError(new Error("read ECONNRESET"))).toBe("server");
  });

  it("maps abort and timeout errors to timeout", () => {
    expect(classifyError({ name: "AbortError" })).toBe("timeout");
    expect(classifyError({ name: "TimeoutError" })).toBe("timeout");
  });

  it("maps zod and object-generation errors to invalid", () => {
    expect(classifyError(new ZodError([]))).toBe("invalid");
    expect(classifyError({ name: "AI_NoObjectGeneratedError" })).toBe(
      "invalid",
    );
  });

  it("maps safety blocks to safety", () => {
    expect(classifyError({ finishReason: "content-filter" })).toBe("safety");
    expect(classifyError(new Error("Blocked by SAFETY policy"))).toBe("safety");
  });

  it("falls back to unknown", () => {
    expect(classifyError(new Error("mystery"))).toBe("unknown");
  });
});

describe("withFallback", () => {
  it("succeeds on the first provider with fallback=false", async () => {
    const { entries, log } = logSpy();
    const result = await withFallback(
      "penjelasan",
      async (p) => `ok:${p.name}`,
      { chain: [entry("gemini"), entry("groq")], log },
    );

    expect(result).toMatchObject({
      result: "ok:gemini",
      provider: "gemini",
      modelId: "gemini-model",
      fallback: false,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ provider: "gemini", status: "ok" });
  });

  it("moves to groq on 429 and puts gemini in cooldown", async () => {
    const { log } = logSpy();
    const gemini = entry("gemini");
    const groq = entry("groq");
    const run = vi.fn(async (p: ProviderEntry) => {
      if (p.name === "gemini") throw { status: 429 };
      return "groq-answer";
    });

    const result = await withFallback("chat", run, {
      chain: [gemini, groq],
      log,
    });

    expect(result.result).toBe("groq-answer");
    expect(result.provider).toBe("groq");
    expect(result.fallback).toBe(true);
    expect(run).toHaveBeenCalledTimes(2);
    expect(isCooldownActive("gemini")).toBe(true);
  });

  it("retries once on 5xx within the same provider, then moves on", async () => {
    const { log } = logSpy();
    const run = vi.fn(async (p: ProviderEntry) => {
      if (p.name === "gemini") throw { status: 500 };
      return "groq-answer";
    });

    const result = await withFallback("rencana", run, {
      chain: [entry("gemini"), entry("groq")],
      log,
      retryDelayMs: 0,
    });

    expect(result.provider).toBe("groq");
    expect(run.mock.calls.filter(([p]) => p.name === "gemini")).toHaveLength(2);
  });

  it("moves on when the provider times out", async () => {
    const { log } = logSpy();
    const slow = new Promise<string>(() => {});
    const run = vi.fn(async (p: ProviderEntry) => {
      if (p.name === "gemini") return slow;
      return "groq-answer";
    });

    const result = await withFallback("chat", run, {
      chain: [entry("gemini", 5), entry("groq")],
      log,
    });

    expect(result.provider).toBe("groq");
    expect(result.fallback).toBe(true);
  });

  it("treats zod output errors as invalid and moves on", async () => {
    const { log } = logSpy();
    const run = vi.fn(async (p: ProviderEntry) => {
      if (p.name === "gemini") throw new ZodError([]);
      return "groq-answer";
    });

    const result = await withFallback("rencana", run, {
      chain: [entry("gemini"), entry("groq")],
      log,
    });

    expect(result.provider).toBe("groq");
  });

  it("throws immediately on a safety block without trying groq", async () => {
    const { log } = logSpy();
    const safety = { finishReason: "content-filter" };
    const run = vi.fn(async () => {
      throw safety;
    });

    await expect(
      withFallback("chat", run, {
        chain: [entry("gemini"), entry("groq")],
        log,
      }),
    ).rejects.toBe(safety);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("throws AllProvidersFailed with every cause when all fail", async () => {
    const { log } = logSpy();
    const run = vi.fn(async (p: ProviderEntry) => {
      if (p.name === "gemini") throw { status: 429 };
      if (p.name === "groq") throw { status: 500 };
      return new Promise<string>(() => {});
    });

    const promise = withFallback("chat", run, {
      chain: [entry("gemini"), entry("groq"), entry("alt", 5)],
      log,
      retryDelayMs: 0,
    });

    await expect(promise).rejects.toBeInstanceOf(AllProvidersFailed);
    await promise.catch((err: AllProvidersFailed) => {
      expect(err.causes).toEqual(["quota", "server", "timeout"]);
    });
  });

  it("logs one entry per attempt with ok/error status", async () => {
    const { entries, log } = logSpy();
    const run = vi.fn(async (p: ProviderEntry) => {
      if (p.name === "gemini") throw { status: 429 };
      return "groq-answer";
    });

    await withFallback("chat", run, {
      chain: [entry("gemini"), entry("groq")],
      log,
    });

    expect(entries.map((e) => [e.provider, e.status, e.errorKind])).toEqual([
      ["gemini", "error", "quota"],
      ["groq", "ok", undefined],
    ]);
  });
});

describe("getProviderChain", () => {
  const baseEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    IP_SALT: "salt",
    CRON_SECRET: "cron",
    GEMINI_EMBED_MODEL: "gemini-embedding-001",
    AI_TIMEOUT_MS: 20000,
  } as Env;

  it("skips providers without complete env", () => {
    const chain = getProviderChain("chat", {
      ...baseEnv,
      GEMINI_API_KEY: "g",
      GEMINI_MODEL: "gemini-flash",
    });
    expect(chain.map((p) => p.name)).toEqual(["gemini"]);
  });

  it("orders gemini, groq, then alt and applies the chat timeout", () => {
    const chain = getProviderChain("chat", {
      ...baseEnv,
      GEMINI_API_KEY: "g",
      GEMINI_MODEL: "gemini-flash",
      GROQ_API_KEY: "q",
      GROQ_MODEL: "groq-llama",
      ALT_AI_BASE_URL: "https://alt.example.com/v1",
      ALT_AI_API_KEY: "a",
      ALT_AI_MODEL: "alt-model",
    });

    expect(chain.map((p) => p.name)).toEqual(["gemini", "groq", "alt"]);
    expect(chain.every((p) => p.timeoutMs === 8000)).toBe(true);
  });

  it("needs GROQ_VISION_MODEL for vision tasks", () => {
    const textOnly = getProviderChain("vision", {
      ...baseEnv,
      GROQ_API_KEY: "q",
      GROQ_MODEL: "groq-llama",
    });
    expect(textOnly.map((p) => p.name)).toEqual([]);

    const withVision = getProviderChain("vision", {
      ...baseEnv,
      GROQ_API_KEY: "q",
      GROQ_MODEL: "groq-llama",
      GROQ_VISION_MODEL: "groq-vision",
    });
    expect(withVision.map((p) => p.name)).toEqual(["groq"]);
    expect(withVision[0].modelId).toBe("groq-vision");
  });

  it("omits providers in cooldown", () => {
    markCooldown("gemini", 60_000);
    const chain = getProviderChain("penjelasan", {
      ...baseEnv,
      GEMINI_API_KEY: "g",
      GEMINI_MODEL: "gemini-flash",
      GROQ_API_KEY: "q",
      GROQ_MODEL: "groq-llama",
    });
    expect(chain.map((p) => p.name)).toEqual(["groq"]);
  });
});
