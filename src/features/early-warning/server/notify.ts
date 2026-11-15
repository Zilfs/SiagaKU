import "server-only";
import webpush from "web-push";
import { env } from "@/lib/env";

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url: string };
export type PushResult = "ok" | "gone" | "error";
export type SendPush = (
  target: PushTarget,
  payload: PushPayload,
) => Promise<PushResult>;

/** Push works only when all three VAPID values are set; otherwise the push routes return 503. */
export function pushConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    env.VAPID_PRIVATE_KEY &&
    env.VAPID_SUBJECT,
  );
}

let vapidSet = false;

export const sendPush: SendPush = async (target, payload) => {
  if (!pushConfigured()) return "error";
  if (!vapidSet) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT!,
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      env.VAPID_PRIVATE_KEY!,
    );
    vapidSet = true;
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 3600 },
    );
    return "ok";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    // 404/410: the browser dropped the subscription, so the row can go.
    if (status === 404 || status === 410) return "gone";
    console.error("push send failed", status ?? error);
    return "error";
  }
};
