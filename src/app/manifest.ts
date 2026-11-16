import type { MetadataRoute } from "next";
import { PALETTE } from "@/lib/palette";

/** The PWA manifest (docs/08 §8): installable, one screen, the Cloudy White of the header. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SiagaKU - Siaga Banjir Jakarta",
    short_name: "SiagaKU",
    description:
      "Cek risiko banjir kecamatanmu, susun rencana siaga keluarga, dan pantau peringatan dini di DKI Jakarta.",
    start_url: "/",
    display: "standalone",
    background_color: PALETTE.bg,
    theme_color: PALETTE.bg,
    lang: "id",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
