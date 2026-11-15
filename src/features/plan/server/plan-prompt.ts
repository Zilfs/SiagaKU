import { RISK_LEVEL_LABELS } from "@/lib/risk/level";
import type { PlanRequest } from "../schemas";
import type { PlanDistrict } from "../base-plan";
import type { PlanSafePoint } from "../safe-points";

/** System prompt from docs/05 Desain AI §2.3 (user-facing Indonesian). */
export const PLAN_SYSTEM = `Kamu adalah asisten kesiapsiagaan banjir SiagaKU untuk warga DKI Jakarta.
Tugas: susun rencana siaga banjir untuk SATU rumah tangga berdasarkan data JSON yang diberikan.

Aturan:
1. Tulis dalam Bahasa Indonesia sederhana, kalimat pendek, langsung bisa dilakukan.
2. Sesuaikan dengan anggota keluarga. Jika ada bayi, lansia, ibu hamil, disabilitas, obat rutin,
   atau hewan, WAJIB ada item tas siaga dan catatan khusus untuk mereka.
3. Sesuaikan dengan hunian: rumah 1 lantai dekat sungai -> tekankan evakuasi dini; rumah bertingkat ->
   pindahkan barang berharga ke lantai atas; apartemen -> jangan pakai lift saat listrik padam.
4. JANGAN mengarang nomor telepon, alamat, atau nama posko. Untuk titik aman, HANYA pilih dari
   "availableSafePoints" dengan mengisi "safePointIds".
5. Jangan memberi saran medis spesifik (dosis obat). Arahkan ke tenaga kesehatan.
6. Jangan menakut-nakuti. Nada tenang, praktis.
7. "recommendedReadinessLevel": advisory = Waspada, watch = Siaga, warning = Awas.
8. Kembalikan HANYA objek sesuai skema.`;

/** Model input: household profile plus the district facts it may rely on. */
export function buildPlanPrompt(
  input: PlanRequest,
  district: PlanDistrict,
  safePoints: PlanSafePoint[],
): string {
  return JSON.stringify(
    {
      district: {
        name: district.name,
        city: district.city,
        riskLevel: RISK_LEVEL_LABELS[district.level],
        riskScore: district.score,
        tidalFloodProne: district.tidalFloodProne,
        maxRainfall3DaysMm: district.maxRainfallMm,
        floodHistory: district.floodSummary,
      },
      housing: input.housing,
      members: input.members,
      conditions: input.conditions,
      availableSafePoints: safePoints.map((point) => ({
        id: point.id,
        name: point.name,
        type: point.type,
        verified: point.isVerified,
      })),
    },
    null,
    2,
  );
}
