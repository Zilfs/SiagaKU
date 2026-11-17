import { MapPin } from "lucide-react";
import type {
  SubdistrictBreakdown as Breakdown,
  SubdistrictSummary,
} from "@/features/risk/types";
import { formatDistance } from "@/lib/geo";

/** Rows shown before the "more" disclosure, the same count as the safe points card. */
const NEAREST = 5;

/**
 * One subdistrict as a comparison row: name, recorded floods, nearest safe point. Each cell
 * carries its own label (visible on phones, screen-reader only beside the desktop column header).
 */
function Row({
  item,
  mostEvents,
}: {
  item: SubdistrictSummary;
  mostEvents: number;
}) {
  const quiet = item.eventCount === 0;
  // the bar follows the sort key (event count), so it shrinks down the list
  const share = Math.round((item.eventCount / Math.max(1, mostEvents)) * 100);
  return (
    <li className={quiet ? "is-quiet" : undefined}>
      <div className="sk-subdistricts__name">
        <b>{item.name}</b>
        {item.floodProne ? (
          <span className="sk-subdistricts__badge">
            Rawan 2023
            {item.floodProneRwCount === null
              ? ""
              : ` · ${item.floodProneRwCount} RW`}
          </span>
        ) : null}
      </div>

      <div className="sk-subdistricts__floods">
        <span className="sk-subdistricts__cap">Genangan tercatat: </span>
        {quiet ? (
          <span className="sk-subdistricts__none">
            Belum ada kejadian tercatat
          </span>
        ) : (
          <>
            <span className="sk-subdistricts__stats">
              <span>
                <b className="sk-mono">{item.eventCount}</b> kejadian
              </span>
              {item.maxDepthCm === null ? null : (
                <span>
                  terdalam <b className="sk-mono">{item.maxDepthCm} cm</b>
                </span>
              )}
            </span>
            <span
              className="sk-subdistricts__bar"
              style={{ "--share": `${share}%` } as React.CSSProperties}
              aria-hidden="true"
            />
          </>
        )}
      </div>

      <div className="sk-subdistricts__near">
        <span className="sk-subdistricts__cap">Titik aman terdekat: </span>
        <MapPin size={16} aria-hidden="true" />
        {item.nearestSafePoint ? (
          <>
            <span className="sk-subdistricts__place">
              {item.nearestSafePoint.name}
            </span>
            <span className="sk-mono sk-subdistricts__dist">
              {formatDistance(item.nearestSafePoint.km)}
            </span>
          </>
        ) : (
          <span className="sk-subdistricts__place">belum ada data lokasi</span>
        )}
      </div>
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
  const withEvents = rows.filter((r) => r.eventCount > 0).length;
  const floodProne = rows.filter((r) => r.floodProne).length;
  const mostEvents = Math.max(0, ...rows.map((r) => r.eventCount));
  const list = (items: SubdistrictSummary[]) => (
    <ul className="sk-subdistricts__list">
      {items.map((item) => (
        <Row key={item.code} item={item} mostEvents={mostEvents} />
      ))}
    </ul>
  );

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
          <p className="sk-subdistricts__summary">
            {withEvents} dari {rows.length} kelurahan punya kejadian tercatat ·{" "}
            {floodProne} masuk daftar rawan 2023
          </p>
          <div className="sk-subdistricts__cols" aria-hidden="true">
            <span>Kelurahan</span>
            <span>Genangan tercatat</span>
            <span>Titik aman terdekat</span>
          </div>
          {list(rows.slice(0, NEAREST))}
          {rows.length > NEAREST ? (
            <details className="sk-safepoints__more">
              <summary>Lihat {rows.length - NEAREST} kelurahan lainnya</summary>
              {list(rows.slice(NEAREST))}
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
