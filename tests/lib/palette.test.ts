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
  ["ink", "tint"],
  ["bg", "blue"], // primary buttons, chips, the user's chat bubble
  ["blue", "bg"], // links
  ["blue", "card"],
  ["blue", "surface"],
  ["blue", "surface2"],
  ["blue", "tint"],
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
  ["invLink", "invSurface"],
  ["invLink", "invBand"],
  ["ink", "invInk"], // the ivory button in dark bands
];

describe("palette contrast", () => {
  it.each(AA_PAIRS)("%s on %s is at least 4.5:1", (text, ground) => {
    expect(
      contrastRatio(PALETTE[text], PALETTE[ground]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11: focus rings and control boundaries need 3:1 against the ground they sit on
  const NON_TEXT_PAIRS: [PaletteKey, PaletteKey][] = [
    ["blue", "bg"], // --p-focus on light grounds
    ["blue", "card"],
    ["blue", "surface"],
    ["blue", "surface2"],
    ["invLink", "invBg"], // --p-focus inside dark bands
    ["invLink", "invSurface"],
    ["inputLine", "bg"],
    ["inputLine", "card"],
    ["inputLine", "surface"],
    ["inputLine", "surface2"],
  ];
  it.each(NON_TEXT_PAIRS)("%s on %s is at least 3:1", (fg, ground) => {
    expect(contrastRatio(PALETTE[fg], PALETTE[ground])).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("royal blue is too dark on coal, so dark bands use invLink", () => {
    expect(contrastRatio(PALETTE.blue, PALETTE.invBg)).toBeLessThan(3);
  });
});
