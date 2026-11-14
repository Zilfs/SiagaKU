import { Waves } from "lucide-react";
import type { FloodEvent } from "@/lib/demo/district-detail";

/** Sample flood history: date, place, depth and how long the water stayed. */
export function FloodHistory({ events }: { events: FloodEvent[] }) {
  return (
    <section className="sk-card sk-history" aria-labelledby="riwayat-h">
      <div className="sk-card__head">
        <h2 id="riwayat-h">Riwayat genangan</h2>
        <span className="sk-mono">data contoh</span>
      </div>
      <ul className="sk-history__list">
        {events.map((event) => (
          <li key={`${event.when}-${event.area}`}>
            <span className="sk-history__when">{event.when}</span>
            <span className="sk-history__area">{event.area}</span>
            <span className="sk-history__depth">
              <Waves size={14} aria-hidden="true" />
              {event.depthCm} cm
            </span>
            <span className="sk-mono sk-history__duration">{event.duration}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
