import { describe, expect, it } from "vitest";
import { isCurrent } from "@/components/layout/header";

describe("isCurrent", () => {
  it("marks the route link for its page and its sub-pages", () => {
    expect(isCurrent("/peta", "/peta")).toBe(true);
    expect(isCurrent("/rencana/menteng", "/rencana")).toBe(true);
  });

  it("does not mark other routes or prefixes of another word", () => {
    expect(isCurrent("/", "/peta")).toBe(false);
    expect(isCurrent("/petabaru", "/peta")).toBe(false);
  });

  it("never marks hash links to landing sections", () => {
    expect(isCurrent("/", "/#cari")).toBe(false);
  });
});
