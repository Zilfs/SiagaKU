/** Pure wizard rules, so the boundaries can be tested without the DOM. */

export type WizardCheck = {
  districtId: number | "";
  total: number;
  hasDisability: boolean;
  disabilityCount: number;
};

/** Known slug wins; an unknown slug falls back to the first district instead of an empty select. */
export function initialDistrictId(
  districts: { id: number; slug: string }[],
  initialSlug?: string,
): number | "" {
  return (
    districts.find((district) => district.slug === initialSlug)?.id ??
    districts[0]?.id ??
    ""
  );
}

/** The message for the step, or null when it can advance. Step 2 has no extra rule. */
export function wizardError(step: number, state: WizardCheck): string | null {
  if (step === 0) {
    return state.districtId === "" ? "Pilih kecamatan dulu." : null;
  }
  if (step === 1) {
    if (state.total < 1) return "Isi minimal satu anggota keluarga.";
    if (state.total > 15) return "Total anggota keluarga maksimal 15.";
    if (state.hasDisability && state.disabilityCount === 0) {
      return "Pilih minimal satu jenis disabilitas.";
    }
    return null;
  }
  return null;
}
