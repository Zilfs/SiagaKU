import "server-only";
import { createHash } from "node:crypto";
import { supabaseServer } from "@/lib/db/client";

export type Bucket = "chat" | "plan" | "report" | "explanation";

/** Requests allowed per window, per IP (docs/07 API Spec). */
export const RATE_LIMITS: Record<Bucket, { limit: number; windowSec: number }> =
  {
    chat: { limit: 20, windowSec: 600 },
    plan: { limit: 5, windowSec: 600 },
    report: { limit: 5, windowSec: 3600 },
    explanation: { limit: 30, windowSec: 600 },
  };

export function getClientIp(req: Request): string {
  const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || "0.0.0.0";
}

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export interface RateStore {
  /** Atomically increments the counter for this window and returns the new count. */
  hit(ipHash: string, bucket: Bucket, windowStart: Date): Promise<number>;
}

export function memoryRateStore(): RateStore {
  const counts = new Map<string, number>();
  return {
    async hit(ipHash, bucket, windowStart) {
      const key = `${ipHash}|${bucket}|${windowStart.toISOString()}`;
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return n;
    },
  };
}

// shortcut: old rate_limits rows are never deleted; add a cleanup cron if the table grows.
export function supabaseRateStore(): RateStore {
  return {
    async hit(ipHash, bucket, windowStart) {
      const { data, error } = await supabaseServer().rpc("hit_rate_limit", {
        p_ip_hash: ipHash,
        p_bucket: bucket,
        p_window_start: windowStart.toISOString(),
      });
      if (error) throw error;
      return data as number;
    },
  };
}

let defaultStore: RateStore | undefined;

/** Fixed window: window_start = floor(now / windowSec) * windowSec. */
export async function checkRateLimit(
  ipHash: string,
  bucket: Bucket,
  limit: number,
  windowSec: number,
  store?: RateStore,
  now: () => Date = () => new Date(),
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const nowSec = now().getTime() / 1000;
  const startSec = Math.floor(nowSec / windowSec) * windowSec;
  let count: number;
  try {
    count = await (store ?? (defaultStore ??= supabaseRateStore())).hit(
      ipHash,
      bucket,
      new Date(startSec * 1000),
    );
  } catch (e) {
    console.error("rate limit store failed", bucket, e); // fail open: never block users on a DB error
    return { ok: true, retryAfterSec: 0 };
  }
  if (count <= limit) return { ok: true, retryAfterSec: 0 };
  return { ok: false, retryAfterSec: Math.ceil(startSec + windowSec - nowSec) };
}
