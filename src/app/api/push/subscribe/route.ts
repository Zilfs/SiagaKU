import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import { checkRateLimit, limitRequest } from "@/lib/rate-limit";
import { SubscribeRequestSchema } from "@/features/early-warning/schemas";
import {
  findSubdistrict,
  saveSubscription,
} from "@/features/early-warning/server/early-warning-repository";
import { pushConfigured } from "@/features/early-warning/server/notify";

export type SubscribeDeps = {
  configured?: () => boolean;
  rateLimit?: typeof checkRateLimit;
  findSubdistrict?: typeof findSubdistrict;
  save?: typeof saveSubscription;
};

/** POST /api/push/subscribe: upsert by endpoint (docs/07). */
export async function handleSubscribe(
  req: Request,
  deps: SubscribeDeps = {},
): Promise<Response> {
  if (!(deps.configured ?? pushConfigured)()) {
    return jsonError("UPSTREAM_FAILED", "Notifikasi belum tersedia.", 503);
  }
  let body;
  try {
    body = await parseJson(req, SubscribeRequestSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }

  const limited = await limitRequest(
    req,
    "push_subscribe",
    env.IP_SALT,
    deps.rateLimit,
  );
  if (limited) return limited;

  try {
    const subdistrict = await (deps.findSubdistrict ?? findSubdistrict)(
      body.subdistrictCode,
    );
    if (!subdistrict) {
      return jsonError("INVALID_INPUT", "Kelurahan tidak ditemukan.", 400);
    }
    await (deps.save ?? saveSubscription)({
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
      subdistrictCode: body.subdistrictCode,
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/push/subscribe failed", error);
    return jsonError("INTERNAL", "Langganan notifikasi gagal disimpan.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handleSubscribe(req);
}
