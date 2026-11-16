/**
 * The brand palette, mirrored from the `--p-*` tokens in src/app/globals.css so tests can check
 * contrast and so non-CSS places (viewport theme colour, PWA manifest) use the same values.
 * tests/lib/palette.test.ts fails when this file and the CSS drift apart.
 */
export const PALETTE = {
  bg: "#fdfdfe", // Cloudy White
  surface: "#eef7ff",
  surface2: "#e1f1ff",
  card: "#ffffff",
  ink: "#0b1b2e",
  muted: "#44566b",
  line: "#cfe3f5",
  inputLine: "#6b7f95", // input and checkbox boundaries (>= 3:1)
  sky: "#0099ff", // fills only; never text on light grounds (2.95:1)
  skyInk: "#006bb3", // links and blue text on light grounds
  jade: "#83fd80", // accent fills only, always with ink text
  invBg: "#06233f",
  invSurface: "#0b3358",
  invBand: "#012a4a", // the footer illustration's own top colour
  invInk: "#fdfdfe",
  invMuted: "#a9c6e0",
  invLink: "#66c2ff",
  danger: "#c62828", // the 112 button: red text on dangerBg, Cloudy White text on red
  dangerBg: "#fdecec",
  // the landing sky's layers: hero text (ink) and the focus ring may lie over them
  skyTop: "#cbe8ff",
  cityFar: "#b3dcfb",
  city: "#8cc8f3",
  water: "#5cb3ee",
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
  sky: "--p-sky",
  skyInk: "--p-sky-ink",
  jade: "--p-jade",
  invBg: "--p-inv-bg",
  invSurface: "--p-inv-surface",
  invBand: "--p-inv-band",
  invInk: "--p-inv-ink",
  invMuted: "--p-inv-muted",
  invLink: "--p-inv-link",
  danger: "--p-danger",
  dangerBg: "--p-danger-bg",
  skyTop: "--p-sky-top",
  cityFar: "--p-city-far",
  city: "--p-city",
  water: "--p-water",
};
