import "server-only";
import { createHash } from "node:crypto";
import {
  createUIMessageStream,
  streamText,
  type TextStreamPart,
  type ToolSet,
  type UIMessageChunk,
} from "ai";
import { withFallback, type ProviderName } from "@/lib/ai/router";
import { supabaseCacheStore, type CacheStore } from "@/lib/data/cache";
import { detectEmergency } from "../detect-emergency";
import { CachedChatAnswerSchema, type CachedChatAnswer } from "../schemas";
import type { ChatMessage, ChatSource } from "../types";
import { buildChatSystem } from "./chat-prompt";
import {
  retrieve as retrieveChunks,
  type AreaContext,
  type RetrievalResult,
  type Source,
} from "./rag/retrieve";

export const CHAT_FALLBACK_TEXT =
  "Maaf, SiagaKU sedang sibuk. Coba lagi beberapa saat lagi. Jika kamu dalam bahaya, segera hubungi 112.";

const CACHE_TTL_SECONDS = 86_400;
const RETRIEVAL_K = 5;
const TEXT_ID = "answer";

export type ChatInput = {
  messages: ChatMessage[];
  districtId?: number;
};

export type GeneratedChat = {
  provider: ProviderName;
  modelId: string;
  fallback: boolean;
  text: AsyncIterable<string>;
};

export type ChatGenerator = (input: {
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}) => Promise<GeneratedChat>;

export type ChatDeps = {
  retrieve?: (query: string, k?: number) => Promise<RetrievalResult>;
  areaContext?: (districtId: number) => Promise<AreaContext | null>;
  generate?: ChatGenerator;
  cache?: CacheStore;
  signal?: AbortSignal;
  now?: () => Date;
};

const defaultCache = supabaseCacheStore();

type FullStreamIterator = AsyncIterator<TextStreamPart<ToolSet>>;

function firstTextDelta(
  iterator: FullStreamIterator,
): Promise<{ iterator: FullStreamIterator; first: string }> {
  return (async () => {
    for (;;) {
      const { done, value } = await iterator.next();
      if (done) {
        throw new Error("AI stream ended before the first token");
      }
      if (value.type === "error") throw value.error;
      if (value.type === "abort" || value.type === "finish") {
        throw new Error("AI stream ended before the first token");
      }
      if (value.type === "text-delta" && value.text) {
        return { iterator, first: value.text };
      }
    }
  })();
}

async function* readRest(
  iterator: FullStreamIterator,
  first: string,
): AsyncIterable<string> {
  yield first;
  for (;;) {
    const { done, value } = await iterator.next();
    if (done) return;
    if (value.type === "error") throw value.error;
    if (value.type === "abort") return;
    if (value.type === "text-delta" && value.text) yield value.text;
  }
}

/**
 * Picks the provider before the stream starts: a failure before the first
 * token moves to the next provider, so a dead Gemini key still answers via Groq.
 */
const generateWithProviders: ChatGenerator = async (input) => {
  const { result, provider, modelId, fallback } = await withFallback(
    "chat",
    async (entry) => {
      const result = streamText({
        model: entry.model,
        system: input.system,
        messages: input.messages,
        temperature: 0.3,
        maxRetries: 0,
        abortSignal: input.signal,
      });
      const preflight = await firstTextDelta(
        result.fullStream[Symbol.asyncIterator](),
      );
      return { ...preflight, provider: entry.name, modelId: entry.modelId };
    },
  );

  return {
    provider,
    modelId,
    fallback,
    text: readRest(result.iterator, result.first),
  };
};

function toChatSource(source: Source): ChatSource {
  return {
    n: source.n,
    chunkId: source.chunkId,
    title: source.title,
    publisher: source.publisher,
    page: source.page,
    url: source.url,
  };
}

function cacheKey(text: string): string {
  const normalized = text.trim().toLowerCase();
  return `ai:chat:${createHash("sha256").update(normalized).digest("hex")}`;
}

async function readCache(
  store: CacheStore,
  key: string,
  now: Date,
): Promise<CachedChatAnswer | null> {
  try {
    const entry = await store.get(key);
    if (!entry || entry.expiresAt <= now) return null;
    const parsed = CachedChatAnswerSchema.safeParse(entry.value);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error("chat cache read failed", error);
    return null;
  }
}

