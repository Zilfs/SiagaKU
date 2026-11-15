import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000),
});

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * `useChat` sends UI messages as `parts: [{ type: "text", text }]`, while
 * docs/07 specifies `content`. Accept both and keep one schema output.
 */
function normalizeMessages(body: unknown): unknown {
  const root = asRecord(body);
  if (!root || !Array.isArray(root.messages)) return body;

  return {
    ...root,
    messages: root.messages.map((message) => {
      const record = asRecord(message);
      if (!record || "content" in record || !Array.isArray(record.parts)) {
        return message;
      }
      const content = record.parts
        .map(asRecord)
        .filter((part): part is Record<string, unknown> => part !== null)
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text as string)
        .join("");
      return { ...record, content };
    }),
  };
}

/** Body of POST /api/chat (docs/07 API Spec). */
export const ChatRequestSchema = z.preprocess(
  normalizeMessages,
  z.object({
    messages: z.array(ChatMessageSchema).min(1).max(10),
    kecamatan_id: z.number().int().positive().optional(),
  }),
);

export type ChatRequest = z.output<typeof ChatRequestSchema>;

export const ChatSourceSchema = z.object({
  n: z.number().int().positive(),
  chunkId: z.number().int().nonnegative(),
  title: z.string(),
  publisher: z.string(),
  page: z.number().int().positive().nullable(),
  url: z.string(),
});

/** Value kept in `ai:chat:{sha256}`. Template answers are never cached. */
export const CachedChatAnswerSchema = z.object({
  text: z.string().min(1),
  sources: z.array(ChatSourceSchema),
  provider: z.enum(["gemini", "groq", "alt"]),
  model: z.string().nullable(),
  fallback: z.boolean(),
});

export type CachedChatAnswer = z.output<typeof CachedChatAnswerSchema>;
