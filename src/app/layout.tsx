import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Epilogue, JetBrains_Mono } from "next/font/google";
import { Moments } from "@/components/taste/Moments";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiagaKU: Cek risiko banjir Jakarta per kecamatan",
  description:
    "Cek skor risiko banjir kecamatanmu hari ini, lihat dari mana angkanya, lalu susun rencana siaga keluarga. Tanpa akun, tanpa data pribadi.",
  other: {
    "site-kind": "software",
    "page-type": "software",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7fafc",
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
      className={`${epilogue.variable} ${jetbrains.variable}`}
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
