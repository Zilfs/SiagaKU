import type { RiskLevel } from "@/lib/risk/level";

/** The one plain-language action for each level (presentational copy, not data). */
export function riskAction(level: RiskLevel): string {
  switch (level) {
    case "very_high":
      return "Siapkan tas siaga dan rencanakan tempat mengungsi sekarang.";
    case "high":
      return "Pindahkan barang penting ke tempat tinggi dan cek jalur keluar.";
    case "moderate":
      return "Bersihkan saluran air di sekitar rumah dan simpan dokumen di tempat aman.";
    case "low":
      return "Simpan nomor darurat dan cek tas siaga keluarga tetap lengkap.";
  }
}
