import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmergencyDialog } from "@/components/layout/EmergencyDialog";

describe("EmergencyDialog", () => {
  it("offers the 112 call link and says what it is for", () => {
    const html = renderToStaticMarkup(<EmergencyDialog />);
    expect(html).toContain('href="tel:112"');
    expect(html).toContain("Hubungi 112");
    expect(html).toContain("gratis 24 jam");
  });

  it("is a labelled native dialog with a close control", () => {
    const html = renderToStaticMarkup(<EmergencyDialog />);
    expect(html).toContain("<dialog");
    expect(html).toContain('aria-labelledby="darurat-h"');
    expect(html).toContain("Tutup dialog darurat");
  });
});
