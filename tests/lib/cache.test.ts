import { describe, expect, it, vi } from "vitest";
import { getOrSet, memoryCacheStore, type CacheStore } from "@/lib/data/cache";

const t0 = new Date("2026-01-01T00:00:00Z");
const later = new Date("2026-01-01T01:00:00Z");

describe("getOrSet", () => {
  it("cache hit does not call fn", async () => {
    const store = memoryCacheStore();
    await store.set("k", "cached", new Date(t0.getTime() + 60_000));
    const fn = vi.fn(async () => "new");
    const r = await getOrSet("k", 60, fn, store, () => t0);
    expect(r).toEqual({ value: "cached", stale: false });
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it("expired cache calls fn and stores again", async () => {
    const store = memoryCacheStore();
    await store.set("k", "old", t0);
    const fn = vi.fn(async () => "new");
    const r = await getOrSet("k", 60, fn, store, () => later);
    expect(r).toEqual({ value: "new", stale: false });
    expect(fn).toHaveBeenCalledTimes(1);
    expect((await store.get("k"))?.expiresAt).toEqual(
      new Date(later.getTime() + 60_000),
    );
  });

  it("fn fails + expired value exists -> returns old value, stale=true", async () => {
    const store = memoryCacheStore();
    await store.set("k", "old", t0);
    const setSpy = vi.spyOn(store, "set");
    const r = await getOrSet(
      "k",
      60,
      async () => {
        throw new Error("x");
      },
      store,
      () => later,
    );
    expect(r).toEqual({ value: "old", stale: true });
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("fn fails + no value -> throws original error", async () => {
    const err = new Error("boom");
    await expect(
      getOrSet(
        "k",
        60,
        async () => {
          throw err;
        },
        memoryCacheStore(),
        () => t0,
      ),
    ).rejects.toBe(err);
  });

  it("store.get throwing is treated as a miss", async () => {
    const store: CacheStore = {
      get: async () => {
        throw new Error("db down");
      },
      set: async () => {},
    };
    const r = await getOrSet(
      "k",
      60,
      async () => "v",
      store,
      () => t0,
    );
    expect(r).toEqual({ value: "v", stale: false });
  });

  it("store.set throwing still returns the value and logs", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store: CacheStore = {
      get: async () => null,
      set: async () => {
        throw new Error("write failed");
      },
    };
    const r = await getOrSet(
      "k",
      60,
      async () => "v",
      store,
      () => t0,
    );
    expect(r).toEqual({ value: "v", stale: false });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
