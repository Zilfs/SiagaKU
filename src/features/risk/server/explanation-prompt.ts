import { RISK_LEVEL_LABELS } from "@/lib/risk/level";
import { RAINFALL_CATEGORY_LABELS } from "@/lib/risk/score";
import type { RiskDetail } from "../types";

export const EXPLANATION_SYSTEM = `Kamu asisten kesiapsiagaan banjir SiagaKU untuk warga DKI Jakarta.
Aturan:
- Tulis dalam Bahasa Indonesia yang sederhana dan tenang.
- "explanation": 2–4 kalimat, maksimal 400 karakter, jelaskan arti risiko hari ini dan alasannya dari data.
- Jangan menyatakan banjir pasti terjadi; gunakan kata "berpotensi" atau "risiko".
- "mainAction": satu tindakan paling penting hari ini, maksimal 120 karakter.
- Jangan menulis nomor telepon apa pun selain 112.
- Hanya gunakan data yang diberikan; jangan mengarang angka atau lokasi.`;

export function buildExplanationPrompt(d: RiskDetail): string {
  const c = d.components;
  const rain =
    c.maxRainfallMm === null
      ? "data prakiraan hujan tidak tersedia"
      : `${c.maxRainfallMm} mm (${RAINFALL_CATEGORY_LABELS[c.rainfallCategory ?? "none"]})`;
  const history = d.floodHistory.length
    ? d.floodHistory
        .slice(0, 5)
        .map(
          (e) =>
            `${e.date}${e.subdistrict ? ` ${e.subdistrict}` : ""}${e.maxDepthCm ? ` ${e.maxDepthCm} cm` : ""}`,
        )
        .join("; ")
    : "tidak ada catatan";

  return [
    `Kecamatan: ${d.district.name} (${d.district.city})`,
    `Skor risiko hari ini: ${d.score}/100, level ${RISK_LEVEL_LABELS[d.level]}`,
    `Kerawanan dasar: ${c.baseVulnerability}/100; faktor hujan: ${c.rainfallFactor}/100`,
    `Hujan maksimum 3 hari ke depan: ${rain}`,
    `Wilayah pesisir rawan rob: ${d.district.tidalFloodProne ? "ya" : "tidak"}`,
    `Riwayat banjir terbaru: ${history}`,
  ].join("\n");
}
