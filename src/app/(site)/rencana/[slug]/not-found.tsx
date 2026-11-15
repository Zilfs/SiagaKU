import Link from "next/link";

export default function PlanNotFound() {
  return (
    <article className="sk-page sk-missing">
      <div className="wrap">
        <p className="sk-eyebrow">404 · Rencana tidak ditemukan</p>
        <h1>Rencana itu tidak ada atau sudah dihapus.</h1>
        <p className="sk-detail-lede">
          Tautan rencana mungkin sudah kedaluwarsa. Buat rencana baru dalam tiga
          langkah, lalu bagikan tautannya lagi.
        </p>
        <div className="sk-detail-actions">
          <Link className="btn btn--primary" href="/rencana">
            Buat rencana siaga
          </Link>
          <Link className="link" href="/">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </article>
  );
}
