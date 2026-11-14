import Link from "next/link";

export default function DistrictNotFound() {
  return (
    <article className="sk-page sk-missing">
      <div className="wrap">
        <p className="sk-eyebrow">404 · Kecamatan tidak ditemukan</p>
        <h1>Kecamatan itu belum ada di SiagaKU.</h1>
        <p className="sk-detail-lede">
          SiagaKU untuk sekarang memuat kecamatan di DKI Jakarta. Cek ejaan
          namamu, atau mulai dari peta dan daftar wilayah.
        </p>
        <div className="sk-detail-actions">
          <Link className="btn btn--primary" href="/peta">
            Buka peta wilayah
          </Link>
          <Link className="link" href="/">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </article>
  );
}
