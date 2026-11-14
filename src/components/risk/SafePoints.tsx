import { Accessibility, MapPin, Route } from "lucide-react";
import type { SafePoint } from "@/lib/demo/district-detail";

/** The two nearest sample safe points; a real list comes from the DB (docs/03). */
export function SafePoints({ points }: { points: SafePoint[] }) {
  return (
    <section className="sk-card sk-safepoints" aria-labelledby="aman-h">
      <div className="sk-card__head">
        <h2 id="aman-h">Titik aman terdekat</h2>
        <span className="sk-mono">data contoh</span>
      </div>
      <ul className="sk-safepoints__list">
        {points.map((point) => (
          <li key={point.name}>
            <span className="sk-safepoints__icon" aria-hidden="true">
              {point.kind === "Titik kumpul" ? <Accessibility size={18} /> : <MapPin size={18} />}
            </span>
            <span className="sk-safepoints__name">
              <b>{point.name}</b>
              <span>
                {point.kind} · {point.note}
              </span>
            </span>
            <span className="sk-safepoints__dist">
              <Route size={13} aria-hidden="true" />
              {point.distance}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
