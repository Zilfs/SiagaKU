import { describe, expect, it } from "vitest";
import {
  initialDistrictId,
  wizardError,
  type WizardCheck,
} from "@/features/plan/wizard-validation";

const base: WizardCheck = {
  districtId: 1,
  total: 1,
  hasDisability: false,
  disabilityCount: 0,
};

describe("initialDistrictId", () => {
  const districts = [
    { id: 1, slug: "cipayung" },
    { id: 2, slug: "gambir" },
  ];

  it("uses the slug from the link", () => {
    expect(initialDistrictId(districts, "gambir")).toBe(2);
  });

  it("falls back to the first district for an unknown slug", () => {
    expect(initialDistrictId(districts, "salah")).toBe(1);
  });

  it("is empty when there are no districts", () => {
    expect(initialDistrictId([], "cipayung")).toBe("");
  });
});

describe("wizardError", () => {
  it("requires a district on step 0", () => {
    expect(wizardError(0, { ...base, districtId: "" })).toBe(
      "Pilih kecamatan dulu.",
    );
    expect(wizardError(0, base)).toBeNull();
  });

  it("keeps the household total between 1 and 15", () => {
    expect(wizardError(1, { ...base, total: 0 })).toBe(
      "Isi minimal satu anggota keluarga.",
    );
    expect(wizardError(1, { ...base, total: 1 })).toBeNull();
    expect(wizardError(1, { ...base, total: 15 })).toBeNull();
    expect(wizardError(1, { ...base, total: 16 })).toBe(
      "Total anggota keluarga maksimal 15.",
    );
  });

  it("requires a disability type when the household has one", () => {
    expect(
      wizardError(1, { ...base, hasDisability: true, disabilityCount: 0 }),
    ).toBe("Pilih minimal satu jenis disabilitas.");
    expect(
      wizardError(1, { ...base, hasDisability: true, disabilityCount: 1 }),
    ).toBeNull();
    expect(wizardError(1, { ...base, hasDisability: false })).toBeNull();
  });

  it("has no extra rule on the last step", () => {
    expect(wizardError(2, { ...base, total: 0 })).toBeNull();
  });
});
