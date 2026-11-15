import "server-only";
import { getBmkgForecast, type BmkgForecast } from "@/lib/data/bmkg";
import {
  evaluateEarlyWarning,
  notificationText,
  shouldSendPush,
  type Evaluation,
} from "../evaluate";
import type {
  EarlyWarningResponse,
  PushSubscriptionRow,
  StoredStatus,
  Subdistrict,
} from "../types";
import * as repo from "./early-warning-repository";
import { sendPush, type SendPush } from "./notify";

const FRESH_MS = 3_600_000;
const MAX_PER_RUN = 50;
const TOP_VULNERABLE = 10;
const CONCURRENCY = 5;

type Forecast = (code: string) => Promise<{ data: BmkgForecast | null }>;

export type EarlyWarningDeps = {
  repo?: Partial<typeof repo>;
  forecast?: Forecast;
  sendPush?: SendPush;
  now?: () => Date;
};

function resolve(deps: EarlyWarningDeps) {
  return {
    r: { ...repo, ...deps.repo },
    forecast: deps.forecast ?? ((code: string) => getBmkgForecast(code)),
    push: deps.sendPush ?? sendPush,
    now: deps.now ?? (() => new Date()),
  };
}

function toResponse(
  s: Subdistrict,
  status: StoredStatus,
  stale: boolean,
): EarlyWarningResponse {
  return {
    subdistrict: {
      code: s.code,
      name: s.name,
      districtSlug: s.district.slug,
      districtName: s.district.name,
    },
    status: status.status,
    score: status.score,
    rainfall24hMm: status.rainfall24hMm,
    rainfallCategory: status.rainfallCategory,
    window: status.window,
    evaluatedAt: status.evaluatedAt,
    stale,
    source: "BMKG",
  };
}

/** Fetches BMKG, evaluates and stores the status. Returns null when BMKG has no data. */
async function evaluateAndStore(
  s: Subdistrict,
  d: ReturnType<typeof resolve>,
): Promise<StoredStatus | null> {
  const { data } = await d.forecast(s.code);
  if (!data) return null;
  const at = d.now();
  const e: Evaluation = evaluateEarlyWarning({
    baseVulnerability: s.district.baseVulnerability,
    floodProne: s.floodProne,
    slots: data.slots,
    now: at,
  });
  await d.r.upsertStatus(s.code, e, at);
  return { ...e, evaluatedAt: at.toISOString() };
}

/**
 * Status of one subdistrict (docs/07): the stored status when evaluated within the hour,
 * otherwise an on-demand evaluation; a stale stored status beats no answer when BMKG fails.
 * Returns null for an unknown code; throws when there is nothing to show.
 */
export async function getEarlyWarning(
  code: string,
  deps: EarlyWarningDeps = {},
): Promise<EarlyWarningResponse | null> {
  const d = resolve(deps);
  const s = await d.r.findSubdistrict(code);
  if (!s) return null;

  const stored = await d.r.getStatus(code);
  if (
    stored &&
    d.now().getTime() - new Date(stored.evaluatedAt).getTime() < FRESH_MS
  ) {
    return toResponse(s, stored, false);
  }

  const fresh = await evaluateAndStore(s, d);
  if (fresh) return toResponse(s, fresh, false);
  if (stored) return toResponse(s, stored, true);
  throw new Error(`no BMKG forecast for ${code}`);
}

async function inBatches<T>(
  items: T[],
  size: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(task));
  }
}

export type CronSummary = {
  evaluated: number;
  sent: number;
  removed: number;
  failed: number;
  durationMs: number;
};

/**
 * Hourly cron (docs/06 §7): subscribed subdistricts plus the most vulnerable ones (max 50),
 * evaluated 5 at a time; push follows the dedupe rule and 404/410 subscriptions are removed.
 */
export async function runEarlyWarningCron(
  deps: EarlyWarningDeps = {},
): Promise<CronSummary> {
  const d = resolve(deps);
  const started = Date.now();

  const subscriptions = await d.r.listSubscriptions();
  const byCode = new Map<string, PushSubscriptionRow[]>();
  for (const sub of subscriptions) {
    byCode.set(sub.subdistrictCode, [
      ...(byCode.get(sub.subdistrictCode) ?? []),
      sub,
    ]);
  }
  const top = await d.r.listMostVulnerableCodes(TOP_VULNERABLE);
  const codes = [...new Set([...byCode.keys(), ...top])].slice(0, MAX_PER_RUN);
  const subdistricts = await d.r.findSubdistricts(codes);

  const summary = { evaluated: 0, sent: 0, removed: 0, failed: 0 };

  await inBatches(subdistricts, CONCURRENCY, async (s) => {
    let status: StoredStatus | null;
    try {
      status = await evaluateAndStore(s, d);
    } catch (error) {
      console.error("early warning evaluation failed", s.code, error);
      status = null;
    }
    if (!status) {
      summary.failed += 1;
      return;
    }
    summary.evaluated += 1;

    const text = notificationText(s.name, status);
    for (const sub of byCode.get(s.code) ?? []) {
      const at = d.now();
      const send = shouldSendPush({
        status: status.status,
        lastSentAt: sub.lastSentAt ? new Date(sub.lastSentAt) : null,
        lastStatus: sub.lastStatus,
        now: at,
      });
      if (!send) continue;
      const result = await d.push(sub, {
        ...text,
        url: `/wilayah/${s.district.slug}`,
      });
      try {
        if (result === "ok") {
          await d.r.markSent(sub.endpoint, status.status, at);
          summary.sent += 1;
        } else if (result === "gone") {
          await d.r.deleteSubscription(sub.endpoint);
          summary.removed += 1;
        }
      } catch (error) {
        console.error("push bookkeeping failed", s.code, error);
      }
    }
  });

  const result = { ...summary, durationMs: Date.now() - started };
  console.log("early warning cron", result);
  return result;
}
