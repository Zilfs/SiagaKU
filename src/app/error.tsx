"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="sk-page sk-page--bare sk-missing">
      <div className="wrap">
        <p className="sk-eyebrow">Galat · SiagaKU</p>
        <h1>Terjadi kesalahan</h1>
        <p className="sk-detail-lede">
          Halaman ini gagal dimuat. Coba lagi sebentar. Dalam keadaan darurat,
          hubungi{" "}
          <a className="link" href="tel:112">
            112
          </a>
          .
        </p>
        {error.digest && (
          <p className="sk-mono t-small muted">Kode: {error.digest}</p>
        )}
        <div className="sk-detail-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => reset()}
          >
            Coba lagi
          </button>
          <Link className="link" href="/">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
