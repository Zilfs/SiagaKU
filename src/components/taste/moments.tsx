"use client";

import { useEffect } from "react";

/**
 * Mounts the page's taste-skill moments after React has hydrated. The moments mutate the DOM
 * (classes, light layers, attributes), so importing them any earlier makes the server HTML and the
 * first client render disagree. Loading happens in an effect, i.e. after hydration by definition.
 */
export function Moments() {
  useEffect(() => {
    let cancelled = false;
    // A public asset, not a bundled module: both bundlers must leave the URL as written.
    const load = (url: string) =>
      import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ url
      ) as Promise<{ mountAll: (root: Document) => Promise<unknown> }>;

    const mount = async () => {
      try {
        const moments = await load("/taste/moments/moments.js");
        if (!cancelled) await moments.mountAll(document);
      } catch {
        // The page is complete without the moments (the CSS keeps every section readable).
      }
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(mount, { timeout: 1800 });
    } else {
      setTimeout(mount, 200);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
