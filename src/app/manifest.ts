import type { MetadataRoute } from "next";

/** The PWA manifest (docs/08 §8): installable, one screen, the brand's sea blue. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SiagaKU - Siaga Banjir Jakarta",
    short_name: "SiagaKU",
    description:
      "Cek risiko banjir kecamatanmu, susun rencana siaga keluarga, dan pantau peringatan dini di DKI Jakarta.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAFC",
    theme_color: "#0E5E8C",
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
