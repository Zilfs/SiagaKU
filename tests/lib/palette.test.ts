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
  ["danger", "dangerBg"], // header 112 button
  ["invInk", "danger"], // footer 112 button
  ["invInk", "invBg"],
  ["invInk", "invSurface"],
  ["invInk", "invBand"],
  ["invMuted", "invBg"],
  ["invMuted", "invSurface"],
  ["invMuted", "invBand"],
  ["invLink", "invBg"],
  ["invLink", "invBand"],
  ["invInk", "ink"], // dark cards: the chat's emergency and 112 cards
  ["invMuted", "ink"],
  // the landing hero: ink over every sky layer, muted (eyebrow) on the sky's top
  ["ink", "skyTop"],
  ["ink", "cityFar"],
  ["ink", "city"],
  ["ink", "water"],
  ["muted", "skyTop"],
];

describe("palette contrast", () => {
  it.each(AA_PAIRS)("%s on %s is at least 4.5:1", (text, ground) => {
    expect(
      contrastRatio(PALETTE[text], PALETTE[ground]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11: focus rings and control boundaries need 3:1 against the ground they sit on
  const NON_TEXT_PAIRS: [PaletteKey, PaletteKey][] = [
    ["skyInk", "bg"], // --p-focus on light grounds
    ["skyInk", "card"],
    ["skyInk", "surface"],
    ["skyInk", "surface2"],
    ["sky", "invBg"], // --p-focus inside dark bands
    ["sky", "invBand"],
    ["sky", "ink"],
    ["inputLine", "bg"],
    ["inputLine", "card"],
    ["inputLine", "surface"],
    ["inputLine", "surface2"],
    ["skyInk", "skyTop"], // the hero's focus rings on the sky
  ];
  it.each(NON_TEXT_PAIRS)("%s on %s is at least 3:1", (fg, ground) => {
    expect(contrastRatio(PALETTE[fg], PALETTE[ground])).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("sky and jade fail as text on the light ground, so they stay fills", () => {
    expect(contrastRatio(PALETTE.sky, PALETTE.bg)).toBeLessThan(4.5);
    expect(contrastRatio(PALETTE.jade, PALETTE.bg)).toBeLessThan(4.5);
  });
});
