/**
 * Re-encodes a photo through a canvas: bounded to 1600px and 1 MB, and the EXIF (including GPS)
 * is gone. Browser-only, called from the report form.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  maxBytes = 1_000_000,
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa foto.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak bisa memproses foto.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = 0.85;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (blob && blob.size <= maxBytes) break;
    quality -= 0.15;
  }
  if (!blob) throw new Error("Foto gagal diproses.");
  if (blob.size > maxBytes) {
    throw new Error("Foto masih terlalu besar setelah dikompresi. Coba foto lain.");
  }
  return blob;
}
