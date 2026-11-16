import type { CSSProperties } from "react";
import { Gauge } from "lucide-react";
import type { RiskDetail } from "@/features/risk/types";
import {
  getRiskLevel,
  RISK_LEVEL_LABELS,
  type RiskLevel,
} from "@/lib/risk/level";
import {
  calculateRiskScore,
  classifyRainfall,
  RAINFALL_CATEGORY_LABELS,
} from "@/lib/risk/score";
import { riskAction } from "../risk-copy";

const LEVELS: RiskLevel[] = ["low", "moderate", "high", "very_high"];
/** Where each level starts on the 0-100 scale, read from getRiskLevel so the two never drift. */
const LEVEL_STARTS = LEVELS.map((level) => {
  let start = 0;
  while (getRiskLevel(start) !== level) start += 1;
  return start;
});

/** Rainfall amounts just inside each heavier category, for the "if it rains more" rows. */
const WHAT_IF_MM = [20, 50, 100, 151];

const points = (value: number) =>
  value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

/**
 * How the score is built: the two components with their weights, the sum worked out, where the
 * score sits on the level scale, and what heavier rain would do to it.
 */
export function ScoreBreakdown({
  components,
  noRainfallData,
  score,
  level,
}: {
  components: RiskDetail["components"];
  noRainfallData: boolean;
  score: number;
  level: RiskLevel;
}) {
  const { baseVulnerability, rainfallFactor, maxRainfallMm, rainfallCategory } =
    components;
  const whatIf = WHAT_IF_MM.map((mm) => ({
    mm,
    ...classifyRainfall(mm),
    ...calculateRiskScore({ baseVulnerability, maxRainfallMm: mm }),
  })).filter((row) => row.factor > rainfallFactor);
  return (
    <section className="sk-card sk-breakdown" aria-labelledby="skor-h">
      <div className="sk-card__head">
        <h2 id="skor-h" className="sk-heading-icon">
          <Gauge size={18} aria-hidden="true" />
          Dari mana skornya
        </h2>
        <span className="sk-mono">0–100</span>
      </div>
      <ul className="sk-bars">
        <li className="sk-bar">
          <span>Kerawanan dasar</span>
          <span className="sk-mono">{baseVulnerability} / 100</span>
          <span className="sk-bar__track" aria-hidden="true">
            <i style={{ "--w": `${baseVulnerability}%` } as CSSProperties} />
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
            <i style={{ "--w": `${rainfallFactor}%` } as CSSProperties} />
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

      <div className="sk-sum">
        <p>
          <span>0,55 × {baseVulnerability}</span>
          <b className="sk-mono">{points(0.55 * baseVulnerability)}</b>
        </p>
        <i aria-hidden="true">+</i>
        <p>
          <span>0,45 × {rainfallFactor}</span>
          <b className="sk-mono">{points(0.45 * rainfallFactor)}</b>
        </p>
        <i aria-hidden="true">=</i>
        <p className="sk-sum__total">
          <span>Skor (dibulatkan)</span>
          <b className="sk-mono">{score}</b>
        </p>
      </div>

      <div className="sk-scale">
        <div className="sk-scale__track" aria-hidden="true">
          {LEVELS.map((name) => (
            <i key={name} data-level={name} />
          ))}
          <b style={{ "--at": `${score}%` } as CSSProperties} />
        </div>
        <ol className="sk-scale__labels">
          {LEVELS.map((name, index) => (
            <li key={name} aria-current={name === level || undefined}>
              <span className="sk-mono">
                {LEVEL_STARTS[index]}–
                {index < LEVELS.length - 1 ? LEVEL_STARTS[index + 1] - 1 : 100}
              </span>
              {RISK_LEVEL_LABELS[name]}
            </li>
          ))}
        </ol>
      </div>
      <p className="sk-breakdown__action">{riskAction(level)}</p>

      {whatIf.length > 0 ? (
        <div className="sk-whatif">
          <h3 className="sk-weather__sub">Kalau hujan lebih deras</h3>
          <ul>
            {whatIf.map((row) => (
              <li key={row.mm}>
                <span>
                  {RAINFALL_CATEGORY_LABELS[row.category]}
                  <small className="sk-mono">
                    {row.mm > 150 ? "> 150" : `≥ ${row.mm}`} mm
                  </small>
                </span>
                <span
                  className="sk-dot"
                  data-level={row.level}
                  aria-hidden="true"
                />
                <span>{RISK_LEVEL_LABELS[row.level]}</span>
                <b className="sk-mono">{row.score}</b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
