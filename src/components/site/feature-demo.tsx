"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pointIn } from "./motion-math";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

type Vars = gsap.TweenVars;
type Part = {
  /** Selector inside the card's mock. */
  sel: string;
  /** The loop's start state (also where each cycle resets to). */
  from: Vars;
  /** The state after the click: the server renders this one, so it is also the no-JS/reduced-motion frame. */
  to: Vars;
  duration: number;
  ease?: string;
  /** Position in the timeline; the first part starts right after the click. */
  at?: gsap.Position;
};

const POP = "back.out(2)";

/** What changes in each mock after the cursor clicks its `[data-demo-target]`. */
const PARTS: Record<FeatureDemoKind, Part[]> = {
  risk: [
    {
      sel: ".sk-demo__hl",
      from: { autoAlpha: 0 },
      to: { autoAlpha: 1 },
      duration: 0.25,
    },
    {
      sel: ".sk-demo__chip",
      from: { autoAlpha: 0, x: 8 },
      to: { autoAlpha: 1, x: 0 },
      duration: 0.35,
    },
  ],
  plan: [
    {
      sel: ".sk-demo__tick",
      from: { scale: 0 },
      to: { scale: 1 },
      duration: 0.3,
      ease: POP,
    },
    {
      sel: ".sk-demo__from",
      from: { yPercent: 0, autoAlpha: 1 },
      to: { yPercent: -100, autoAlpha: 0 },
      duration: 0.3,
      at: "<0.1",
    },
    {
      sel: ".sk-demo__to",
      from: { yPercent: 100, autoAlpha: 0 },
      to: { yPercent: 0, autoAlpha: 1 },
      duration: 0.3,
      at: "<",
    },
  ],
  chat: [
    {
      sel: ".sk-demo__suggest",
      from: { autoAlpha: 1 },
      to: { autoAlpha: 0 },
      duration: 0.2,
    },
    {
      sel: ".sk-feature__bubble",
      from: { autoAlpha: 0, y: 6 },
      to: { autoAlpha: 1, y: 0 },
      duration: 0.3,
      at: "<",
    },
    {
      sel: ".sk-feature__answer",
      from: { autoAlpha: 0, y: 8 },
      to: { autoAlpha: 1, y: 0 },
      duration: 0.3,
      at: "+=0.3",
    },
    {
      // the answer streams in line by line
      sel: ".sk-demo__type",
      from: { clipPath: "inset(0% 0% 100% 0%)" },
      to: { clipPath: "inset(0% 0% 0% 0%)" },
      duration: 1.1,
      ease: "none",
      at: "<0.1",
    },
    {
      sel: ".sk-feature__src",
      from: { autoAlpha: 0, scale: 0.9 },
      to: { autoAlpha: 1, scale: 1 },
      duration: 0.3,
      ease: POP,
    },
  ],
  report: [
    {
      sel: ".sk-demo__hl",
      from: { autoAlpha: 0 },
      to: { autoAlpha: 1 },
      duration: 0.2,
    },
    {
      sel: ".sk-feature__status",
      from: { autoAlpha: 0, y: 8 },
      to: { autoAlpha: 1, y: 0 },
      duration: 0.35,
      at: "+=0.15",
    },
  ],
};

export type FeatureDemoKind = "risk" | "plan" | "chat" | "report";

/** The pointer's fingertip inside the 28px cursor, and the ripple's centre. */
const TIP = { x: 12, y: 2 };
const RIPPLE = { x: 16, y: 16 };

/** The section-wide pause (WCAG 2.2.2): one toggle holds every card's loop. */
const PauseContext = createContext<{
  paused: boolean;
  setPaused: (paused: boolean) => void;
}>({ paused: false, setPaused: () => {} });

/** Wraps the #fitur cards and their pause toggle; renders no element of its own. */
export function FeatureDemoGroup({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <PauseContext.Provider value={{ paused, setPaused }}>
      {children}
    </PauseContext.Provider>
  );
}

/** The visible pause/play button for all the feature loops (hidden under reduced motion). */
export function FeatureDemoToggle() {
  const { paused, setPaused } = useContext(PauseContext);
  return (
    <button
      type="button"
      className="sk-demo-toggle"
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
    >
      {paused ? (
        <svg viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 1.5 12 7l-9 5.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" aria-hidden="true">
          <rect x="2.5" y="2" width="3.2" height="10" rx="1" />
          <rect x="8.3" y="2" width="3.2" height="10" rx="1" />
        </svg>
      )}
      {paused ? "Putar animasi" : "Jeda animasi"}
    </button>
  );
}

/**
 * A feature card's panel that plays a short product-video loop: a hand cursor glides to the mock's
 * `[data-demo-target]`, presses it and the mock changes state, then everything resets. It runs only
 * while the card is on screen and not hovered or focused; under reduced motion the server-rendered
 * finished frame stays as it is.
 */
