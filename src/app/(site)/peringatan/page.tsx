import { Info } from "lucide-react";
import type { Metadata } from "next";
import { districtNameFromSlug } from "@/features/early-warning/alert-data";
import { WatchArea } from "@/features/early-warning/components/watch-area";

export const metadata: Metadata = {
  title: "Peringatan dini banjir · SiagaKU",
  description:
    "Pantau kelurahanmu dan dapatkan kabar saat wilayah berpotensi banjir: status Normal, Waspada, Siaga, atau Awas dari prakiraan BMKG dan kerawanan wilayah.",
};

// the district context comes from searchParams, so the page waits for the request
export const instant = false;

export default async function PeringatanPage({
  searchParams,
}: PageProps<"/peringatan">) {
  const params = await searchParams;
  const value = params?.kecamatan;
  const districtSlug = Array.isArray(value) ? value[0] : value;
  const districtName = districtSlug
    ? districtNameFromSlug(districtSlug)
    : undefined;

  return (
    <article className="sk-page sk-alert-page">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Peringatan dini · DKI Jakarta</p>
          <h1>Peringatan dini banjir</h1>
          <p>
            Pantau satu kelurahan dan dapatkan kabar saat wilayahnya berpotensi
            banjir. Status dihitung dari prakiraan BMKG per kelurahan dan
            kerawanan wilayah, bukan dari berita yang beredar.
          </p>
        </header>

        <div className="sk-alert-grid">
          <WatchArea districtName={districtName} />

          <section className="sk-card sk-alert-how" aria-labelledby="cara-h">
            <div className="sk-card__head">
              <h2 id="cara-h" className="sk-heading-icon">
                <Info size={18} aria-hidden="true" />
                Cara kerja
              </h2>
            </div>
            <ol>
              <li>
                Prakiraan hujan 24 jam BMKG per kelurahan digabung dengan
                kerawanan wilayah.
              </li>
              <li>
                Hasilnya satu status: <b>Normal</b>, <b>Waspada</b>,{" "}
                <b>Siaga</b>, atau <b>Awas</b>.
              </li>
              <li>
                Banner di halaman ini muncul hanya untuk status Siaga dan Awas.
                Notifikasi push dikirim saat status naik, paling sering tiap 6
                jam.
              </li>
            </ol>
            <p className="sk-field__hint">
              Ini potensi, bukan kepastian. Peringatan resmi tetap dari BMKG dan
              BPBD DKI Jakarta.
            </p>
          </section>
        </div>

        <p className="sk-detail-note">
          Data peringatan bergantung pada layanan BMKG dan ketersediaan data
          kelurahan. Untuk darurat, hubungi 112.
        </p>
      </div>
    </article>
  );
}
