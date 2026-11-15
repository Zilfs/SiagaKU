/**
 * The shelter types come from the database as English enums; the UI never shows the raw value.
 * Shared by the district page and the plan page (AGENTS.md §8, one label map).
 */
const LABELS: Record<string, string> = {
  subdistrict_office: "Kantor kelurahan",
  mosque: "Masjid",
  school: "Sekolah",
  other: "Titik aman",
};

export function safePointTypeLabel(type: string): string {
  return LABELS[type] ?? "Titik aman";
}
