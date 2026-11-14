import { createHash, timingSafeEqual } from "node:crypto";
import type { ZodType } from "zod";

export type ErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_FAILED"
  | "INTERNAL";

export function jsonError(
  code: ErrorCode,
  message: string,
  status: number,
): Response {
  return Response.json({ error: { code, message } }, { status });
}

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }

  toResponse(): Response {
    return jsonError(this.code, this.message, this.status);
  }
}

const INVALID = "Data yang dikirim tidak valid.";

export async function parseJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError("INVALID_INPUT", INVALID, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError("INVALID_INPUT", INVALID, 400);
  return parsed.data;
}

/** Constant-time check of `Authorization: Bearer <secret>` (cron and admin routes). */
export function isBearer(req: Request, secret: string): boolean {
  const got = createHash("sha256")
    .update(req.headers.get("authorization") ?? "")
    .digest();
  const want = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(got, want);
}
