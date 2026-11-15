import type { Metadata } from "next";
import Link from "next/link";
import { Camera } from "lucide-react";
import { ReportFeed } from "@/features/report/components/report-feed";

export const metadata: Metadata = {
  title: "Laporan warga · SiagaKU",
  description:
    "Peta laporan genangan warga DKI Jakarta dalam 72 jam terakhir. Laporan berlabel Contoh adalah data demonstrasi, bukan kejadian nyata.",
};

export default function LaporanPage() {
  return (
    <article className="sk-page sk-laporan-page">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Laporan warga · 72 jam terakhir</p>
          <h1>Peta laporan warga</h1>
          <p>
            Titik kamera adalah laporan warga yang sudah diperiksa AI. Peta ini
            menampilkan laporan 72 jam terakhir, bukan seluruh riwayat banjir.
          </p>
          <div className="btn-row">
            <Link className="btn btn--primary" href="/lapor">
              <Camera size={16} aria-hidden="true" />
              Lapor genangan
            </Link>
          </div>
        </header>

        <ReportFeed />

        <p className="sk-detail-note">
          Laporan warga belum diverifikasi petugas; ini bukan peringatan resmi.
          Laporan berlabel <b>Contoh</b> adalah data demonstrasi. Peringatan resmi
          tetap dari BMKG dan BPBD DKI Jakarta. Untuk darurat, hubungi 112.
        </p>
      </div>
    </article>
  );
}
