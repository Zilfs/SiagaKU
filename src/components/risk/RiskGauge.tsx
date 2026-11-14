import type { RiskLevel } from "@/lib/demo/districts";

const COLOR: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  very_high: "var(--risk-very-high)",
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The district's 0-100 score as a ring; the level's colour, never the only cue. */
export function RiskGauge({
  score,
  level,
  label,
}: {
  score: number;
  level: RiskLevel;
  label: string;
}) {
  const filled = (Math.min(100, Math.max(0, score)) / 100) * CIRCUMFERENCE;
  return (
    <div className="sk-gauge" style={{ ["--gauge-color" as string]: COLOR[level] }}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`Skor risiko ${score} dari 100, level ${label}`}>
        <circle className="sk-gauge__track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="sk-gauge__value"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="sk-gauge__num">{score}</span>
      <span className="sk-gauge__scale">dari 100</span>
    </div>
  );
}
