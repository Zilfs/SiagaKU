import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import { checkRateLimit, limitRequest } from "@/lib/rate-limit";
import { EndpointRequestSchema } from "@/features/early-warning/schemas";
import {
  deleteSubscription,
  findSubdistrict,
  findSubscription,
} from "@/features/early-warning/server/early-warning-repository";
import {
  pushConfigured,
  sendPush,
} from "@/features/early-warning/server/notify";

export type TestPushDeps = {
  configured?: () => boolean;
  rateLimit?: typeof checkRateLimit;
  findSubscription?: typeof findSubscription;
  findSubdistrict?: typeof findSubdistrict;
  remove?: typeof deleteSubscription;
  send?: typeof sendPush;
};

/** POST /api/push/test: sample notification to a registered endpoint (docs/07). */
export async function handleTestPush(
  req: Request,
  deps: TestPushDeps = {},
): Promise<Response> {
  if (!(deps.configured ?? pushConfigured)()) {
    return jsonError("UPSTREAM_FAILED", "Notifikasi belum tersedia.", 503);
  }
  let body;
  try {
    body = await parseJson(req, EndpointRequestSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }

  const limited = await limitRequest(
    req,
    "push_test",
    env.IP_SALT,
    deps.rateLimit,
  );
  if (limited) return limited;

  try {
    const sub = await (deps.findSubscription ?? findSubscription)(
      body.endpoint,
    );
    if (!sub) {
      return jsonError("NOT_FOUND", "Perangkat ini belum terdaftar.", 404);
    }
    const subdistrict = await (deps.findSubdistrict ?? findSubdistrict)(
      sub.subdistrictCode,
    );
    const name = subdistrict?.name ?? "wilayahmu";
    const result = await (deps.send ?? sendPush)(sub, {
      title: "🔔 Notifikasi uji SiagaKU",
      body: `Peringatan banjir untuk ${name} sudah aktif. Contoh: ⚠️ Potensi banjir, hujan lebat diperkirakan 15.00–18.00 WIB.`,
      url: subdistrict
        ? `/wilayah/${subdistrict.district.slug}`
        : "/peringatan",
    });
    if (result === "gone") {
      await (deps.remove ?? deleteSubscription)(sub.endpoint);
      return jsonError(
        "NOT_FOUND",
        "Langganan di perangkat ini sudah kedaluwarsa. Aktifkan lagi.",
        404,
      );
    }
    if (result === "error") {
      return jsonError("UPSTREAM_FAILED", "Notifikasi uji gagal dikirim.", 502);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/push/test failed", error);
    return jsonError("INTERNAL", "Notifikasi uji gagal dikirim.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handleTestPush(req);
}
