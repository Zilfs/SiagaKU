import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import { checkRateLimit, limitRequest } from "@/lib/rate-limit";
import { UploadPhotoSchema, type UploadPhotoInput } from "@/features/report/schemas";
import { createPhotoUploadUrl } from "@/features/report/server/report-repository";

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadUrlDeps = {
  rateLimit?: typeof checkRateLimit;
  createSignedUrl?: (
    path: string,
  ) => Promise<{ signedUrl: string; token?: string }>;
  uuid?: () => string;
  now?: () => Date;
};

/** POST /api/reports/upload-url: a path and a signed PUT URL for one photo. */
export async function handleUploadUrl(
  req: Request,
  deps: UploadUrlDeps = {},
): Promise<Response> {
  let body: UploadPhotoInput;
  try {
    body = await parseJson(req, UploadPhotoSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }

  const limited = await limitRequest(
    req,
    "report",
    env.IP_SALT,
    deps.rateLimit ?? checkRateLimit,
  );
  if (limited) return limited;

  const now = (deps.now ?? (() => new Date()))();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const id = (deps.uuid ?? randomUUID)();
  const path = `${yyyy}/${mm}/${dd}/${id}.${EXTENSION[body.content_type]}`;

  const create = deps.createSignedUrl ?? createPhotoUploadUrl;

  try {
    const signed = await create(path);
    return Response.json({ path, signedUrl: signed.signedUrl, token: signed.token });
  } catch (error) {
    console.error("POST /api/reports/upload-url failed", error);
    return jsonError(
      "UPSTREAM_FAILED",
      "Layanan unggah foto belum siap. Coba lagi nanti.",
      502,
    );
  }
}

export function POST(req: Request): Promise<Response> {
  return handleUploadUrl(req);
}
