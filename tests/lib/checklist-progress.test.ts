import { describe, expect, it } from "vitest";
import { progressShare, visibleItems } from "@/lib/checklist-progress";

const items = [
  { item: "Air minum", priority: "required" },
  { item: "Senter", priority: "important" },
  { item: "Obat", priority: "required" },
  { item: "Mainan", priority: "optional" },
];

describe("progressShare", () => {
  it("counts the checked items among all items", () => {
    expect(progressShare(items, (i) => i.item === "Senter")).toBe(0.25);
    expect(progressShare(items, () => true)).toBe(1);
  });

  it("is 0 for an empty list", () => {
    expect(progressShare([], () => true)).toBe(0);
  });
});

describe("visibleItems", () => {
  it("keeps only the required items under the required filter", () => {
    expect(visibleItems(items, "required").map((i) => i.item)).toEqual([
      "Air minum",
      "Obat",
    ]);
  });

  it("keeps every item under the all filter", () => {
    expect(visibleItems(items, "all")).toBe(items);
  });

  it("fills the rail over the visible items: all required ticked is a full rail", () => {
    const required = (i: { priority: string }) => i.priority === "required";
    expect(progressShare(visibleItems(items, "required"), required)).toBe(1);
    expect(progressShare(items, required)).toBe(0.5);
  });
});
