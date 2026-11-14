import type { ScoredDistrict } from "@/lib/demo/districts";

/** The two components of the score, with the weight each one carries (docs/06-data). */
export function ScoreBreakdown({ district }: { district: ScoredDistrict }) {
  return (
    <section className="sk-card sk-breakdown" aria-labelledby="skor-h">
      <div className="sk-card__head">
        <h2 id="skor-h">Dari mana skornya</h2>
        <span className="sk-mono">0–100</span>
      </div>
      <ul className="sk-bars">
        <li className="sk-bar">
          <span>Kerawanan dasar</span>
          <span className="sk-mono">{district.vulnerability} / 100</span>
          <span className="sk-bar__track" aria-hidden="true">
            <i style={{ width: `${district.vulnerability}%` }} />
          </span>
          <span className="sk-bar__note">Riwayat genangan dan bentuk lahan · bobot 0,55</span>
        </li>
        <li className="sk-bar">
          <span>Faktor hujan</span>
          <span className="sk-mono">
            {district.rainFactor} / 100 · {district.rainfallMm} mm
          </span>
          <span className="sk-bar__track" aria-hidden="true">
            <i style={{ width: `${district.rainFactor}%` }} />
          </span>
          <span className="sk-bar__note">Prakiraan tiga hari BMKG · bobot 0,45</span>
        </li>
      </ul>
      <p className="sk-mono t-small muted">
        skor = round(0,55 × kerawanan + 0,45 × hujan)
      </p>
    </section>
  );
}
