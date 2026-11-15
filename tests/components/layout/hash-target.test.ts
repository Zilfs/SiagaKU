import { describe, expect, it } from "vitest";
import { getHashTarget } from "@/components/layout/hash-target";

describe("getHashTarget", () => {
  it("scrolls in place for a landing section link on the landing", () => {
    expect(getHashTarget("/#cara", "https://siagaku.test/")).toEqual({
      id: "cara",
      href: "/#cara",
      samePage: true,
    });
  });

  it("keeps the landing in place when it already shows another hash", () => {
    expect(
      getHashTarget("/#fitur", "https://siagaku.test/#cek")?.samePage,
    ).toBe(true);
  });

  it("navigates for a landing section link from another page", () => {
    expect(getHashTarget("/#cek", "https://siagaku.test/peta")).toEqual({
      id: "cek",
      href: "/#cek",
      samePage: false,
    });
  });

  it("decodes the section id", () => {
    expect(getHashTarget("/#sumber%20data", "https://siagaku.test/")?.id).toBe(
      "sumber data",
    );
  });

  it("ignores links that are not landing sections", () => {
    const here = "https://siagaku.test/";
    expect(getHashTarget("/peta", here)).toBeNull();
    expect(getHashTarget("/", here)).toBeNull();
    expect(getHashTarget("/#", here)).toBeNull();
    expect(getHashTarget("#top", here)).toBeNull(); // the skip link keeps its native focus move
    expect(getHashTarget("/tentang#skor", here)).toBeNull();
    expect(getHashTarget("https://example.com/#cek", here)).toBeNull();
    expect(getHashTarget("/#%E0%A4%A", here)).toBeNull(); // malformed escape
  });
});
