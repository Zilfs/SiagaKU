"use client";

import { useEffect, useState } from "react";
import { CloudRain, Droplets, MessageCircle, TriangleExclamationPoint } from "lucide-react";

const COUNT_ROWS = [
  { label: "Awas", value: 3, color: "var(--risk-very-high)" },
  { label: "Siaga", value: 9, color: "var(--risk-high)" },
  { label: "Waspada", value: 18, color: "var(--risk-moderate)" },
  { label: "Normal", value: 14, color: "var(--risk-low)" },
];

const WEATHER = [
  { time: "15.00", temp: "31°", mm: "12" },
  { time: "18.00", temp: "29°", mm: "18" },
  { time: "21.00", temp: "27°", mm: "5" },
  { time: "00.00", temp: "26°", mm: "2" },
];

/**
 * The hero's triptych: three sets of the product's own screens, one shown at a time, 7 s apart.
 * The pause control is the WCAG 2.2.2 stop for the loop; reduced motion keeps the first set still.
 */
export function HeroCollage({ className }: { className?: string }) {
  const [set, setSet] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycling, setCycling] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setCycling(true);
      setSet((value) => (value + 1) % 3);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className={
        className
          ? `${className} ly-collage${cycling ? " is-cycling" : ""}`
          : `ly-collage${cycling ? " is-cycling" : ""}`
      }
      data-moment="cursor-spotlight"
      data-moment-opts='{"rest":[0.78,0.16],"radius":440}'
      role="group"
      aria-label="Tiga layar SiagaKU: skor risiko Jatinegara dengan rincian, rencana siaga keluarga dengan daftar periksa, dan laporan genangan warga."
    >
      {/* set one: the risk answer and the city's count */}
      <div className={set === 0 ? "ly-collage__set is-on" : "ly-collage__set"}>
        <div
          className="ly-piece sk-card-risk sk-piece--main"
          style={{ left: "0%", top: "6%", width: "62%", height: "64%" }}
        >
          <div className="sk-piece-head">
            <span className="sk-dot" style={{ background: "var(--risk-high)" }} />
            <strong className="sk-piece-title">Jatinegara</strong>
            <span className="sk-mono">Jakarta Timur</span>
          </div>
          <div className="sk-piece-score">
            <b>64</b>
            <span>
              <span className="sk-risk sk-risk--high">Tinggi</span>
            </span>
          </div>
          <p className="sk-piece-copy">
            Hujan sedang 35 mm diperkirakan sore ini. Wilayah ini sering
            tergenang luapan Ciliwung.
          </p>
          <div className="sk-piece-action">
            <span>Tindakan utama</span>
            <span aria-hidden="true">Lihat →</span>
          </div>
        </div>

        <div
          className="ly-piece sk-card-counts sk-piece--aside"
          style={{ left: "66%", top: "0%", width: "34%" }}
        >
          <div className="sk-piece-head">
            <strong>Jakarta hari ini</strong>
            <span className="sk-mono">14.00</span>
          </div>
          <ul>
            {COUNT_ROWS.map((row) => (
              <li key={row.label}>
                <span className="sk-dot" style={{ background: row.color }} />
                {row.label}
                <b>{row.value}</b>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="ly-piece sk-card-weather sk-piece--aside"
          style={{ left: "0%", top: "74%", width: "62%" }}
        >
          <div className="sk-piece-head">
            <span>Cuaca 3 hari</span>
            <span className="sk-mono">BMKG</span>
          </div>
          <ol>
            {WEATHER.map((slot) => (
              <li key={slot.time}>
                <span className="sk-mono">{slot.time}</span>
                <CloudRain className="sk-rain" aria-hidden="true" />
                <b>{slot.temp}</b>
                <span>{slot.mm} mm</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* set two: the family plan and the chat */}
      <div className={set === 1 ? "ly-collage__set is-on" : "ly-collage__set"} aria-hidden="true">
        <div
          className="ly-piece sk-card-plan sk-piece--main"
          style={{ left: "0%", top: "0%", width: "62%", height: "62%" }}
        >
          <div className="sk-piece-head">
            <strong className="sk-piece-title">Tas siaga · Jatinegara</strong>
            <span className="sk-mono">8/22</span>
          </div>
          <div className="sk-track">
            <i />
          </div>
          <ul>
            <li className="is-done">
              <span className="sk-check" aria-hidden="true" />
              Air minum 3 L per orang, 3 hari
            </li>
            <li className="is-done">
              <span className="sk-check" aria-hidden="true" />
              Dokumen di kantong tahan air
            </li>
            <li className="is-done">
              <span className="sk-check" aria-hidden="true" />
              Obat rutin 7 hari untuk lansia
            </li>
            <li>
              <span className="sk-check" aria-hidden="true" />
              Susu formula dan botol bayi
            </li>
            <li>
              <span className="sk-check" aria-hidden="true" />
              Lampu senter dan baterai cadangan
            </li>
          </ul>
        </div>

        <div
          className="ly-piece sk-card-chat sk-piece--aside"
          style={{ left: "66%", top: "4%", width: "34%", height: "76%" }}
        >
          <div className="sk-piece-head">
            <span className="sk-dot" style={{ background: "#7fd8cf" }} />
            <strong>Tanya SiagaKU</strong>
          </div>
          <p className="sk-piece-q">
            <b>Kapan harus mengungsi kalau ada lansia?</b>
          </p>
          <p className="sk-piece-a">
            Untuk keluarga dengan lansia, bersiap lebih awal: saat air mulai
            naik di gang, bukan saat masuk rumah.
          </p>
          <div className="sk-piece-src">
            <MessageCircle size={12} aria-hidden="true" />
            BNPB · Buku Saku, hlm. 23
          </div>
        </div>

        <div
          className="ly-piece sk-card-alert sk-piece--aside"
          style={{ left: "0%", top: "68%", width: "62%" }}
        >
          <div className="sk-piece-head">
            <TriangleExclamationPoint size={14} aria-hidden="true" />
            Siaga · Jatinegara
          </div>
          <p>Hujan lebat 15.00–20.00 WIB. Siapkan jalur keluar keluarga.</p>
        </div>
      </div>

      {/* set three: the citizen reports and the early warning */}
      <div className={set === 2 ? "ly-collage__set is-on" : "ly-collage__set"} aria-hidden="true">
        <div
          className="ly-piece sk-card-report sk-piece--main"
          style={{ left: "0%", top: "4%", width: "58%", height: "62%" }}
        >
          <div className="sk-piece-head">
            <strong>Laporan warga</strong>
            <span className="sk-mono">12 menit lalu</span>
          </div>
          <ul>
            <li>
              <span className="sk-dot" style={{ background: "var(--risk-high)" }} />
              Jl. Jatinegara Barat
              <b>20 cm</b>
            </li>
            <li>
              <span className="sk-dot" style={{ background: "var(--risk-high)" }} />
              Kampung Melayu
              <b>35 cm</b>
            </li>
            <li>
              <span className="sk-dot" style={{ background: "var(--risk-moderate)" }} />
              Jl. Otista
              <b>10 cm</b>
            </li>
            <li>
              <span className="sk-dot" style={{ background: "var(--risk-moderate)" }} />
              Cawang
              <b>8 cm</b>
            </li>
          </ul>
          <div className="sk-piece-action">
            <span>4 laporan hari ini</span>
            <span aria-hidden="true">Peta →</span>
          </div>
        </div>

        <div
          className="ly-piece sk-card-alert sk-piece--aside"
          style={{ left: "0%", top: "70%", width: "58%" }}
        >
          <div className="sk-piece-head">
            <Droplets size={14} aria-hidden="true" />
            Peringatan dini
          </div>
          <p>Awas di Cilincing: hujan 74 mm, 15.00–20.00 WIB.</p>
        </div>

        <div
          className="ly-piece sk-card-counts sk-piece--aside"
          style={{ left: "62%", top: "4%", width: "38%" }}
        >
          <div className="sk-piece-head">
            <strong>Jakarta hari ini</strong>
            <span className="sk-mono">14.00</span>
          </div>
          <ul>
            {COUNT_ROWS.map((row) => (
              <li key={row.label}>
                <span className="sk-dot" style={{ background: row.color }} />
                {row.label}
                <b>{row.value}</b>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="ly-piece sk-card-weather sk-piece--aside"
          style={{ left: "62%", top: "52%", width: "38%" }}
        >
          <div className="sk-piece-head">
            <span>Hujan</span>
            <span className="sk-mono">3 hari</span>
          </div>
          <ol>
            {WEATHER.map((slot) => (
              <li key={slot.time}>
                <span className="sk-mono">{slot.time}</span>
                <CloudRain className="sk-rain" aria-hidden="true" />
                <b>{slot.temp}</b>
                <span>{slot.mm} mm</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <button
        type="button"
        className="loop-pause"
        aria-label={paused ? "Jalankan tampilan berganti" : "Jeda tampilan berganti"}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? (
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 1.5 12 7l-9 5.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <rect x="2.5" y="2" width="3.2" height="10" rx="1" />
            <rect x="8.3" y="2" width="3.2" height="10" rx="1" />
          </svg>
        )}
      </button>
    </div>
  );
}
