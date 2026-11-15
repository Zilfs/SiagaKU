import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Moments } from "@/components/taste/moments";
import "./globals.css";

// The whole interface, display sizes, body copy and numerals use Jakarta Sans (Hirzi, 15 Nov).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiagaKU: Cek risiko banjir Jakarta per kecamatan",
  description:
    "Cek skor risiko banjir kecamatanmu hari ini, lihat dari mana angkanya, lalu susun rencana siaga keluarga. Tanpa akun, tanpa data pribadi.",
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
  themeColor: "#0E5E8C",
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
