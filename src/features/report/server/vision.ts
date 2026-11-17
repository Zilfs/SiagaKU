import "server-only";
import { generateText, Output } from "ai";
import { withFallback, type ProviderName } from "@/lib/ai/router";
import { VisionResultSchema, type VisionResult } from "../schemas";

export const VISION_PROMPT = `Kamu memeriksa satu foto laporan warga Jakarta tentang genangan atau banjir.

Nilai:
- apakah_banjir: true hanya jika terlihat air menggenang di jalan, gang, atau lingkungan permukiman.
- keparahan 0-4: 0 bukan banjir, 1 genangan tipis (di bawah 10 cm), 2 sedang (10-30 cm), 3 dalam (30-70 cm), 4 parah (di atas 70 cm).
- estimasi_tinggi_air: perkirakan dari patokan visual seperti ban motor, lutut orang dewasa, pintu, atau pagar. Tulis "tidak dapat diperkirakan" bila tidak ada patokan.
- ringkasan: satu kalimat, maksimal 160 karakter, tentang air dan lingkungan. Jangan menyebut wajah atau identitas orang.
- confidence: 0 sampai 1, seberapa yakin penilaianmu.
- alasan_tolak: isi bila bukan genangan, foto terlalu gelap/tidak jelas, atau tidak pantas.

Jangan menebak lokasi. Jangan menyebut merek, nomor polisi, atau nama orang.`;

export type VisionAnalysis = {
  result: VisionResult;
  provider: ProviderName;
  modelId: string;
  fallback: boolean;
};

export async function analyzePhoto(
  bytes: Uint8Array,
  mediaType: string,
): Promise<VisionAnalysis> {
  const { result, provider, modelId, fallback } = await withFallback(
    "vision",
    (entry) =>
      generateText({
        model: entry.model,
        output: Output.object({ schema: VisionResultSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              { type: "image", image: bytes, mediaType },
            ],
          },
        ],
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(entry.timeoutMs),
      }),
  );
  return {
    result: VisionResultSchema.parse(result.output),
    provider,
    modelId,
    fallback,
  };
}
