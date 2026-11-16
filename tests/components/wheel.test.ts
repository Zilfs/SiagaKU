import { describe, expect, it } from "vitest";
import { wheelPixels } from "@/components/layout/wheel";

const wheel = (over: Partial<Parameters<typeof wheelPixels>[0]>) =>
  wheelPixels({ deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, ...over });

describe("wheelPixels", () => {
  it("returns the distance of a notched mouse wheel", () => {
    expect(wheel({ deltaY: 100 })).toBe(100);
    expect(wheel({ deltaY: -120 })).toBe(-120);
  });

  it("converts line-mode wheels (Firefox) to pixels", () => {
    expect(wheel({ deltaY: 3, deltaMode: 1 })).toBe(120);
  });

  it("leaves trackpads, pinch zoom, sideways and page-mode scrolling to the browser", () => {
    expect(wheel({ deltaY: 4 })).toBeNull();
    expect(wheel({ deltaY: 100, ctrlKey: true })).toBeNull();
    expect(wheel({ deltaY: 60, deltaX: 90 })).toBeNull();
    expect(wheel({ deltaY: 1, deltaMode: 2 })).toBeNull();
    expect(wheel({})).toBeNull();
  });
});
