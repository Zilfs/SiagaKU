import { CloudRain, Droplets, Wind } from "lucide-react";
import type { WeatherSlot } from "@/lib/data/bmkg";
import { groupSlotsByDay, kindFromDescription } from "../weather-view";
import { WeatherIcon } from "./weather-icon";

/** The 3-hourly strip shows the next 24 hours; the daily list covers the rest. */
const STRIP_SLOTS = 8;

/** "Hari ini", "Besok", then the weekday of a "YYYY-MM-DD" date. */
function dayLabel(date: string, index: number) {
  if (index === 0) return "Hari ini";
  if (index === 1) return "Besok";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "UTC",
  }).format(parsed);
}

const degrees = (value: number | null) =>
  value === null ? "–" : `${Math.round(value)}°`;

/**
 * The district's BMKG forecast in three parts: the nearest slot as "now", the next 24 hours in
 * 3-hour steps (a sideways strip), and one row per day.
 */
export function WeatherStrip({
  slots,
  stale,
}: {
  slots: WeatherSlot[];
  stale: boolean;
}) {
  const now = slots[0];
  const days = groupSlotsByDay(slots);
  return (
    <section className="sk-card sk-weather" aria-labelledby="cuaca-h">
      <div className="sk-card__head">
        <h2 id="cuaca-h" className="sk-heading-icon">
          <CloudRain size={18} aria-hidden="true" />
          Prakiraan cuaca
        </h2>
        <span className="sk-mono">
          BMKG · {stale ? "data terakhir" : "terbaru"}
        </span>
      </div>
      {!now ? (
        <p className="sk-list__empty">Data prakiraan cuaca belum tersedia.</p>
      ) : (
        <>
          <div className="sk-dash__now">
            <WeatherIcon
              kind={kindFromDescription(now.description)}
              size={40}
            />
            <div>
              <b className="sk-dash__temp">
                {now.temperature === null ? "–" : `${now.temperature}°C`}
              </b>
              <span>{now.description || "Tanpa keterangan"}</span>
            </div>
          </div>
          <dl className="sk-dash__facts">
            <div>
              <dt>
                <Droplets size={14} aria-hidden="true" /> Kelembapan
              </dt>
              <dd className="sk-mono">
                {now.humidity === null ? "–" : `${now.humidity}%`}
              </dd>
            </div>
            <div>
              <dt>
                <Wind size={14} aria-hidden="true" /> Angin
              </dt>
              <dd className="sk-mono">
                {now.windSpeedKmh === null ? "–" : `${now.windSpeedKmh} km/jam`}
              </dd>
            </div>
            <div>
              <dt>
                <CloudRain size={14} aria-hidden="true" /> Hujan
              </dt>
              <dd className="sk-mono">
                {now.rainfallMm === null ? "–" : `${now.rainfallMm} mm`}
              </dd>
            </div>
          </dl>

          <h3 className="sk-weather__sub">Per 3 jam</h3>
          <ol className="sk-weather__hours" tabIndex={0} aria-label="Per 3 jam">
            {slots.slice(0, STRIP_SLOTS).map((slot, index) => (
              <li key={`${slot.localTime}-${index}`}>
                <span className="sk-mono">{slot.localTime.slice(11, 16)}</span>
                <WeatherIcon
                  kind={kindFromDescription(slot.description)}
                  size={22}
                />
                <span className="sr-only">{slot.description}</span>
                <b className="sk-mono">{degrees(slot.temperature)}</b>
                <span className="sk-mono sk-weather__mm">
                  {slot.rainfallMm ?? 0} mm
                </span>
              </li>
            ))}
          </ol>

          <h3 className="sk-weather__sub">Harian</h3>
          <ol className="sk-dash__days sk-weather__days">
            {days.map((day, index) => (
              <li key={day.date}>
                <span className="sk-dash__day">
                  {dayLabel(day.date, index)}
                </span>
                <span className="sk-dash__cond">
                  <WeatherIcon kind={kindFromDescription(day.description)} />
                  <span className="sr-only">{day.description}</span>
                </span>
                <span className="sk-mono">
                  {degrees(day.minTemp)}–{degrees(day.maxTemp)}
                </span>
                <span className="sk-mono sk-dash__mm">
                  {day.rainfallMm} mm
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
