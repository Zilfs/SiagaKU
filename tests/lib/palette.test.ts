import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";
import { PALETTE, PALETTE_TOKENS, type PaletteKey } from "@/lib/palette";

const css = readFileSync("src/app/globals.css", "utf8");

describe("PALETTE mirrors globals.css", () => {
  it.each(Object.keys(PALETTE) as PaletteKey[])("%s", (key) => {
    const match = new RegExp(
      `${PALETTE_TOKENS[key]}:\\s*(#[0-9a-f]{3,8})\\s*;`,
      "i",
    ).exec(css);
    expect(match?.[1].toLowerCase()).toBe(PALETTE[key]);
  });
});

// [text, ground]: every pair the UI sets text on must reach WCAG AA for body text
const AA_PAIRS: [PaletteKey, PaletteKey][] = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink", "surface2"],
  ["ink", "sky"],
  ["ink", "jade"],
  ["skyInk", "bg"],
  ["skyInk", "card"],
  ["skyInk", "surface"],
  ["skyInk", "surface2"],
  ["muted", "bg"],
  ["muted", "card"],
  ["muted", "surface"],
  ["muted", "surface2"],
  ["danger", "bg"],
  ["invInk", "invBg"],
  ["invInk", "invSurface"],
  ["invInk", "invBand"],
  ["invMuted", "invBg"],
  ["invMuted", "invSurface"],
  ["invMuted", "invBand"],
  ["invLink", "invBg"],
  ["invLink", "invBand"],
];

describe("palette contrast", () => {
  it.each(AA_PAIRS)("%s on %s is at least 4.5:1", (text, ground) => {
    expect(
      contrastRatio(PALETTE[text], PALETTE[ground]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("sky and jade fail as text on the light ground, so they stay fills", () => {
    expect(contrastRatio(PALETTE.sky, PALETTE.bg)).toBeLessThan(4.5);
    expect(contrastRatio(PALETTE.jade, PALETTE.bg)).toBeLessThan(4.5);
  });
});
