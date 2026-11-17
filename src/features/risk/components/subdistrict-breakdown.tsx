import type {
  SubdistrictBreakdown as Breakdown,
  SubdistrictSummary,
} from "@/features/risk/types";
import { formatDistance } from "@/lib/geo";

/** Rows shown before the "more" disclosure, the same count as the safe points card. */
const NEAREST = 5;

function row(item: SubdistrictSummary) {
  const facts =
    item.eventCount === 0
      ? "Belum ada kejadian tercatat"
      : `${item.eventCount} kejadian${
          item.maxDepthCm === null ? "" : ` · terdalam ${item.maxDepthCm} cm`
        }`;
  return (
    <li key={item.code}>
      <span className="sk-subdistricts__name">
        <b>{item.name}</b>
        <span>{facts}</span>
        {item.floodProne ? (
          <span className="sk-subdistricts__badge">
            Rawan 2023
            {item.floodProneRwCount === null
              ? ""
              : ` · ${item.floodProneRwCount} RW`}
          </span>
        ) : null}
      </span>
      <span className="sk-subdistricts__near">
        {item.nearestSafePoint
          ? `Titik aman terdekat: ${item.nearestSafePoint.name} · ${formatDistance(item.nearestSafePoint.km)}`
          : "Titik aman terdekat: belum ada data lokasi"}
      </span>
    </li>
  );
}

/** Per-subdistrict flood facts for one district; rows arrive sorted from the service. */
export function SubdistrictBreakdown({
  breakdown,
  districtName,
}: {
  breakdown: Breakdown | null;
  districtName: string;
}) {
  const rows = breakdown?.rows ?? [];
  return (
    <section className="sk-card sk-subdistricts" aria-labelledby="kelurahan-h">
      <div className="sk-card__head">
        <h2 id="kelurahan-h">Kelurahan di {districtName}</h2>
        <span className="sk-mono">riwayat 2025–2026</span>
      </div>
      {breakdown === null || rows.length === 0 ? (
        <p className="sk-list__empty">
          Daftar kelurahan untuk kecamatan ini belum tersedia.
        </p>
      ) : (
        <>
          <ul className="sk-subdistricts__list">
            {rows.slice(0, NEAREST).map(row)}
          </ul>
          {rows.length > NEAREST ? (
            <details className="sk-safepoints__more">
              <summary>Lihat {rows.length - NEAREST} kelurahan lainnya</summary>
              <ul className="sk-subdistricts__list">
                {rows.slice(NEAREST).map(row)}
              </ul>
            </details>
          ) : null}
          {breakdown.unmatchedEventCount > 0 ? (
            <p className="sk-subdistricts__note">
              {breakdown.unmatchedEventCount} kejadian lain tidak menyebut
              kelurahan yang cocok, tetap dihitung di riwayat kecamatan.
            </p>
          ) : null}
        </>
      )}
      <p className="sk-subdistricts__note">
        Sumber: rilis genangan BPBD DKI dan daftar daerah tergenang 2023 (Dinas
        SDA DKI). Tanpa kejadian tercatat bukan berarti bebas banjir.
      </p>
    </section>
  );
}
