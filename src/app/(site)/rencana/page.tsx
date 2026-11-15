import type { Metadata } from "next";
import { connection } from "next/server";
import { PlanWizard } from "@/features/plan/components/plan-wizard";
import type { DistrictOption } from "@/features/plan/ui-types";
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

  let districts: DistrictOption[] = [];
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

        <PlanWizard districts={districts} initialSlug={initialSlug} />
      </div>
    </article>
  );
}
