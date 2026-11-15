import { createUIMessageStreamResponse } from "ai";
import {
  createChatStream,
  type ChatDeps,
} from "@/features/chat/server/chat-service";
import type { AreaContext } from "@/features/chat/server/rag/retrieve";
import { ChatRequestSchema, type ChatRequest } from "@/features/chat/schemas";
import { getRiskDetail } from "@/features/risk/server/risk-service";
import { env } from "@/lib/env";
import { HttpError, jsonError, parseJson } from "@/lib/http";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  hashIp,
} from "@/lib/rate-limit";
import { RISK_LEVEL_LABELS } from "@/lib/risk/level";

export type ChatHandlerDeps = {
  chat?: Partial<ChatDeps>;
  rateLimit?: typeof checkRateLimit;
};

/** District context line for the prompt (docs/05 §3.3). */
async function loadAreaContext(
  districtId: number,
): Promise<AreaContext | null> {
  const detail = await getRiskDetail(String(districtId));
  if (!detail) return null;
  return {
    name: detail.district.name,
    level: RISK_LEVEL_LABELS[detail.level],
    score: detail.score,
  };
}

export async function handleChat(
  req: Request,
  deps: ChatHandlerDeps = {},
): Promise<Response> {
  let body: ChatRequest;
  try {
    body = await parseJson(req, ChatRequestSchema);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    throw error;
  }

  const { limit, windowSec } = RATE_LIMITS.chat;
  const checkLimit = deps.rateLimit ?? checkRateLimit;
  const rl = await checkLimit(
    hashIp(getClientIp(req), env.IP_SALT),
    "chat",
    limit,
    windowSec,
  );
  if (!rl.ok) {
    const res = jsonError(
      "RATE_LIMITED",
      "Terlalu banyak permintaan, coba lagi beberapa menit lagi.",
      429,
    );
    res.headers.set("Retry-After", String(rl.retryAfterSec));
    return res;
  }

  try {
    const stream = createChatStream(
      { messages: body.messages, districtId: body.kecamatan_id },
      { areaContext: loadAreaContext, ...deps.chat, signal: req.signal },
    );
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("POST /api/chat failed", error);
    return jsonError("INTERNAL", "Gagal memproses pertanyaan.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handleChat(req);
}
