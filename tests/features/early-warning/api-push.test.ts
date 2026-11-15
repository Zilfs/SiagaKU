import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { IP_SALT: "test-salt" } }));

import { handleSubscribe } from "@/app/api/push/subscribe/route";
import { handleTestPush } from "@/app/api/push/test/route";
import { handleUnsubscribe } from "@/app/api/push/unsubscribe/route";
import type {
  PushSubscriptionRow,
  Subdistrict,
} from "@/features/early-warning/types";
import { checkRateLimit, memoryRateStore, type Bucket } from "@/lib/rate-limit";

const CODE = "31.75.10.1004";
const ENDPOINT = "https://push.example.com/abc";

const munjul: Subdistrict = {
  code: CODE,
  name: "Munjul",
  floodProne: false,
  district: {
    id: 40,
    slug: "cipayung",
    name: "Cipayung",
    city: "Jakarta Timur",
    baseVulnerability: 40,
  },
};

const allow = async () => ({ ok: true, retryAfterSec: 0 });

function post(path: string, body: unknown, ip = "1.2.3.4") {
  return new Request(`http://x${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const subscribeBody = (
  code = CODE,
  keys: object = { p256dh: "p", auth: "a" },
) => ({
  subscription: { endpoint: ENDPOINT, keys },
  subdistrictCode: code,
});

/** Upsert-by-endpoint fake of push_subscriptions. */
function memorySubscriptions() {
  const rows = new Map<string, PushSubscriptionRow>();
  return {
    rows,
    save: async (s: {
      endpoint: string;
      p256dh: string;
      auth: string;
      subdistrictCode: string;
    }) => {
      rows.set(s.endpoint, { ...s, lastSentAt: null, lastStatus: null });
    },
    find: async (endpoint: string) => rows.get(endpoint) ?? null,
  };
}

describe("POST /api/push/subscribe", () => {
  const base = {
    configured: () => true,
    rateLimit: allow,
    findSubdistrict: async (code: string) => (code === CODE ? munjul : null),
  };

  it("returns 400 without keys.auth", async () => {
    const store = memorySubscriptions();
    const res = await handleSubscribe(
      post("/api/push/subscribe", subscribeBody(CODE, { p256dh: "p" })),
      { ...base, save: store.save },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 for an unknown subdistrict code", async () => {
    const store = memorySubscriptions();
    const res = await handleSubscribe(
      post("/api/push/subscribe", subscribeBody("31.75.10.1999")),
      { ...base, save: store.save },
    );
    expect(res.status).toBe(400);
    expect(store.rows.size).toBe(0);
  });

  it("keeps one row when the same endpoint subscribes twice, with the newer subdistrict", async () => {
    const store = memorySubscriptions();
    const other = "31.75.10.1005";
    const deps = {
      ...base,
      findSubdistrict: async (code: string) =>
        code === CODE || code === other ? { ...munjul, code } : null,
      save: store.save,
    };
    expect(
      (
        await handleSubscribe(
          post("/api/push/subscribe", subscribeBody()),
          deps,
        )
      ).status,
    ).toBe(201);
    await handleSubscribe(
      post("/api/push/subscribe", subscribeBody(other)),
      deps,
    );
    expect(store.rows.size).toBe(1);
    expect(store.rows.get(ENDPOINT)?.subdistrictCode).toBe(other);
  });

  it("returns 503 when VAPID is not configured", async () => {
    const res = await handleSubscribe(
      post("/api/push/subscribe", subscribeBody()),
      {
        ...base,
        configured: () => false,
      },
    );
    expect(res.status).toBe(503);
  });
});

describe("POST /api/push/test", () => {
  it("returns 404 for an unregistered endpoint", async () => {
    const store = memorySubscriptions();
    const res = await handleTestPush(
      post("/api/push/test", { endpoint: ENDPOINT }),
      {
        configured: () => true,
        rateLimit: allow,
        findSubscription: store.find,
        send: async () => "ok",
      },
    );
    expect(res.status).toBe(404);
  });

  it("sends to a registered endpoint and rate limits the 4th test in 10 minutes", async () => {
    const store = memorySubscriptions();
    await store.save({
      endpoint: ENDPOINT,
      p256dh: "p",
      auth: "a",
      subdistrictCode: CODE,
    });
    const rateStore = memoryRateStore();
    const send = vi.fn(async () => "ok" as const);
    const deps = {
      configured: () => true,
      rateLimit: (h: string, b: Bucket, l: number, w: number) =>
        checkRateLimit(h, b, l, w, rateStore),
      findSubscription: store.find,
      findSubdistrict: async () => munjul,
      send,
    };
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await handleTestPush(
        post("/api/push/test", { endpoint: ENDPOINT }),
        deps,
      );
      statuses.push(res.status);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls[0]).toMatchObject([
      { endpoint: ENDPOINT },
      { title: "🔔 Notifikasi uji SiagaKU", url: "/wilayah/cipayung" },
    ]);
  });

  it("removes an expired subscription when the push service says gone", async () => {
    const store = memorySubscriptions();
    await store.save({
      endpoint: ENDPOINT,
      p256dh: "p",
      auth: "a",
      subdistrictCode: CODE,
    });
    const remove = vi.fn(async () => {});
    const res = await handleTestPush(
      post("/api/push/test", { endpoint: ENDPOINT }),
      {
        configured: () => true,
        rateLimit: allow,
        findSubscription: store.find,
        findSubdistrict: async () => munjul,
        send: async () => "gone",
        remove,
      },
    );
    expect(res.status).toBe(404);
    expect(remove).toHaveBeenCalledWith(ENDPOINT);
  });
});

describe("POST /api/push/unsubscribe", () => {
  it("deletes by endpoint and rejects a non-https endpoint", async () => {
    const remove = vi.fn(async () => {});
    expect(
      (
        await handleUnsubscribe(
          post("/api/push/unsubscribe", { endpoint: ENDPOINT }),
          remove,
        )
      ).status,
    ).toBe(200);
    expect(remove).toHaveBeenCalledWith(ENDPOINT);
    expect(
      (
        await handleUnsubscribe(
          post("/api/push/unsubscribe", { endpoint: "http://x" }),
          remove,
        )
      ).status,
    ).toBe(400);
  });
});
