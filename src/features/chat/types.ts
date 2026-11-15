import type { ProviderName } from "@/lib/ai/router";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/** Source sent to the client: no chunk text, only citation metadata. */
export type ChatSource = {
  n: number;
  chunkId: number;
  title: string;
  publisher: string;
  page: number | null;
  url: string;
};

export type ChatMeta = {
  provider: ProviderName | "template";
  model: string | null;
  fallback: boolean;
  cached: boolean;
};

/** Data parts written by POST /api/chat (AI SDK data part payloads). */
export type ChatDataParts = {
  emergency: { active: boolean };
  sources: { items: ChatSource[] };
  meta: ChatMeta;
};
