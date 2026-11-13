import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  return { insert, from, client: { from } };
});

vi.mock("@/lib/db/client", () => ({
  supabaseServer: () => db.client,
}));

import { logAi } from "@/lib/ai/log";

beforeEach(() => {
  vi.clearAllMocks();
  db.insert.mockResolvedValue({ error: null });
});

describe("logAi", () => {
  it("writes to ai_logs with the schema column names", async () => {
    await logAi({
      task: "chat",
      provider: "gemini",
      modelId: "gemini-flash",
      status: "ok",
      latencyMs: 12.6,
    });

    expect(db.from).toHaveBeenCalledWith("ai_logs");
    expect(db.insert).toHaveBeenCalledWith({
      feature: "chat",
      provider: "gemini",
      model: "gemini-flash",
      status: "ok",
      latency_ms: 13,
      error_code: null,
    });
  });

  it("stores the error kind when the attempt failed", async () => {
    await logAi({
      task: "vision",
      provider: "groq",
      modelId: "groq-vision",
      status: "error",
      latencyMs: 900,
      errorKind: "quota",
    });

    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({ error_code: "quota" }),
    );
  });

  it("never throws when the insert fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    db.insert.mockRejectedValue(new Error("network down"));

    await expect(
      logAi({
        task: "chat",
        provider: "alt",
        modelId: "alt-model",
        status: "error",
        latencyMs: 5,
      }),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });
});
