"use client";

import { useEffect } from "react";
import { wheelPixels } from "./wheel";

/** Mouse users who have not asked for less motion; touch and trackpads keep native scrolling. */
const SMOOTH_OK = "(prefers-reduced-motion: no-preference) and (pointer: fine)";

/** Share of the remaining distance closed per millisecond (about 90% within a quarter second). */
const FOLLOW_PER_MS = 0.009;

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
      let y = window.scrollY;
      let target = y;
      let running = false;

      // One follower that closes a fixed share of the remaining distance per second. Restarting
      // an eased tween on every notch made the speed dip mid-scroll, which read as stutter.
      const tick = (_time: number, deltaMs: number) => {
        // something else moved the page (scrollbar, keys, a link): let it win
        if (Math.abs(window.scrollY - y) > 2) return stop();
        const left = target - y;
        y =
          Math.abs(left) < 0.5
            ? target
            : y + left * (1 - Math.exp(-deltaMs * FOLLOW_PER_MS));
        // "instant" so the stylesheet's scroll-behavior: smooth does not animate each step again
        window.scrollTo({ top: y, behavior: "instant" });
        if (y === target) stop();
      };
      function stop() {
        running = false;
        gsap.ticker.remove(tick);
      }

      const onWheel = (event: WheelEvent) => {
        if (event.defaultPrevented) return;
        if (document.documentElement.dataset.motion === "off") return;
        let pixels = wheelPixels(event);
        // mid-glide, small deltas (precision wheels, trackpads) join the glide instead of
        // scrolling natively underneath it
        if (
          pixels === null &&
          running &&
          !event.ctrlKey &&
          event.deltaMode === 0
        )
          pixels = event.deltaY;
        if (pixels === null || scrollsItself(event.target)) return;
        event.preventDefault();
        // a new gesture starts from where the page really is
        if (!running) y = target = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        target = Math.min(max, Math.max(0, target + pixels));
        if (!running) {
          running = true;
          gsap.ticker.add(tick);
        }
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
