import { supabaseServer } from "@/lib/db/client";

export interface CacheStore {
  get(key: string): Promise<{ value: unknown; expiresAt: Date } | null>;
  set(key: string, value: unknown, expiresAt: Date): Promise<void>;
}

export function memoryCacheStore(): CacheStore {
  const m = new Map<string, { value: unknown; expiresAt: Date }>();
  return {
    get: async (key) => m.get(key) ?? null,
    set: async (key, value, expiresAt) => {
      m.set(key, { value, expiresAt });
    },
  };
}

export function supabaseCacheStore(): CacheStore {
  return {
    async get(key) {
      const { data, error } = await supabaseServer()
        .from("cache_kv")
        .select("value, expires_at")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data
        ? { value: data.value, expiresAt: new Date(data.expires_at) }
        : null;
    },
    async set(key, value, expiresAt) {
      const { error } = await supabaseServer()
        .from("cache_kv")
        .upsert({ key, value, expires_at: expiresAt.toISOString() });
      if (error) throw error;
    },
  };
}

let defaultStore: CacheStore | undefined;

export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
  store?: CacheStore,
  now: () => Date = () => new Date(),
): Promise<{ value: T; stale: boolean }> {
  const s = store ?? (defaultStore ??= supabaseCacheStore());
  let entry: Awaited<ReturnType<CacheStore["get"]>> = null;
  try {
    entry = await s.get(key);
  } catch (e) {
    console.error("cache get failed", key, e); // a cache failure is a miss
  }
  if (entry && entry.expiresAt > now()) {
    return { value: entry.value as T, stale: false };
  }
  let value: T;
  try {
    value = await fn();
  } catch (e) {
    if (entry) return { value: entry.value as T, stale: true };
    throw e;
  }
  try {
    await s.set(key, value, new Date(now().getTime() + ttlSeconds * 1000));
  } catch (e) {
    console.error("cache set failed", key, e); // never fail the request
  }
  return { value, stale: false };
}
