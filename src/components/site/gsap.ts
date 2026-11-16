"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// the one place GSAP plugins are registered; only the landing's client components import this
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };

/** Motion runs only for viewers who have not asked for less of it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Calls `run` once, when `el`'s top passes `bottomInset` above the viewport's bottom edge, then
 * stops observing. Returns the cleanup for an unmount before that.
 */
export function onceInView(el: Element, bottomInset: string, run: () => void) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      run();
    },
    // the huge top margin counts "already scrolled past" as in view, so a jump (End key) still fires
    { rootMargin: `100000px 0px -${bottomInset} 0px` },
  );
  observer.observe(el);
  return () => observer.disconnect();
}
