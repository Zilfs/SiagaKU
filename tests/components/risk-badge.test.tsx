import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { riskLabel, type RiskLevel } from "@/lib/demo/districts";

const LEVELS: RiskLevel[] = ["low", "moderate", "high", "very_high"];

describe("RiskBadge", () => {
  it("renders the Indonesian label and a hidden icon, not colour alone", () => {
    const html = renderToStaticMarkup(<RiskBadge level="high" />);
    expect(html).toContain("Tinggi");
    expect(html).toMatch(/aria-hidden="true"/);
    expect(html).toContain("sk-risk--high");
  });

  it("names every level in words", () => {
    for (const level of LEVELS) {
      const html = renderToStaticMarkup(<RiskBadge level={level} />);
      expect(html).toContain(riskLabel(level));
    }
  });

  it("shows the score in mono when one is passed", () => {
    const html = renderToStaticMarkup(<RiskBadge level="very_high" score={88} />);
    expect(html).toContain("88");
    expect(html).toContain("sk-mono");
  });
});
