"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getHashTarget } from "./hash-target";

/** Scrolls to the section, then focuses it without a second scroll so the next Tab starts there. */
function goTo(target: HTMLElement) {
  target.scrollIntoView();
  if (target.tabIndex < 0) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

/** Scrolls to `#id` once it is in the DOM (the landing streams in behind its skeleton). */
function scrollWhenReady(id: string) {
  // scrollIntoView() follows the CSS scroll-behavior, so reduced motion jumps instead of gliding
  const scroll = () => {
    const target = document.getElementById(id);
    if (target) goTo(target);
    return target !== null;
  };
  if (scroll()) return;
  const observer = new MutationObserver(() => {
    if (scroll()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = window.setTimeout(() => observer.disconnect(), 10_000);
  return () => {
    observer.disconnect();
    window.clearTimeout(timer);
  };
}

/**
 * Landing section links (`/#cara`): on the landing they scroll without a navigation; from another
 * page they open the landing at the top, then scroll to the section once it has streamed in.
 */
export function HashScroll() {
  const router = useRouter();
  const pathname = usePathname();
  // undefined until the first effect: a direct visit to /#id is handled like a click from elsewhere
  const pending = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const id =
      pending.current === undefined
        ? getHashTarget(`/${window.location.hash}`, window.location.href)?.id
        : pending.current;
    pending.current = null;
    if (pathname !== "/" || !id) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    return scrollWhenReady(id);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (
        (link.target && link.target !== "_self") ||
        link.hasAttribute("download")
      )
        return;
      const target = getHashTarget(
        link.getAttribute("href") ?? "",
        window.location.href,
      );
      if (!target) return;
      // capture phase on window: runs before React, so <Link> sees defaultPrevented and skips its navigation
      event.preventDefault();
      if (target.samePage) {
        if (window.location.hash !== target.href.slice(1)) {
          window.history.pushState(null, "", target.href);
        }
        const section = document.getElementById(target.id);
        if (section) goTo(section);
      } else {
        pending.current = target.id;
        router.push(target.href, { scroll: false });
      }
    }
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
