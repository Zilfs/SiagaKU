import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Moments } from "@/components/taste/moments";
import { PALETTE } from "@/lib/palette";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

// The whole interface, display sizes, body copy and numerals use Jakarta Sans (Hirzi, 15 Nov).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Absolute URLs for the share image; the production URL when NEXT_PUBLIC_SITE_URL is unset.
const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

const TITLE = "SiagaKU: Cek risiko banjir Jakarta per kecamatan";
const DESCRIPTION =
  "Cek skor risiko banjir kecamatanmu hari ini, lihat dari mana angkanya, lalu susun rencana siaga keluarga. Tanpa akun, tanpa data pribadi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // One share card for the whole site (pages keep their own <title>); the image is app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: "SiagaKU",
    locale: "id_ID",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: "SiagaKU",
    statusBarStyle: "default",
  },
  other: {
    "site-kind": "software",
    "page-type": "software",
  },
};

export const viewport: Viewport = {
  themeColor: PALETTE.bg,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-type="software"
      data-radius="soft"
      data-ground="sky"
      data-buttons="solid"
      data-motion=""
      // Next switches smooth scrolling off for route changes, so a new page starts at the top at once
      data-scroll-behavior="smooth"
      className={`${jakarta.variable}`}
    >
      <body>
        <link rel="stylesheet" href="/taste/motion.css" precedence="default" />
        <Script
          id="boot-classes"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "window.__momentsManual=true;document.documentElement.classList.add('m-enter','mo-js');setTimeout(function(){document.documentElement.classList.add('m-enter-done')},700);setTimeout(function(){document.documentElement.classList.add('mo-safe')},2500)",
          }}
        />
        {children}
        {/* The moments loader mutates the DOM, so it mounts after hydration (idle after load). */}
        <Moments />
      </body>
    </html>
  );
}
