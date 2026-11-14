import { CloudRain, CloudSun, Sun } from "lucide-react";
import type { WeatherSlot } from "@/lib/demo/district-detail";

function IconFor({ mm }: { mm: number }) {
  if (mm >= 20) return <CloudRain size={18} aria-hidden="true" />;
  if (mm > 0) return <CloudSun size={18} aria-hidden="true" />;
  return <Sun size={18} aria-hidden="true" />;
}

/** Three sample forecast slots under the score. */
export function WeatherStrip({ slots }: { slots: WeatherSlot[] }) {
  return (
    <section className="sk-card sk-weather" aria-labelledby="cuaca-h">
      <div className="sk-card__head">
        <h2 id="cuaca-h">Prakiraan hujan</h2>
        <span className="sk-mono">BMKG · contoh</span>
      </div>
      <ol className="sk-weather__rows">
        {slots.map((slot) => (
          <li key={slot.day}>
            <span className="sk-weather__day">{slot.day}</span>
            <span className="sk-weather__cond">
              <IconFor mm={slot.rainfallMm} />
              {slot.condition}
            </span>
            <span className="sk-mono sk-weather__mm">{slot.rainfallMm} mm</span>
            <span className="sk-mono sk-weather__time">{slot.time} WIB</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
