import { z } from "zod";

/** POST /api/reports/upload-url: the size and type of the file the browser will PUT. */
export const UploadPhotoSchema = z.object({
  content_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(1_500_000),
});

export type UploadPhotoInput = z.infer<typeof UploadPhotoSchema>;

/** POST /api/reports: the uploaded path plus the point the user picked or shared. */
export const CreateReportSchema = z.object({
  path: z
    .string()
    .regex(
      /^\d{4}\/\d{2}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp)$/,
      "Format path foto tidak dikenal.",
    ),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().trim().max(500).optional().default(""),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const REPORTS_DEFAULT_HOURS = 72;
export const REPORTS_MAX_HOURS = 168;

export const ReportsQuerySchema = z.object({
  hours: z.coerce
    .number()
    .int()
    .min(1)
    .max(REPORTS_MAX_HOURS)
    .default(REPORTS_DEFAULT_HOURS),
});

/** The AI's verdict on one photo (docs/05 A4). */
export const VisionResultSchema = z.object({
  apakah_banjir: z.boolean(),
  keparahan: z.number().int().min(0).max(4),
  estimasi_tinggi_air: z.string().max(80),
  ringkasan: z.string().max(160),
  confidence: z.number().min(0).max(1),
  alasan_tolak: z.string().max(160).optional(),
});

export type VisionResult = z.infer<typeof VisionResultSchema>;

/** Parse a stored verdict; anything malformed is treated as no verdict. */
export function parseVisionResult(value: unknown): VisionResult | null {
  const parsed = VisionResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** A report is public only when the model is confident it shows water. */
export function isPublicReport(value: unknown): boolean {
  const result = parseVisionResult(value);
  return result !== null && result.apakah_banjir && result.confidence >= 0.5;
}
