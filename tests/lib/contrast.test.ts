import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "@/lib/contrast";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("accepts 3-digit and uppercase hex", () => {
    expect(relativeLuminance("#FFF")).toBe(1);
  });

  it("rejects a value that is not a hex colour", () => {
    expect(() => relativeLuminance("rgb(0 0 0)")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#0099ff", "#0099ff")).toBe(1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#0b1b2e", "#fdfdfe")).toBe(
      contrastRatio("#fdfdfe", "#0b1b2e"),
    );
  });

  it("matches the brief's measured values", () => {
    expect(contrastRatio("#0099FF", "#FDFDFE")).toBeCloseTo(2.95, 2);
    expect(contrastRatio("#83FD80", "#FDFDFE")).toBeCloseTo(1.27, 2);
    expect(contrastRatio("#0B1B2E", "#0099FF")).toBeCloseTo(5.78, 1);
  });
});
