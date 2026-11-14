import { z } from "zod";

// An empty string (blank .env line) counts as unset.
const opt = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);
const req = (name: string) =>
  z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string({ error: `${name} is required` }).min(1, `${name} is required`),
  );

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: opt,
  NEXT_PUBLIC_SUPABASE_URL: req("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: opt,
  SUPABASE_SERVICE_ROLE_KEY: req("SUPABASE_SERVICE_ROLE_KEY"),
  GEMINI_API_KEY: opt,
  GEMINI_MODEL: opt,
  GEMINI_EMBED_MODEL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("gemini-embedding-001"),
  ),
  GROQ_API_KEY: opt,
  GROQ_MODEL: opt,
  GROQ_VISION_MODEL: opt,
  ALT_AI_BASE_URL: opt,
  ALT_AI_API_KEY: opt,
  ALT_AI_MODEL: opt,
  IP_SALT: req("IP_SALT"),
  CRON_SECRET: req("CRON_SECRET"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: opt,
  VAPID_PRIVATE_KEY: opt,
  VAPID_SUBJECT: opt,
  AI_TIMEOUT_MS: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().positive().default(20000),
  ),
});

export type Env = z.output<typeof schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const r = schema.safeParse(raw);
  if (!r.success) {
    throw new Error(
      "Invalid env: " + r.error.issues.map((i) => i.message).join("; "),
    );
  }
  const e = r.data;
  // No LLM key is allowed: every AI feature falls back to its template, so the site stays up.
  if (
    !(e.GEMINI_API_KEY && e.GEMINI_MODEL) &&
    !(e.GROQ_API_KEY && e.GROQ_MODEL)
  ) {
    console.warn(
      "No LLM provider (GEMINI_API_KEY + GEMINI_MODEL or GROQ_API_KEY + GROQ_MODEL); AI features use their templates.",
    );
  }
  return e;
}

let cached: Env | undefined;

// Lazy: parse on first access so importing never fails at build time.
export const env: Env = new Proxy({} as Env, {
  get(_, key) {
    cached ??= parseEnv(process.env);
    return cached[key as keyof Env];
  },
});
