import { CloudRain, CloudSun, Sun } from "lucide-react";
import type { WeatherSlot } from "@/lib/data/bmkg";

function IconFor({ mm }: { mm: number }) {
  if (mm >= 20) return <CloudRain size={18} aria-hidden="true" />;
  if (mm > 0) return <CloudSun size={18} aria-hidden="true" />;
  return <Sun size={18} aria-hidden="true" />;
}

/** "Hari ini", "Besok", then the weekday, from the slot's local time (BMKG shape). */
function dayLabel(localTime: string, index: number) {
  if (index === 0) return "Hari ini";
  if (index === 1) return "Besok";
  const date = new Date(localTime.replace(" ", "T"));
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
}

/** Three forecast slots under the score, read from the BMKG slot shape. */
export function WeatherStrip({ slots }: { slots: WeatherSlot[] }) {
  return (
    <section className="sk-card sk-weather" aria-labelledby="cuaca-h">
      <div className="sk-card__head">
        <h2 id="cuaca-h">Prakiraan hujan</h2>
        <span className="sk-mono">BMKG · contoh</span>
      </div>
      <ol className="sk-weather__rows">
        {slots.map((slot, index) => {
          const mm = slot.rainfallMm ?? 0;
          return (
            <li key={`${slot.localTime}-${index}`}>
              <span className="sk-weather__day">
                {dayLabel(slot.localTime, index)}
              </span>
              <span className="sk-weather__cond">
                <IconFor mm={mm} />
                {slot.description}
              </span>
              <span className="sk-mono sk-weather__mm">{mm} mm</span>
              <span className="sk-mono sk-weather__time">
                {slot.localTime.slice(11, 16)} WIB
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
