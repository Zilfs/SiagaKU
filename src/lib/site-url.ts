const FALLBACK = "https://siaga-ku.vercel.app";

/** A usable absolute site URL: adds https:// when the scheme is missing, falls back when unparsable. */
export function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return FALLBACK;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return FALLBACK;
  }
}
