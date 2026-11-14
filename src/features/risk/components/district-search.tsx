"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, TriangleExclamationPoint } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import type {
  AiMeta,
  DistrictSummary,
  RiskDetail,
} from "@/features/risk/types";
import type { Explanation } from "@/features/risk/schemas";
import { riskAction } from "@/features/risk/risk-copy";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/risk/level";

type ExplanationResponse = Explanation & { meta: AiMeta };

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

/**
 * The landing page's product surface, reading the real district summaries. The score and level come
 * with the list; the two components and the AI explanation are fetched when a district is selected.
 */
type DetailState = {
  slug: string | null;
  detail: RiskDetail | null;
  explanation: ExplanationResponse | null;
  loading: boolean;
};

export function DistrictSearch({ districts }: { districts: DistrictSummary[] }) {
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(districts[0]?.slug ?? "");
  const [visibleRows, setVisibleRows] = useState(VISIBLE_ROWS);
  const [detailState, setDetailState] = useState<DetailState>({
    slug: null,
    detail: null,
    explanation: null,
    loading: true,
  });

  useEffect(() => {
    const shortScreen = window.matchMedia(SHORT_SCREEN_QUERY);
    const sync = () => setVisibleRows(shortScreen.matches ? 3 : VISIBLE_ROWS);
    sync();
    shortScreen.addEventListener("change", sync);
    return () => shortScreen.removeEventListener("change", sync);
  }, []);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return districts;
    return districts.filter(
      (district) =>
        district.name.toLowerCase().includes(term) ||
        district.city.toLowerCase().includes(term),
    );
  }, [query, districts]);

  const selected =
    districts.find((district) => district.slug === slug) ?? districts[0] ?? null;
  const visible = rows.slice(0, visibleRows);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const load = async () => {
      let nextDetail: RiskDetail | null = null;
      let nextExplanation: ExplanationResponse | null = null;
      try {
        const [detailRes, explanationRes] = await Promise.all([
          fetch(`/api/risk/${selected.slug}`).catch(() => null),
          fetch(`/api/risk/${selected.slug}/explanation`).catch(() => null),
        ]);
        nextDetail = detailRes?.ok ? await detailRes.json() : null;
        nextExplanation = explanationRes?.ok ? await explanationRes.json() : null;
      } catch {
        nextDetail = null;
        nextExplanation = null;
      }
      if (!cancelled) {
        setDetailState({
          slug: selected.slug,
          detail: nextDetail,
          explanation: nextExplanation,
          loading: false,
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (!selected) {
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
                disabled
                placeholder="Data belum tersedia"
              />
            </div>
          </div>
          <p className="sk-list__empty">
            Data risiko belum tersedia. Coba muat ulang halaman ini beberapa saat
            lagi.
          </p>
        </div>
        <div className="sk-app__main">
          <p className="sk-list__empty">
            Skor risiko per kecamatan sedang tidak bisa dimuat. Sumber data sedang
            tidak merespons.
          </p>
        </div>
      </div>
    );
  }

  const detail = detailState.slug === selected.slug ? detailState.detail : null;
  const explanation =
    detailState.slug === selected.slug ? detailState.explanation : null;
  const loading = detailState.slug !== selected.slug || detailState.loading;

  const base = detail?.components.baseVulnerability ?? null;
  const rain = detail?.components.rainfallFactor ?? null;
  const rainMm = detail?.components.maxRainfallMm ?? null;

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
            ? `${visibleRows} dari ${rows.length} kecamatan`
            : `${rows.length} kecamatan`}
        </p>
      </div>

      <div className="sk-app__main" aria-live="polite" aria-busy={loading}>
        <div className="sk-app__top">
          <div className="sk-app__place">
            <b>{selected.name}</b>
            <span>{selected.city} · DKI Jakarta</span>
          </div>
          <p className="sk-app__updated">
            Skor hari ini
            <br />
            BMKG &amp; Open-Meteo
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
            {explanation && explanation.meta.provider !== "template" ? (
              <>
                <Sparkles size={13} aria-hidden="true" />
                Penjelasan AI
              </>
            ) : (
              "Penjelasan"
            )}
          </span>
          <p>
            {explanation?.explanation ??
              (loading
                ? "Memuat penjelasan…"
                : "Penjelasan sedang tidak tersedia. Baca rincian skor di bawahnya.")}
          </p>
          <div className="sk-ai__action">
            <TriangleExclamationPoint size={16} aria-hidden="true" />
            <span>
              <b>Tindakan utama.</b>{" "}
              {explanation?.mainAction ?? riskAction(selected.level)}
            </span>
          </div>
        </div>

        <ul className="sk-bars">
          <li className="sk-bar">
            <span>Kerawanan dasar</span>
            <span className="sk-mono">{base != null ? `${base} / 100` : "—"}</span>
            <span className="sk-bar__track" aria-hidden="true">
              <i style={{ width: `${base ?? 0}%` }} />
            </span>
          </li>
          <li className="sk-bar">
            <span>
              Faktor hujan{rainMm != null ? ` · ${rainMm} mm` : ""}
            </span>
            <span className="sk-mono">{rain != null ? `${rain} / 100` : "—"}</span>
            <span className="sk-bar__track" aria-hidden="true">
              <i style={{ width: `${rain ?? 0}%` }} />
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
