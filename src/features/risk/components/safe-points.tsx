import { Accessibility, MapPin, Route } from "lucide-react";
import type { SafePoint } from "@/features/risk/types";
import { distanceKm, formatDistance } from "@/lib/geo";

/**
 * The nearest safe points in the Task 7 shape; the distance is computed from the point's lat/lng,
 * so the component stays the same when the list comes from the database.
 */
export function SafePoints({
  points,
  origin,
}: {
  points: SafePoint[];
  origin: { lat: number; lng: number };
}) {
  return (
    <section className="sk-card sk-safepoints" aria-labelledby="aman-h">
      <div className="sk-card__head">
        <h2 id="aman-h">Titik aman terdekat</h2>
        <span className="sk-mono">dari data posko</span>
      </div>
      {points.length === 0 ? (
        <p className="sk-list__empty">
          Belum ada titik aman yang tercatat untuk kecamatan ini.
        </p>
      ) : (
        <ul className="sk-safepoints__list">
          {points.map((point) => {
            const distance =
              point.lat != null && point.lng != null
                ? formatDistance(
                    distanceKm(origin, { lat: point.lat, lng: point.lng }),
                  )
                : "—";
            return (
              <li key={point.id}>
                <span className="sk-safepoints__icon" aria-hidden="true">
                  {point.type === "Titik kumpul" ? (
                    <Accessibility size={18} />
                  ) : (
                    <MapPin size={18} />
                  )}
                </span>
                <span className="sk-safepoints__name">
                  <b>{point.name}</b>
                  <span>
                    {point.type} ·{" "}
                    {point.isVerified ? "Terverifikasi" : "Belum diverifikasi"}
                  </span>
                </span>
                <span className="sk-safepoints__dist">
                  <Route size={13} aria-hidden="true" />
                  {distance}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
