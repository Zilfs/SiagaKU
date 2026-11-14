import { describe, expect, it } from "vitest";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  hashIp,
  memoryRateStore,
  type RateStore,
} from "@/lib/rate-limit";

const at = (iso: string) => () => new Date(iso);

describe("getClientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to 0.0.0.0", () => {
    expect(getClientIp(new Request("http://x"))).toBe("0.0.0.0");
  });
});

describe("hashIp", () => {
  it("is a deterministic sha256 hex", () => {
    expect(hashIp("1.2.3.4", "s1")).toBe(hashIp("1.2.3.4", "s1"));
    expect(hashIp("1.2.3.4", "s1")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for a different salt", () => {
    expect(hashIp("1.2.3.4", "s1")).not.toBe(hashIp("1.2.3.4", "s2"));
  });
});

describe("checkRateLimit", () => {
  const { limit, windowSec } = RATE_LIMITS.chat;

  it("blocks the 21st chat request in a window", async () => {
    const store = memoryRateStore();
    const now = at("2026-11-14T10:01:00Z");
    for (let i = 0; i < limit; i++) {
      const r = await checkRateLimit("h", "chat", limit, windowSec, store, now);
      expect(r.ok).toBe(true);
    }
    const r = await checkRateLimit("h", "chat", limit, windowSec, store, now);
    expect(r.ok).toBe(false);
    // window 10:00–10:10, now 10:01 -> 540 s left
    expect(r.retryAfterSec).toBe(540);
  });

  it("allows requests again in the next window", async () => {
    const store = memoryRateStore();
    const t1 = at("2026-11-14T10:01:00Z");
    for (let i = 0; i <= limit; i++) {
      await checkRateLimit("h", "chat", limit, windowSec, store, t1);
    }
    const r = await checkRateLimit(
      "h",
      "chat",
      limit,
      windowSec,
      store,
      at("2026-11-14T10:10:00Z"),
    );
    expect(r).toEqual({ ok: true, retryAfterSec: 0 });
  });

  it("counts buckets and ip hashes separately", async () => {
    const store = memoryRateStore();
    const now = at("2026-11-14T10:01:00Z");
    await checkRateLimit("h", "plan", 1, 600, store, now);
    expect((await checkRateLimit("h", "plan", 1, 600, store, now)).ok).toBe(
      false,
    );
    expect((await checkRateLimit("h", "chat", 1, 600, store, now)).ok).toBe(
      true,
    );
    expect((await checkRateLimit("h2", "plan", 1, 600, store, now)).ok).toBe(
      true,
    );
  });

  it("fails open when the store throws", async () => {
    const broken: RateStore = {
      hit: async () => {
        throw new Error("db down");
      },
    };
    const r = await checkRateLimit("h", "chat", 20, 600, broken);
    expect(r).toEqual({ ok: true, retryAfterSec: 0 });
  });
});
