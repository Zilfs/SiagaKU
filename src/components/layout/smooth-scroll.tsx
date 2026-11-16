"use client";

import { useEffect } from "react";
import { wheelPixels } from "./wheel";

/** Mouse users who have not asked for less motion; touch and trackpads keep native scrolling. */
const SMOOTH_OK = "(prefers-reduced-motion: no-preference) and (pointer: fine)";

/** True when the wheel belongs to something under the pointer that scrolls or zooms by itself. */
function scrollsItself(start: EventTarget | null) {
  let el = start instanceof Element ? start : null;
  for (; el && el !== document.body; el = el.parentElement) {
    if (el.matches(".leaflet-container, dialog, textarea, select")) return true;
    const { overflowY } = getComputedStyle(el);
    if (/auto|scroll/.test(overflowY) && el.scrollHeight > el.clientHeight)
      return true;
  }
  return false;
}

/**
 * Eases mouse-wheel scrolling with a GSAP tween of the real scroll position. The page still
 * scrolls natively (no transformed wrapper), so fixed and sticky elements, hash links and the
 * scroll-driven CSS animations keep working. GSAP loads only when smoothing applies.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia(SMOOTH_OK).matches) return;
    let cleanup = () => {};
    let cancelled = false;

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      const position = { y: window.scrollY };
      let target = position.y;
      let tween: gsap.core.Tween | null = null;
      const stop = () => tween?.kill();

      const onWheel = (event: WheelEvent) => {
        if (event.defaultPrevented) return;
        if (document.documentElement.dataset.motion === "off") return;
        const pixels = wheelPixels(event);
        if (pixels === null || scrollsItself(event.target)) return;
        event.preventDefault();
        // a new gesture starts from where the page really is (keys or the scrollbar may have moved it)
        if (!tween?.isActive()) position.y = target = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        target = Math.min(max, Math.max(0, target + pixels));
        tween = gsap.to(position, {
          y: target,
          duration: 0.7,
          ease: "power3.out",
          overwrite: true,
          // "instant" so the stylesheet's scroll-behavior: smooth does not animate each step again
          onUpdate: () =>
            window.scrollTo({ top: position.y, behavior: "instant" }),
        });
      };

      window.addEventListener("wheel", onWheel, { passive: false });
      // the keyboard, the scrollbar or a link takes over at once
      window.addEventListener("keydown", stop);
      window.addEventListener("pointerdown", stop);
      cleanup = () => {
        stop();
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", stop);
        window.removeEventListener("pointerdown", stop);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
