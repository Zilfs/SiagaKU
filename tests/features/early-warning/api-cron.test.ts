import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { CRON_SECRET: "secret" } }));

import { handleCron } from "@/app/api/cron/early-warning/route";
import { handleEarlyWarning } from "@/app/api/early-warning/[code]/route";
import type { EarlyWarningDeps } from "@/features/early-warning/server/run";
import type {
  PushSubscriptionRow,
  StoredStatus,
  Subdistrict,
} from "@/features/early-warning/types";
import type { BmkgForecast } from "@/lib/data/bmkg";

const now = new Date("2026-11-18T09:00:00+07:00");

const sub = (
  code: string,
  name: string,
  vulnerability: number,
): Subdistrict => ({
  code,
  name,
  floodProne: false,
  district: {
    id: 1,
    slug: "jatinegara",
    name: "Jatinegara",
    city: "Jakarta Timur",
    baseVulnerability: vulnerability,
  },
});

const A = sub("31.75.03.1001", "Bidara Cina", 100);
const B = sub("31.75.03.1002", "Kampung Melayu", 100);

/** Heavy rain at 12.00 WIB: watch or warning for a vulnerable subdistrict. */
const heavyRain: BmkgForecast = {
  updatedAt: null,
  slots: [
    {
      localTime: "2026-11-18 12:00:00",
      temperature: 27,
      humidity: 90,
      description: "Hujan Lebat",
      icon: null,
      rainfallMm: 60,
    },
  ],
};

const subscription = (code: string, endpoint: string): PushSubscriptionRow => ({
  endpoint,
  p256dh: "p",
  auth: "a",
  subdistrictCode: code,
  lastSentAt: null,
  lastStatus: null,
});

function deps(overrides: Partial<EarlyWarningDeps> = {}) {
  const subdistricts = [A, B];
  const repo = {
    listSubscriptions: vi.fn(async () => [
      subscription(A.code, "https://push.example.com/a"),
      subscription(B.code, "https://push.example.com/b"),
    ]),
    listMostVulnerableCodes: vi.fn(async () => [A.code]),
    findSubdistricts: vi.fn(async (codes: string[]) =>
      subdistricts.filter((s) => codes.includes(s.code)),
    ),
    findSubdistrict: vi.fn(
      async (code: string) => subdistricts.find((s) => s.code === code) ?? null,
    ),
    getStatus: vi.fn(async (): Promise<StoredStatus | null> => null),
    upsertStatus: vi.fn(async () => {}),
    markSent: vi.fn(async () => {}),
    deleteSubscription: vi.fn(async () => {}),
  };
  return {
    repo,
    deps: {
      repo,
      forecast: async () => ({ data: heavyRain }),
      sendPush: vi.fn(async () => "ok" as const),
      now: () => now,
      ...overrides,
    } satisfies EarlyWarningDeps,
  };
}

const cronRequest = (auth?: string) =>
  new Request("http://x/api/cron/early-warning", {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });

describe("POST /api/cron/early-warning", () => {
  it("returns 401 without the Bearer token", async () => {
    const { deps: d } = deps();
    expect((await handleCron(cronRequest(), d)).status).toBe(401);
    expect((await handleCron(cronRequest("Bearer nope"), d)).status).toBe(401);
  });

  it("evaluates, sends and removes a subscription the push service reports gone", async () => {
    const { deps: d, repo } = deps({
      sendPush: vi.fn(async (target: { endpoint: string }) =>
        target.endpoint.endsWith("/b") ? ("gone" as const) : ("ok" as const),
      ),
    });
    const res = await handleCron(cronRequest("Bearer secret"), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      evaluated: 2,
      sent: 1,
      removed: 1,
      failed: 0,
    });
    expect(repo.deleteSubscription).toHaveBeenCalledWith(
      "https://push.example.com/b",
    );
    expect(repo.markSent).toHaveBeenCalledWith(
      "https://push.example.com/a",
      "warning",
      now,
    );
    expect(repo.upsertStatus).toHaveBeenCalledTimes(2);
  });

  it("keeps processing other subdistricts when BMKG fails for one", async () => {
    const { deps: d, repo } = deps({
      forecast: async (code: string) => {
        if (code === A.code) throw new Error("BMKG 500");
        return { data: heavyRain };
      },
    });
    const body = await (
      await handleCron(cronRequest("Bearer secret"), d)
    ).json();
    expect(body).toMatchObject({ evaluated: 1, failed: 1, sent: 1 });
    expect(repo.upsertStatus).toHaveBeenCalledWith(
      B.code,
      expect.anything(),
      now,
    );
  });

  it("does not push again within 6 hours of the same status", async () => {
    const { deps: d, repo } = deps();
    repo.listSubscriptions.mockResolvedValue([
      {
        ...subscription(A.code, "https://push.example.com/a"),
        lastSentAt: new Date(now.getTime() - 3_600_000).toISOString(),
        lastStatus: "warning",
      },
    ]);
    const body = await (
      await handleCron(cronRequest("Bearer secret"), d)
    ).json();
    expect(body.sent).toBe(0);
    expect(d.sendPush).not.toHaveBeenCalled();
  });
});

describe("GET /api/early-warning/[code]", () => {
  it("rejects a malformed code and 404s an unknown one", async () => {
    const { deps: d } = deps();
    expect((await handleEarlyWarning("abc", d)).status).toBe(400);
    expect((await handleEarlyWarning("31.75.03.1999", d)).status).toBe(404);
  });

  it("uses a status evaluated within the hour without calling BMKG", async () => {
    const forecast = vi.fn(async () => ({ data: heavyRain }));
    const { deps: d, repo } = deps({ forecast });
    repo.getStatus.mockResolvedValue({
      status: "advisory",
      score: 40,
      rainfall24hMm: 12,
      rainfallCategory: "light",
      window: null,
      evaluatedAt: new Date(now.getTime() - 10 * 60_000).toISOString(),
    });
    const body = await (await handleEarlyWarning(A.code, d)).json();
    expect(body).toMatchObject({
      subdistrict: { code: A.code, districtSlug: "jatinegara" },
      status: "advisory",
      stale: false,
    });
    expect(forecast).not.toHaveBeenCalled();
  });

  it("evaluates on demand and returns a stale status when BMKG fails", async () => {
    const { deps: d, repo } = deps();
    const fresh = await (await handleEarlyWarning(A.code, d)).json();
    expect(fresh).toMatchObject({ status: "warning", rainfall24hMm: 60 });
    expect(repo.upsertStatus).toHaveBeenCalledOnce();

    const old = {
      status: "watch" as const,
      score: 60,
      rainfall24hMm: 30,
      rainfallCategory: "moderate" as const,
      window: null,
      evaluatedAt: new Date(now.getTime() - 5 * 3_600_000).toISOString(),
    };
    const failing = deps({ forecast: async () => ({ data: null }) });
    failing.repo.getStatus.mockResolvedValue(old);
    const stale = await (await handleEarlyWarning(A.code, failing.deps)).json();
    expect(stale).toMatchObject({ status: "watch", stale: true });

    const empty = deps({ forecast: async () => ({ data: null }) });
    expect((await handleEarlyWarning(A.code, empty.deps)).status).toBe(502);
  });
});
