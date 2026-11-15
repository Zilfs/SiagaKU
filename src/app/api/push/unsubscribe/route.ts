import { HttpError, jsonError, parseJson } from "@/lib/http";
import { EndpointRequestSchema } from "@/features/early-warning/schemas";
import { deleteSubscription } from "@/features/early-warning/server/early-warning-repository";

/** POST /api/push/unsubscribe: delete by endpoint; an unknown endpoint is not an error. */
export async function handleUnsubscribe(
  req: Request,
  remove: typeof deleteSubscription = deleteSubscription,
): Promise<Response> {
  let body;
  try {
    body = await parseJson(req, EndpointRequestSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }
  try {
    await remove(body.endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/push/unsubscribe failed", error);
    return jsonError("INTERNAL", "Gagal menghentikan notifikasi.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handleUnsubscribe(req);
}
