import type { Metadata } from "next";
import { connection } from "next/server";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { findDistrict } from "@/features/risk/server/risk-repository";

export const metadata: Metadata = {
  title: "Tanya SiagaKU · SiagaKU",
  description:
    "Tanya apa saja soal persiapan menghadapi banjir. Jawaban bersumber dari pedoman BNPB dan BPBD, dengan sumber di tiap jawaban.",
};

export const instant = false;

export default async function TanyaPage({ searchParams }: PageProps<"/tanya">) {
  await connection();
  const params = await searchParams;
  const slug =
    typeof params.kecamatan === "string" ? params.kecamatan : undefined;

  let context: { id: number; name: string; city: string } | null = null;
  if (slug) {
    try {
      const district = await findDistrict(slug);
      if (district) {
        context = {
          id: district.id,
          name: district.name,
          city: district.city,
        };
      }
    } catch (error) {
      console.error("GET district context for the chat failed", slug, error);
    }
  }

  return (
    <article className="sk-page sk-tanya">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Tanya · SiagaKU</p>
          <h1>Tanya SiagaKU</h1>
          <p>
            Tanyakan apa saja soal persiapan menghadapi banjir. Jawaban kami
            bersumber dari pedoman BNPB dan BPBD, dengan sumber di tiap jawaban.
          </p>
        </header>

        <div className="sk-tanya__grid">
          <ChatPanel
            kecamatanId={context?.id}
            kecamatanName={context?.name}
          />

          <aside className="sk-tanya__aside" aria-label="Tentang jawaban">
            <div className="sk-card">
              <div className="sk-card__head">
                <h2>Dari mana jawabannya</h2>
              </div>
              <p>
                Setiap jawaban diambil dari pedoman resmi BNPB dan BPBD DKI
                Jakarta. Nomor sumber muncul di akhir jawaban, jadi kamu bisa
                memeriksa sendiri.
              </p>
              <p className="sk-mono t-small muted">
                Bukan peringatan resmi. Untuk darurat, hubungi 112.
              </p>
            </div>

            <div className="sk-card sk-tanya__call">
              <div className="sk-card__head">
                <h2>Darurat</h2>
                <span className="sk-mono">24 jam</span>
              </div>
              <p>
                Air sudah masuk rumah atau ada orang terjebak? Jangan menunggu
                jawaban chat.
              </p>
              <a className="btn btn--primary" href="tel:112">
                Telepon 112
              </a>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
