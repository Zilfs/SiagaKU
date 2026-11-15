import { describe, expect, it } from "vitest";
import { safePointTypeLabel } from "@/lib/safe-point-label";

describe("safePointTypeLabel", () => {
  it("translates the database enums", () => {
    expect(safePointTypeLabel("subdistrict_office")).toBe("Kantor kelurahan");
    expect(safePointTypeLabel("mosque")).toBe("Masjid");
    expect(safePointTypeLabel("school")).toBe("Sekolah");
  });

  it("keeps an unknown type readable", () => {
    expect(safePointTypeLabel("other")).toBe("Titik aman");
    expect(safePointTypeLabel("baru")).toBe("Titik aman");
  });
});
