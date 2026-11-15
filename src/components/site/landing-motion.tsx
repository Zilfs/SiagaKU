"use client";

import { useRef, type ReactNode } from "react";
import { formatCount } from "./motion-math";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/** A section head whose children rise in once, the first time it scrolls into view. */
export function Reveal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      // already on screen (a deep link, a tall screen): leave it as rendered, no flash
      if (!el || el.getBoundingClientRect().top < window.innerHeight) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from(el.children, {
          autoAlpha: 0,
          y: 16,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** A hero figure that counts up from 0 once on load; the server renders the final number. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        const frame = { value: 0 };
        el.textContent = "0";
        gsap.to(frame, {
          value,
          duration: 1.2,
          delay: 0.2,
          ease: "power2.out",
          // writes the DOM text directly: no React render per frame
          onUpdate: () => {
            el.textContent = formatCount(frame.value, value);
          },
        });
        return () => {
          el.textContent = String(value);
        };
      });
    },
    { scope: ref },
  );

  return <span ref={ref}>{value}</span>;
}

/** Wraps a primary button: it leans a few pixels toward a fine pointer, then settles back. */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap
        .matchMedia()
        .add(`${MOTION_OK} and (hover: hover) and (pointer: fine)`, () => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
          const pull = (delta: number) => gsap.utils.clamp(-6, 6, delta * 0.2);
          const onMove = (event: PointerEvent) => {
            const box = el.getBoundingClientRect();
            xTo(pull(event.clientX - box.left - box.width / 2));
            yTo(pull(event.clientY - box.top - box.height / 2));
          };
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };
          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
          };
        });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className="sk-magnet">
      {children}
    </span>
  );
}
