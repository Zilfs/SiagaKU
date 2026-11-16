import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "@/lib/site-url";

describe("resolveSiteUrl", () => {
  it("falls back when unset or blank", () => {
    expect(resolveSiteUrl(undefined)).toBe("https://siaga-ku.vercel.app");
    expect(resolveSiteUrl("  ")).toBe("https://siaga-ku.vercel.app");
  });
  it("keeps a full URL", () => {
    expect(resolveSiteUrl("https://example.com")).toBe("https://example.com/");
  });
  it("adds https when the scheme is missing", () => {
    expect(resolveSiteUrl("example.com")).toBe("https://example.com/");
  });
  it("falls back when unparsable", () => {
    expect(resolveSiteUrl("http://")).toBe("https://siaga-ku.vercel.app");
  });
});
