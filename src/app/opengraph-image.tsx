import { ImageResponse } from "next/og";
import { PALETTE } from "@/lib/palette";

export const alt = "SiagaKU: cek risiko banjir Jakarta per kecamatan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's share card: the sky ground, the shield mark and wordmark, the tagline. Built at build time. */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: PALETTE.bg,
        color: PALETTE.ink,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <svg width="104" height="120" viewBox="0 0 26 30">
          <path
            d="M13 1.6 24.2 5.7v9.6c0 6.6-4.8 11.5-11.2 13.1C6.6 26.8 1.8 21.9 1.8 15.3V5.7z"
            fill="none"
            stroke={PALETTE.ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M13 8.4c2.9 3.2 4.5 5.4 4.5 7.7a4.5 4.5 0 0 1-9 0c0-2.3 1.6-4.5 4.5-7.7z"
            fill={PALETTE.blue}
          />
        </svg>
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4 }}>
          SiagaKU
        </div>
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: 52,
          fontWeight: 600,
          lineHeight: 1.2,
          maxWidth: 900,
        }}
      >
        Cek risiko banjir Jakarta per kecamatan, hari ini.
      </div>
      <div style={{ marginTop: 24, fontSize: 32, color: PALETTE.muted }}>
        Rencana siaga keluarga · Tanpa akun, tanpa data pribadi
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          display: "flex",
          background: PALETTE.blue,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 64,
          width: 220,
          height: 10,
          display: "flex",
          background: PALETTE.ink,
        }}
      />
    </div>,
    size,
  );
}
