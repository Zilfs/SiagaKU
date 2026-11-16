/**
 * The brand palette, mirrored from the `--p-*` tokens in src/app/globals.css so tests can check
 * contrast and so non-CSS places (viewport theme colour, PWA manifest) use the same values.
 * tests/lib/palette.test.ts fails when this file and the CSS drift apart.
 */
export const PALETTE = {
  bg: "#fefefd", // Ivory White
  surface: "#f4f5f7",
  surface2: "#eaecf1",
  card: "#ffffff",
  ink: "#080808", // Coal Black
  muted: "#55585f",
  line: "#e2e4ea",
  inputLine: "#7a7e88", // input and checkbox boundaries (>= 3:1)
  blue: "#154ecd", // Royal Blue: fills with ivory text, links, focus rings on light grounds
  tint: "#dce6fb", // pale blue accent fill, always with ink text
  invBg: "#080808",
  invSurface: "#171717",
  invBand: "#080808", // the footer band: the Jakarta illustration fades in from it
  invInk: "#fefefd",
  invMuted: "#a8abb2",
  invLink: "#8fb0ff", // links and focus rings in dark bands (royal blue is 2.9:1 on coal)
  danger: "#c62828", // the 112 button: red text on dangerBg, ivory text on red
  dangerBg: "#fdecec",
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** The CSS custom property that holds each palette value. */
export const PALETTE_TOKENS: Record<PaletteKey, string> = {
  bg: "--p-bg",
  surface: "--p-surface",
  surface2: "--p-surface-2",
  card: "--p-card",
  ink: "--p-ink",
  muted: "--p-muted",
  line: "--p-line",
  inputLine: "--p-input-line",
  blue: "--p-blue",
  tint: "--p-tint",
  invBg: "--p-inv-bg",
  invSurface: "--p-inv-surface",
  invBand: "--p-inv-band",
  invInk: "--p-inv-ink",
  invMuted: "--p-inv-muted",
  invLink: "--p-inv-link",
  danger: "--p-danger",
  dangerBg: "--p-danger-bg",
};
