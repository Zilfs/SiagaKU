/**
 * Manual smoke test for the AI provider chain.
 *
 *   npx tsx scripts/ai-ping.ts
 *
 * Prints the provider that answered. Run it again with a wrong
 * GEMINI_API_KEY to verify the Groq fallback.
 */
import { generateText } from "ai";
import { withFallback } from "../src/lib/ai/router";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the ambient environment.
}

const { provider, modelId, fallback, result } = await withFallback(
  "penjelasan",
  (entry) =>
    generateText({
      model: entry.model,
      prompt: "Jawab dengan satu kata: ok",
      maxOutputTokens: 10,
      maxRetries: 0,
      temperature: 0.3,
    }),
);

console.log(
  `provider=${provider} model=${modelId} fallback=${fallback} text=${JSON.stringify(
    result.text.trim(),
  )}`,
);
