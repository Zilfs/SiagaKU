import { beforeEach, describe, expect, it, vi } from "vitest";

const select = vi.fn();
vi.mock("@/lib/db/client", () => ({
  supabaseServer: () => ({ from: () => ({ select }) }),
}));
vi.mock("ai", async (orig) => ({
  ...(await orig<typeof import("ai")>()),
  generateText: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  env: {
    CRON_SECRET: "s3cret",
    GEMINI_API_KEY: "g",
    GEMINI_MODEL: "gemini-x",
    GROQ_API_KEY: "q",
    GROQ_MODEL: "groq-x",
    AI_TIMEOUT_MS: 1000,
  },
}));

import { generateText } from "ai";
import { GET } from "@/app/api/health/route";
import { resetCooldowns } from "@/lib/ai/router";

const req = (q = "", auth?: string) =>
  new Request(`http://x/api/health${q}`, {
    headers: auth ? { authorization: auth } : {},
  });

beforeEach(() => {
  resetCooldowns();
  select.mockReset().mockResolvedValue({ error: null });
  vi.mocked(generateText).mockReset();
});

describe("GET /api/health", () => {
  it("only checks the DB without params", async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, db: "ok", providers: {} });
    expect(typeof body.time).toBe("string");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("returns 503 when the DB check fails", async () => {
    select.mockResolvedValue({ error: { message: "down" } });
    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, db: "error" });
  });

  it("rejects deep=1 without the cron token", async () => {
    expect((await GET(req("?deep=1"))).status).toBe(401);
    expect((await GET(req("?deep=1", "Bearer wrong"))).status).toBe(401);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("pings each configured provider and skips the rest", async () => {
    vi.mocked(generateText)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error("quota"));
    const res = await GET(req("?deep=1", "Bearer s3cret"));
    const body = await res.json();
    expect(body.providers).toEqual({
      gemini: "ok",
      groq: "error",
      alt: "skip",
    });
    expect(body.ok).toBe(true);
    expect(generateText).toHaveBeenCalledTimes(2);
  });
});
