"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * The phone's action bar: the page's one primary action, once the hero's button has scrolled away
 * (docs/08-ui-ux: the main CTA sits in the bottom area on a phone). Hidden by CSS above 640px, and
 * while the closing footer is in view so it never covers the footer's own links.
 */
export function ActionBar() {
  const sentinel = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const [atClose, setAtClose] = useState(false);

  // The sentinel sits 480px down the document (the hero's end): the bar shows once it is above the view.
  useEffect(() => {
    const mark = sentinel.current;
    if (!mark) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOn(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(mark);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const close = document.querySelector<HTMLElement>("footer.sk-footer");
    if (!close) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAtClose(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(close);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <span
        ref={sentinel}
        className="sk-actionbar__sentinel"
        aria-hidden="true"
      />
      <div className={on && !atClose ? "sk-actionbar is-on" : "sk-actionbar"}>
        <Link className="btn btn--primary" href="/#cari">
          Cek risiko wilayah
        </Link>
      </div>
    </>
  );
}
