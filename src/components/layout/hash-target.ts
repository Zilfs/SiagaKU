export type HashTarget = { id: string; href: string; samePage: boolean };

/**
 * Resolves a link to a landing section (`/#id`), or null for any other link. `samePage` means the
 * landing is already open, so the click scrolls instead of navigating.
 */
export function getHashTarget(
  href: string,
  currentHref: string,
): HashTarget | null {
  if (!href.startsWith("/#") || href.length < 3) return null;
  let id: string;
  try {
    id = decodeURIComponent(href.slice(2));
  } catch {
    return null;
  }
  return { id, href, samePage: new URL(currentHref).pathname === "/" };
}
