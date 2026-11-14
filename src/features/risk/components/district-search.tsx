"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, TriangleExclamationPoint } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import {
  DEMO_DISTRICTS,
  riskAction,
  searchDistricts,
} from "@/lib/demo/districts";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/risk/level";

const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  very_high: "var(--risk-very-high)",
};

/** The side panel shows a short list; the rest waits behind the search box, not below the fold. */
const VISIBLE_ROWS = 6;
/** A short landscape screen (1024x768) has less height for the panel, so the list shows three. */
const SHORT_SCREEN_QUERY = "(min-width: 640px) and (max-height: 820px)";

function explanation(name: string, rainfallMm: number, level: RiskLevel) {
  const rain =
    rainfallMm >= 50
      ? `Hujan lebat ${rainfallMm} mm`
      : rainfallMm >= 20
        ? `Hujan sedang ${rainfallMm} mm`
        : `Hujan ringan ${rainfallMm} mm`;
  if (level === "very_high" || level === "high") {
    return `${rain} diperkirakan turun dalam tiga hari. ${name} punya riwayat genangan, jadi siapkan jalur keluar dan barang penting di tempat tinggi.`;
  }
  if (level === "moderate") {
    return `${rain} diperkirakan turun dalam tiga hari. Bersihkan saluran air di sekitar rumah dan simpan dokumen di tempat aman.`;
  }
  return `${rain} diperkirakan turun dalam tiga hari. Tetap simpan nomor darurat dan cek tas siaga keluarga.`;
}

/**
 * The landing page's product surface: search a district, read its score, its two components and the
 * plain-language action. Demo data until the risk API (Task 7) lands; every number says "data contoh".
 */
export function DistrictSearch() {
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState("jatinegara");
  const [visibleRows, setVisibleRows] = useState(VISIBLE_ROWS);

  useEffect(() => {
    const shortScreen = window.matchMedia(SHORT_SCREEN_QUERY);
    const sync = () => setVisibleRows(shortScreen.matches ? 3 : VISIBLE_ROWS);
    sync();
    shortScreen.addEventListener("change", sync);
    return () => shortScreen.removeEventListener("change", sync);
  }, []);

  const rows = useMemo(() => searchDistricts(query), [query]);
  const visible = rows.slice(0, visibleRows);
  const selected =
    DEMO_DISTRICTS.find((district) => district.slug === slug) ?? DEMO_DISTRICTS[0];

  return (
    <div className="sk-app" id="cek-app" data-ui>
      <div className="sk-app__side">
        <div className="sk-app__search">
          <label htmlFor="cari-kecamatan">Cari kecamatan di Jakarta</label>
          <div className="sk-search">
            <Search size={17} aria-hidden="true" />
            <input
              id="cari-kecamatan"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: Jatinegara"
              autoComplete="off"
              aria-controls="daftar-kecamatan"
            />
          </div>
        </div>
        <ul className="sk-list" id="daftar-kecamatan">
          {visible.map((district) => (
            <li key={district.slug}>
              <button
                type="button"
                aria-current={district.slug === selected.slug}
                onClick={() => setSlug(district.slug)}
              >
                <span
                  className="sk-dot"
                  style={{ background: LEVEL_COLOR[district.level] }}
                  aria-hidden="true"
                />
                <span className="sk-list__name">
                  <b>{district.name}</b>
                  <span>
                    {district.city} · {RISK_LEVEL_LABELS[district.level]}
                  </span>
                </span>
                <span className="sk-list__score">{district.score}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="sk-list__empty">
              Tidak ada kecamatan yang cocok. Coba nama lain, misalnya
              Jatinegara atau Cengkareng.
            </li>
          ) : null}
        </ul>
        <p className="sk-list__foot">
          {rows.length > visibleRows
            ? `${visibleRows} dari ${rows.length} kecamatan · data contoh`
            : `${rows.length} kecamatan · data contoh`}
        </p>
      </div>

      <div className="sk-app__main" aria-live="polite">
        <div className="sk-app__top">
          <div className="sk-app__place">
            <b>{selected.name}</b>
            <span>{selected.city} · DKI Jakarta</span>
          </div>
          <p className="sk-app__updated">
            Diperbarui {selected.updatedAt}
            <br />
            Data contoh
          </p>
        </div>

        <div className="sk-score">
          <span className="sk-score__num">{selected.score}</span>
          <div className="sk-score__meta">
            <RiskBadge level={selected.level} />
            <p>{riskAction(selected.level)}</p>
          </div>
        </div>

        <div className="sk-ai">
          <span className="sk-ai__badge">
            <Sparkles size={13} aria-hidden="true" />
            Penjelasan AI · contoh
          </span>
          <p>{explanation(selected.name, selected.rainfallMm, selected.level)}</p>
          <div className="sk-ai__action">
            <TriangleExclamationPoint size={16} aria-hidden="true" />
            <span>
              <b>Tindakan utama.</b> {riskAction(selected.level)}
            </span>
          </div>
        </div>

        <ul className="sk-bars">
          <li className="sk-bar">
            <span>Kerawanan dasar</span>
            <span className="sk-mono">{selected.vulnerability} / 100</span>
            <span className="sk-bar__track" aria-hidden="true">
              <i style={{ width: `${selected.vulnerability}%` }} />
            </span>
          </li>
          <li className="sk-bar">
            <span>Faktor hujan · {selected.rainfallMm} mm</span>
            <span className="sk-mono">{selected.rainFactor} / 100</span>
            <span className="sk-bar__track" aria-hidden="true">
              <i style={{ width: `${selected.rainFactor}%` }} />
            </span>
          </li>
        </ul>

        <div className="sk-app__foot">
          <span className="sk-mono">0,55 × kerawanan + 0,45 × hujan</span>
          <Link className="link" href={`/wilayah/${selected.slug}`}>
            Halaman {selected.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
