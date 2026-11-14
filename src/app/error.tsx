"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p>
        Halaman ini gagal dimuat. Coba lagi sebentar. Dalam keadaan darurat,
        hubungi{" "}
        <a className="underline" href="tel:112">
          112
        </a>
        .
      </p>
      {error.digest && (
        <p className="text-sm opacity-70">Kode: {error.digest}</p>
      )}
      <button
        type="button"
        className="rounded border px-4 py-2"
        onClick={() => reset()}
      >
        Coba lagi
      </button>
    </main>
  );
}
