import { Waves } from "lucide-react";
import type { FloodEvent } from "@/features/risk/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** "2025-02-14" -> "Feb 2025"; a missing date stays as written. */
function monthOf(iso: string) {
  const [year, month] = iso.split("-");
  const index = Number(month) - 1;
  return Number.isInteger(index) && MONTHS[index]
    ? `${MONTHS[index]} ${year}`
    : iso;
}

/** Flood history in the Task 7 shape: date, subdistrict, depth and the source link. */
export function FloodHistory({ events }: { events: FloodEvent[] }) {
  return (
    <section className="sk-card sk-history" aria-labelledby="riwayat-h">
      <div className="sk-card__head">
        <h2 id="riwayat-h">Riwayat genangan</h2>
        <span className="sk-mono">data terbuka</span>
      </div>
      <ul className="sk-history__list">
        {events.length === 0 ? (
          <li className="sk-list__empty">
            Belum ada riwayat genangan yang tercatat.
          </li>
        ) : (
          events.map((event, index) => (
            <li key={`${event.date}-${event.subdistrict ?? index}`}>
              <span className="sk-history__when">{monthOf(event.date)}</span>
              <span className="sk-history__area">
                {event.subdistrict ?? "Lokasi belum dicatat"}
              </span>
              <span className="sk-history__depth">
                <Waves size={14} aria-hidden="true" />
                {event.maxDepthCm != null ? `${event.maxDepthCm} cm` : "—"}
              </span>
              {event.sourceUrl ? (
                <a
                  className="sk-mono sk-history__duration"
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sumber
                </a>
              ) : (
                <span className="sk-mono sk-history__duration">—</span>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
