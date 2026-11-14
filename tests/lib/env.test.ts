import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const minimalValidEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  IP_SALT: "salt",
  CRON_SECRET: "cron",
  GEMINI_API_KEY: "g-key",
  GEMINI_MODEL: "gemini-x",
};

describe("parseEnv", () => {
  it("rejects an env without SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(() =>
      parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("allows optional providers to be empty and defaults the timeout to 20000", () => {
    const e = parseEnv(minimalValidEnv);
    expect(e.GROQ_API_KEY).toBeUndefined();
    expect(e.AI_TIMEOUT_MS).toBe(20000);
    expect(e.GEMINI_EMBED_MODEL).toBe("gemini-embedding-001");
  });

  it("stays valid without an LLM provider (AI features use templates)", () => {
    const e = parseEnv({
      ...minimalValidEnv,
      GEMINI_API_KEY: undefined,
      GEMINI_MODEL: undefined,
    });
    expect(e.GEMINI_API_KEY).toBeUndefined();
    expect(e.GROQ_API_KEY).toBeUndefined();
  });

  it("accepts Groq only and treats empty strings as undefined", () => {
    const e = parseEnv({
      ...minimalValidEnv,
      GEMINI_API_KEY: "",
      GEMINI_MODEL: "",
      GROQ_API_KEY: "q",
      GROQ_MODEL: "m",
      AI_TIMEOUT_MS: "5000",
    });
    expect(e.GEMINI_API_KEY).toBeUndefined();
    expect(e.AI_TIMEOUT_MS).toBe(5000);
  });
});