export function FeatureDemo({
  kind,
  label,
  children,
}: {
  kind: FeatureDemoKind;
  /** What the demo shows, for screen readers (the animated mock itself is aria-hidden). */
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { paused } = useContext(PauseContext);
  const pausedRef = useRef(paused);
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current?.();
  }, [paused]);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      gsap.matchMedia(root).add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const target = q("[data-demo-target]")[0];
        const [cursor] = q(".sk-demo__cursor");
        const [ripple] = q(".sk-demo__ripple");
        if (!target || !cursor || !ripple) return;

        // read the layout when a cycle starts (invalidate on repeat), so a resize is picked up
        const rest = () => ({
          x: root.clientWidth * 0.72,
          y: root.clientHeight * 0.72,
        });
        const aim = (anchor: { x: number; y: number }) =>
          pointIn(
            target.getBoundingClientRect(),
            root.getBoundingClientRect(),
            anchor,
          );

        const parts = PARTS[kind];
        for (const part of parts) gsap.set(q(part.sel), part.from);
        gsap.set(cursor, { ...rest(), autoAlpha: 0 });

        const tl = gsap.timeline({
          paused: true,
          repeat: -1,
          repeatDelay: 1.2,
          defaults: { ease: "power2.out" },
          onRepeat: () => {
            tl.invalidate();
          },
        });
        tl.to(cursor, { autoAlpha: 1, duration: 0.3 }, 0.4)
          .to(cursor, {
            x: () => aim(TIP).x,
            y: () => aim(TIP).y,
            duration: 0.9,
            ease: "power2.inOut",
          })
          .to(cursor, { scale: 0.86, duration: 0.12, ease: "power1.in" })
          .to(cursor, { scale: 1, duration: 0.2 })
          .fromTo(
            ripple,
            {
              x: () => aim(RIPPLE).x,
              y: () => aim(RIPPLE).y,
              scale: 0.3,
              autoAlpha: 0.5,
            },
            // no immediate render: the ripple stays hidden until the press
            { scale: 1.8, autoAlpha: 0, duration: 0.5, immediateRender: false },
            "<",
          )
          .addLabel("change", "<");
        parts.forEach((part, index) => {
          tl.to(
            q(part.sel),
            { ...part.to, duration: part.duration, ease: part.ease },
            part.at ?? (index === 0 ? "change" : ">"),
          );
        });
        tl.to(
          cursor,
          {
            x: () => rest().x,
            y: () => rest().y,
            autoAlpha: 0,
            duration: 0.6,
            ease: "power2.in",
          },
          "+=1.6",
        );
        tl.addLabel("reset", "<0.2");
        for (const part of parts) {
          tl.to(q(part.sel), { ...part.from, duration: 0.35 }, "reset");
        }

        let inView = false;
        let held = false;
        const sync = () =>
          inView && !held && !pausedRef.current ? tl.play() : tl.pause();
        syncRef.current = sync;
        const observer = new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
            sync();
          },
          { threshold: 0.4 },
        );
        observer.observe(root);
        const card = root.closest(".card") ?? root;
        const hold = () => {
          held = true;
          sync();
        };
        const release = (event: Event) => {
          // focus moving inside the card keeps it held
          if (
            event.type === "focusout" &&
            card.contains((event as FocusEvent).relatedTarget as Node)
          )
            return;
          if (event.type === "pointerleave" && card.matches(":focus-within"))
            return;
          held = false;
          sync();
        };
        card.addEventListener("pointerenter", hold);
        card.addEventListener("pointerleave", release);
        card.addEventListener("focusin", hold);
        card.addEventListener("focusout", release);
        return () => {
          syncRef.current = null;
          observer.disconnect();
          card.removeEventListener("pointerenter", hold);
          card.removeEventListener("pointerleave", release);
          card.removeEventListener("focusin", hold);
          card.removeEventListener("focusout", release);
        };
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="panel sk-demo">
      <p className="sr-only">{label}</p>
      {children}
      <span className="sk-demo__ripple" aria-hidden="true" />
      <svg
        className="sk-demo__cursor"
        viewBox="0 0 24 24"
        width="28"
        height="28"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M9 13.5V3.5a1.5 1.5 0 0 1 3 0v6a1.5 1.5 0 0 1 3 0v1a1.5 1.5 0 0 1 3 0v1a1.5 1.5 0 0 1 3 0V16c0 3.3-2.7 6-6 6h-2.2c-1.9 0-3.4-.8-4.6-2.2l-3.9-3.4a1.4 1.4 0 0 1 2-2L9 16Z"
          fill="#fff"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 9.5V13M15 10.5V13M18 11.5V13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
