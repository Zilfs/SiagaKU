import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany } from "ai";
import { env } from "@/lib/env";

export const EMBEDDING_DIMENSIONS = 768;

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/**
 * Embeds texts with Gemini `gemini-embedding-001`, reduced to 768 dimensions
 * to match the `vector(768)` column. Documents and queries must use different
 * task types so the similarity search works as intended.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTaskType,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });

  const { embeddings } = await embedMany({
    model: google.textEmbedding(env.GEMINI_EMBED_MODEL),
    values: texts,
    maxRetries: 2,
    providerOptions: {
      google: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    },
  });

  return embeddings;
}
