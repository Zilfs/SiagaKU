import type { RiskDetail } from "@/features/risk/types";
import { RAINFALL_CATEGORY_LABELS } from "@/lib/risk/score";

/** The two components of the score, with the weight each one carries (docs/06-data). */
export function ScoreBreakdown({
  components,
  noRainfallData,
}: {
  components: RiskDetail["components"];
  noRainfallData: boolean;
}) {
  const { baseVulnerability, rainfallFactor, maxRainfallMm, rainfallCategory } =
    components;
  return (
    <section className="sk-card sk-breakdown" aria-labelledby="skor-h">
      <div className="sk-card__head">
        <h2 id="skor-h">Dari mana skornya</h2>
        <span className="sk-mono">0–100</span>
      </div>
      <ul className="sk-bars">
        <li className="sk-bar">
          <span>Kerawanan dasar</span>
          <span className="sk-mono">{baseVulnerability} / 100</span>
          <span className="sk-bar__track" aria-hidden="true">
            <i style={{ width: `${baseVulnerability}%` }} />
          </span>
          <span className="sk-bar__note">
            Riwayat genangan dan bentuk lahan · bobot 0,55
          </span>
        </li>
        <li className="sk-bar">
          <span>Faktor hujan</span>
          <span className="sk-mono">
            {rainfallFactor} / 100
            {maxRainfallMm != null ? ` · ${maxRainfallMm} mm` : ""}
          </span>
          <span className="sk-bar__track" aria-hidden="true">
            <i style={{ width: `${rainfallFactor}%` }} />
          </span>
          <span className="sk-bar__note">
            Prakiraan tiga hari BMKG · bobot 0,45
            {rainfallCategory
              ? ` · ${RAINFALL_CATEGORY_LABELS[rainfallCategory]}`
              : ""}
          </span>
        </li>
      </ul>
      {noRainfallData ? (
        <p className="sk-bar__note">
          Data hujan belum tersedia, jadi skor memakai kerawanan dasar saja.
        </p>
      ) : null}
      <p className="sk-mono t-small muted">
        skor = round(0,55 × kerawanan + 0,45 × hujan)
      </p>
    </section>
  );
}
