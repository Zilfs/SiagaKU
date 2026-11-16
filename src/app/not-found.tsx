import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyDialog } from "@/components/layout/emergency-dialog";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan · SiagaKU",
};

/**
 * Unmatched URLs render here, inside the root layout but above the (site) layout, so the page brings
 * its own header, footer and emergency dialog.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="top" className="sk-page sk-missing">
        <div className="wrap">
          <p className="sk-eyebrow">404 · Halaman tidak ditemukan</p>
          <h1>Halaman itu tidak ada di SiagaKU.</h1>
          <p className="sk-detail-lede">
            Alamatnya mungkin salah ketik atau halamannya sudah dipindah. Mulai
            lagi dari cek risiko kecamatanmu atau dari peta.
          </p>
          <div className="sk-detail-actions">
            <Link className="btn btn--primary" href="/#cari">
              Cek risiko wilayah
            </Link>
            <Link className="btn btn--secondary" href="/peta">
              Buka peta risiko
            </Link>
            <Link className="link" href="/">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <EmergencyDialog />
    </>
  );
}
