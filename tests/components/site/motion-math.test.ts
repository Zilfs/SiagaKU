import { describe, expect, it } from "vitest";
import { formatCount, pointIn } from "@/components/site/motion-math";

describe("formatCount", () => {
  it("rounds the tweened value", () => {
    expect(formatCount(21.6, 44)).toBe("22");
  });

  it("never passes the target or drops below zero", () => {
    expect(formatCount(44.4, 44)).toBe("44");
    expect(formatCount(-0.2, 44)).toBe("0");
  });
});

describe("pointIn", () => {
  const root = { left: 100, top: 50, width: 300, height: 200 };

  it("places the anchor on the target's centre, relative to the root", () => {
    const target = { left: 140, top: 90, width: 60, height: 20 };
    expect(pointIn(target, root)).toEqual({ x: 70, y: 50 });
  });

  it("subtracts the anchor offset (the cursor's fingertip)", () => {
    const target = { left: 140, top: 90, width: 60, height: 20 };
    expect(pointIn(target, root, { x: 12, y: 2 })).toEqual({ x: 58, y: 48 });
  });
});
