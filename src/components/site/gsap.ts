"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// the one place GSAP plugins are registered; only the landing's client components import this
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

/** Motion runs only for viewers who have not asked for less of it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
