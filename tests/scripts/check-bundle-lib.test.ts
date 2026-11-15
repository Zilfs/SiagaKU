import { describe, expect, it } from "vitest";
import { findSecretHits } from "../../scripts/lib/bundle-secrets";

describe("findSecretHits", () => {
  const names = ["GEMINI_API_KEY", "CRON_SECRET"];

  it("finds secret names and values without returning the value", () => {
    const hits = findSecretHits(
      "a GEMINI_API_KEY b supersecretvalue123",
      names,
      { CRON_SECRET: "supersecretvalue123" },
    );
    expect(hits).toEqual(["GEMINI_API_KEY", "CRON_SECRET (value)"]);
    expect(hits.join()).not.toContain("supersecretvalue123");
  });

  it("skips short or missing values and returns nothing for clean content", () => {
    expect(findSecretHits("abc 123", names, { CRON_SECRET: "abc" })).toEqual(
      [],
    );
  });
});
