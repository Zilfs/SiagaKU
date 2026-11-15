/** Names of the secret env vars (src/lib/env.ts) that must never reach the client bundle. */
export const SECRET_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "ALT_AI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "VAPID_PRIVATE_KEY",
];

/** Returns labels (never secret values) for each secret name or value found in `content`. */
export function findSecretHits(
  content: string,
  names: string[],
  env: Record<string, string | undefined>,
): string[] {
  const hits: string[] = [];
  for (const name of names) {
    if (content.includes(name)) hits.push(name);
    const value = env[name];
    if (value && value.length >= 8 && content.includes(value)) {
      hits.push(`${name} (value)`);
    }
  }
  return hits;
}
