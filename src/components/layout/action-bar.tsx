"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * The phone's action bar: the page's one primary action, once the hero's button has scrolled away
 * (docs/08-ui-ux: the main CTA sits in the bottom area on a phone). Hidden by CSS above 640px, and
 * while the closing footer is in view so it never covers the footer's own links.
 */
export function ActionBar() {
  const [on, setOn] = useState(false);
  const [atClose, setAtClose] = useState(false);

  useEffect(() => {
    const onScroll = () => setOn(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = document.querySelector<HTMLElement>("footer.closing");
    if (!close) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAtClose(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(close);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={on && !atClose ? "sk-actionbar is-on" : "sk-actionbar"}>
      <Link className="btn btn--primary" href="/#cek">
        Cek risiko wilayah
      </Link>
    </div>
  );
}
