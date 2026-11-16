import type { CSSProperties } from "react";

/** Districts on the laptop's map: position in percent of the map and a risk level. */
const DOTS: [x: number, y: number, level: string][] = [
  [30, 34, "high"],
  [38, 46, "high"],
  [47, 30, "very-high"],
  [52, 44, "moderate"],
  [58, 38, "moderate"],
  [63, 52, "low"],
  [56, 58, "moderate"],
  [45, 60, "high"],
  [70, 34, "moderate"],
  [74, 60, "moderate"],
  [50, 74, "high"],
  [62, 78, "moderate"],
  [36, 70, "moderate"],
  [82, 46, "low"],
];

/** Rain per slot in the laptop's hourly chart, as a share of the tallest bar. */
const RAIN = [18, 30, 50, 78, 100, 62, 36, 20];

const DAYS: [day: string, mm: string][] = [
  ["Hari ini", "9,9 mm"],
  ["Sel", "6 mm"],
  ["Rab", "8,9 mm"],
];

/** The go-bag list on the phone; the last three tick themselves in turn (globals.css). */
const KIT = [
  "Dokumen penting",
  "Obat pribadi",
  "Air minum 3 hari",
  "Senter dan baterai",
  "Power bank",
  "Kotak P3K",
];

const vars = (values: Record<string, string | number>) =>
  values as CSSProperties;

/**
 * The landing hero's picture: a laptop showing the /peta dashboard and a phone showing a
 * preparedness plan's go-bag checklist. Illustrative and decorative, so hidden from assistive
 * tech. globals.css drifts each device at its own speed on scroll (.sk-device) and loops the
 * screens' small animations; both stop under reduced motion or the page's motion toggle.
 */
export function HeroDevices() {
  return (
    <div className="sk-devices" aria-hidden="true">
      <div className="sk-device sk-laptop">
        <div className="sk-laptop__tilt">
          <div className="sk-laptop__lid">
            <div className="sk-laptop__screen">
              <div className="sk-pv-chrome">
                <i />
                <i />
                <i />
                <span>siagaku.id/peta</span>
              </div>
              <div className="sk-pv-dash">
                <div className="sk-pv-aside">
                  <div className="sk-pv-card">
                    <p className="sk-pv-kicker">Cuaca saat ini</p>
                    <p className="sk-pv-big">29°C</p>
                    <p className="sk-pv-kicker">Cerah · Penjaringan</p>
                  </div>
                  <div className="sk-pv-card">
                    <p className="sk-pv-kicker">Prakiraan 7 hari</p>
                    {DAYS.map(([day, mm]) => (
                      <p className="sk-pv-day" key={day}>
                        <b>{day}</b>
                        <span>{mm}</span>
                      </p>
                    ))}
                  </div>
                  <div className="sk-pv-card sk-pv-card--fill">
                    <p className="sk-pv-kicker">Curah hujan hari ini</p>
                    <div className="sk-pv-rain">
                      {RAIN.map((height, i) => (
                        <i
                          key={i}
                          style={vars({ "--h": `${height}%`, "--i": i })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sk-pv-map">
                  <p className="sk-pv-chip">15 kecamatan risiko tinggi</p>
                  {DOTS.map(([x, y, level], i) => (
                    <i
                      key={i}
                      className={i === 2 ? "is-selected" : undefined}
                      style={vars({
                        left: `${x}%`,
                        top: `${y}%`,
                        "--c": `var(--risk-${level})`,
                        "--i": i,
                      })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="sk-laptop__base" />
        </div>
      </div>
      <div className="sk-device sk-phone">
        <div className="sk-phone__body">
          <div className="sk-phone__screen">
            <div className="sk-phone__bar">
              <span>9.41</span>
              <i />
            </div>
            <p className="sk-pv-kicker">Rencana siaga · Jatinegara</p>
            <p className="sk-pv-title">Tas siaga</p>
            <div className="sk-pv-meter">
              <i />
            </div>
            <ul className="sk-pv-kit">
              {KIT.map((item) => (
                <li key={item}>
                  <i />
                  {item}
                </li>
              ))}
            </ul>
            <div className="sk-pv-row">
              <b>Titik aman terdekat</b>
              <span>0,8 km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