async function writeCache(
  store: CacheStore,
  key: string,
  value: CachedChatAnswer,
  now: Date,
): Promise<void> {
  try {
    await store.set(
      key,
      value,
      new Date(now.getTime() + CACHE_TTL_SECONDS * 1000),
    );
  } catch (error) {
    console.error("chat cache write failed", error);
  }
}

function buildQuery(messages: ChatMessage[]): string {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  return userMessages.slice(-2).reverse().join(" ");
}

/**
 * Streams the chat answer as AI SDK UI message chunks (docs/07 API Spec):
 * emergency -> sources -> text -> meta.
 */
export function createChatStream(
  input: ChatInput,
  deps: ChatDeps = {},
): ReadableStream<UIMessageChunk> {
  const retrieve = deps.retrieve ?? retrieveChunks;
  const generate = deps.generate ?? generateWithProviders;
  const store = deps.cache ?? defaultCache;
  const now = deps.now ?? (() => new Date());

  return createUIMessageStream({
    execute: async ({ writer }) => {
      const lastUser = [...input.messages]
        .reverse()
        .find((message) => message.role === "user");
      const emergency = lastUser ? detectEmergency(lastUser.content) : false;

      if (emergency) {
        writer.write({ type: "data-emergency", data: { active: true } });
      }

      const cacheable =
        !emergency &&
        !input.districtId &&
        input.messages.length === 1 &&
        input.messages[0]?.role === "user";
      const key = cacheable
        ? cacheKey(input.messages[0]?.content ?? "")
        : undefined;

      if (key) {
        const cached = await readCache(store, key, now());
        if (cached) {
          writer.write({
            type: "data-sources",
            data: { items: cached.sources },
          });
          writer.write({ type: "text-start", id: TEXT_ID });
          writer.write({
            type: "text-delta",
            id: TEXT_ID,
            delta: cached.text,
          });
          writer.write({ type: "text-end", id: TEXT_ID });
          writer.write({
            type: "data-meta",
            data: {
              provider: cached.provider,
              model: cached.model,
              fallback: cached.fallback,
              cached: true,
            },
          });
          return;
        }
      }

      let sources: Source[] = [];
      try {
        const result = await retrieve(buildQuery(input.messages), RETRIEVAL_K);
        sources = result.sources;
      } catch (error) {
        console.error("chat retrieval failed", error);
      }

      let area: AreaContext | undefined;
      if (input.districtId !== undefined && deps.areaContext) {
        try {
          area = (await deps.areaContext(input.districtId)) ?? undefined;
        } catch (error) {
          console.error("chat area context failed", input.districtId, error);
        }
      }

      writer.write({
        type: "data-sources",
        data: { items: sources.map(toChatSource) },
      });

      let generated: GeneratedChat;
      try {
        generated = await generate({
          system: buildChatSystem(sources, area),
          messages: input.messages,
          signal: deps.signal,
        });
      } catch (error) {
        console.error("chat generation failed", error);
        writer.write({ type: "text-start", id: TEXT_ID });
        writer.write({
          type: "text-delta",
          id: TEXT_ID,
          delta: CHAT_FALLBACK_TEXT,
        });
        writer.write({ type: "text-end", id: TEXT_ID });
        writer.write({
          type: "data-meta",
          data: {
            provider: "template",
            model: null,
            fallback: true,
            cached: false,
          },
        });
        return;
      }

      writer.write({ type: "text-start", id: TEXT_ID });

      let text = "";
      let complete = true;
      try {
        for await (const delta of generated.text) {
          text += delta;
          writer.write({ type: "text-delta", id: TEXT_ID, delta });
        }
      } catch (error) {
        complete = false;
        console.error("chat stream interrupted", error);
        const closing = "\n\nMaaf, jawaban terputus. Silakan coba lagi.";
        text += closing;
        writer.write({ type: "text-delta", id: TEXT_ID, delta: closing });
      }

      writer.write({ type: "text-end", id: TEXT_ID });
      writer.write({
        type: "data-meta",
        data: {
          provider: generated.provider,
          model: generated.modelId,
          fallback: generated.fallback,
          cached: false,
        },
      });

      if (key && complete) {
        await writeCache(
          store,
          key,
          {
            text,
            sources: sources.map(toChatSource),
            provider: generated.provider,
            model: generated.modelId,
            fallback: generated.fallback,
          },
          now(),
        );
      }
    },
  });
}
