import type { Metadata } from "next";
import Link from "next/link";
import { Info, ShieldCheck } from "lucide-react";
import { connection } from "next/server";
import { ReportForm } from "@/features/report/components/report-form";
import type { ReportDistrict } from "@/features/report/types";
import { listDistricts } from "@/features/risk/server/risk-repository";

export const metadata: Metadata = {
  title: "Lapor genangan · SiagaKU",
  description:
    "Laporkan genangan atau banjir di sekitarmu dengan foto dan lokasi. AI memeriksa foto, lalu laporan tampil di peta laporan warga.",
};

export default async function LaporPage() {
  await connection();
  let districts: ReportDistrict[] = [];
  try {
    districts = (await listDistricts()).map(
      ({ id, slug, name, city, lat, lng }) => ({
        id,
        slug,
        name,
        city,
        lat,
        lng,
      }),
    );
  } catch (error) {
    console.error("GET districts for the report form failed", error);
  }

  return (
    <article className="sk-page sk-lapor-page">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Lapor genangan · DKI Jakarta</p>
          <h1>Lapor genangan di sekitarmu</h1>
          <p>
            Satu foto dan lokasi membantu warga lain melihat di mana air sedang
            naik. Tanpa akun, tanpa nama, tanpa alamat lengkap.
          </p>
        </header>

        <div className="sk-lapor-grid">
          <ReportForm districts={districts} />

          <aside className="sk-lapor-aside" aria-label="Panduan laporan">
            <section className="sk-card" aria-labelledby="lapor-cara-h">
              <div className="sk-card__head">
                <h2 id="lapor-cara-h" className="sk-heading-icon">
                  <Info size={18} aria-hidden="true" />
                  Cara kerja
                </h2>
                <span className="sk-mono">AI · warga</span>
              </div>
              <ol>
                <li>
                  <b>Foto.</b> Foto genangan dengan patokan jalan, misalnya ban
                  motor atau lutut orang dewasa. Foto dikompres di perangkatmu
                  dan EXIF (termasuk lokasi GPS) dihapus.
                </li>
                <li>
                  <b>Lokasi.</b> Pilih kecamatan atau gunakan lokasimu. Yang
                  dipakai hanya titik koordinat, bukan alamat.
                </li>
                <li>
                  <b>AI memeriksa.</b> Foto dinilai: apakah ada genangan,
                  seberapa parah, dan perkiraan tinggi air. Laporan yang bukan
                  genangan tidak ditampilkan.
                </li>
              </ol>
              <p className="sk-field__hint">
                Laporan warga belum diverifikasi petugas. Untuk darurat, hubungi
                112.
              </p>
              <p className="sk-field__hint">
                Laporan tampil di{" "}
                <Link className="link" href="/laporan">
                  peta laporan warga
                </Link>{" "}
                selama 72 jam terakhir.
              </p>
            </section>

            <section className="sk-card" aria-labelledby="lapor-privasi-h">
              <div className="sk-card__head">
                <h2 id="lapor-privasi-h" className="sk-heading-icon">
                  <ShieldCheck size={18} aria-hidden="true" />
                  Privasi foto
                </h2>
              </div>
              <p>
                Foto dikirim tanpa data EXIF, termasuk lokasi GPS. Yang
                disimpan hanya titik koordinat: kecamatan yang kamu pilih, atau
                lokasimu bila kamu memakai tombol lokasi. Bukan alamat.
              </p>
              <p className="sk-field__hint">
                Jangan memotret wajah orang lain atau data pribadi di sekitar
                genangan.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </article>
  );
}

// live district list: the form needs the current database contents
export const instant = false;
