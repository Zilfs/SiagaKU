import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { createGroq, type GroqProvider } from "@ai-sdk/groq";
import {
  createOpenAICompatible,
  type OpenAICompatibleProvider,
} from "@ai-sdk/openai-compatible";
import type { Env } from "@/lib/env";
import { env } from "@/lib/env";
import { isCooldownActive, type AiTask, type ProviderEntry } from "./router";

const CHAT_TIMEOUT_MS = 8_000;

/**
 * Chat only needs to be fast to the first token, so it gets a shorter timeout.
 * Every other task uses the global AI_TIMEOUT_MS.
 */
export function getProviderChain(task: AiTask, e: Env = env): ProviderEntry[] {
  const timeoutMs = task === "chat" ? CHAT_TIMEOUT_MS : e.AI_TIMEOUT_MS;
  const chain: ProviderEntry[] = [];

  if (!isCooldownActive("gemini") && e.GEMINI_API_KEY && e.GEMINI_MODEL) {
    const google: GoogleGenerativeAIProvider = createGoogleGenerativeAI({
      apiKey: e.GEMINI_API_KEY,
    });
    chain.push({
      name: "gemini",
      modelId: e.GEMINI_MODEL,
      model: google(e.GEMINI_MODEL),
      timeoutMs,
    });
  }

  // Vision needs an explicit multimodal model; never reuse the text model id.
  const groqModelId = task === "vision" ? e.GROQ_VISION_MODEL : e.GROQ_MODEL;
  if (!isCooldownActive("groq") && e.GROQ_API_KEY && groqModelId) {
    const groq: GroqProvider = createGroq({ apiKey: e.GROQ_API_KEY });
    chain.push({
      name: "groq",
      modelId: groqModelId,
      model: groq(groqModelId),
      timeoutMs,
    });
  }

  if (
    !isCooldownActive("alt") &&
    e.ALT_AI_BASE_URL &&
    e.ALT_AI_API_KEY &&
    e.ALT_AI_MODEL
  ) {
    const alt: OpenAICompatibleProvider<string, string, string, string> =
      createOpenAICompatible({
        name: "alt",
        baseURL: e.ALT_AI_BASE_URL,
        apiKey: e.ALT_AI_API_KEY,
      });
    chain.push({
      name: "alt",
      modelId: e.ALT_AI_MODEL,
      model: alt(e.ALT_AI_MODEL),
      timeoutMs,
    });
  }

  return chain;
}
