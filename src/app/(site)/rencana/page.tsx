import type { Metadata } from "next";
import { connection } from "next/server";
import { ListChecks, ShieldCheck } from "lucide-react";
import { PlanWizard } from "@/features/plan/components/plan-wizard";
import type { PlanDistrict } from "@/features/plan/ui-types";
import { listDistrictsWithScore } from "@/features/risk/server/risk-service";

export const metadata: Metadata = {
  title: "Buat rencana siaga keluarga · SiagaKU",
  description:
    "Susun rencana siaga banjir untuk keluargamu dalam tiga langkah: wilayah dan hunian, anggota keluarga, lalu kondisi rumah.",
};

export const instant = false;

export default async function RencanaPage({
  searchParams,
}: PageProps<"/rencana">) {
  await connection();
  const params = await searchParams;
  const initialSlug =
    typeof params.kecamatan === "string" ? params.kecamatan : undefined;

  let districts: PlanDistrict[] = [];
  try {
    const list = await listDistrictsWithScore();
    districts = list.map(({ id, slug, name, city }) => ({
      id,
      slug,
      name,
      city,
    }));
  } catch (error) {
    console.error("GET districts for the plan wizard failed", error);
  }

  return (
    <article className="sk-page sk-rencana">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Rencana · SiagaKU</p>
          <h1>Rencana siaga keluarga</h1>
          <p>
            Tiga langkah singkat: wilayah dan hunian, anggota keluarga, lalu
            kondisi rumah. Kami susun daftar perlengkapan dan langkah yang
            sesuai dengan keluargamu.
          </p>
        </header>

        <div className="sk-rencana__grid">
          <PlanWizard districts={districts} initialSlug={initialSlug} />

          <aside className="sk-aside" aria-label="Tentang rencana siaga">
            <section className="sk-card" aria-labelledby="rencana-isi">
              <div className="sk-card__head">
                <h2 id="rencana-isi" className="sk-heading-icon">
                  <ListChecks size={18} aria-hidden="true" />
                  Isi rencanamu
                </h2>
              </div>
              <ul className="sk-aside__list">
                <li>Checklist tas siaga sesuai anggota keluarga.</li>
                <li>Langkah sebelum, saat, dan setelah banjir.</li>
                <li>Catatan untuk bayi, lansia, dan disabilitas.</li>
                <li>Titik aman terdekat dan kontak darurat.</li>
              </ul>
            </section>

            <section className="sk-card" aria-labelledby="rencana-privasi">
              <div className="sk-card__head">
                <h2 id="rencana-privasi" className="sk-heading-icon">
                  <ShieldCheck size={18} aria-hidden="true" />
                  Tanpa akun
                </h2>
              </div>
              <p>
                Rencana disimpan di balik tautan yang bisa kamu bagikan atau
                cetak. Tidak ada nama, alamat lengkap, atau nomor telepon yang
                diminta.
              </p>
              <p className="sk-field__hint">
                Rencana memakai data risiko wilayah hari ini, bukan perkiraan
                cuaca esok hari.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </article>
  );
}
