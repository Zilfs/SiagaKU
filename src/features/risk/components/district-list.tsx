"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import type { DistrictSummary } from "@/features/risk/types";
import { filterDistricts } from "@/features/risk/district-filter";

/** Rows shown before "show all": four rows of two on wide screens, eight on a phone. */
const COLLAPSED_ROWS = 8;

/**
 * /peta's district list: highest score first, the top few shown until the visitor asks for the
 * rest, and a search that goes through every district.
 */
export function DistrictList({ districts }: { districts: DistrictSummary[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ranked = useMemo(
    () => [...districts].sort((a, b) => b.score - a.score),
    [districts],
  );
  const searching = query.trim() !== "";
  const matches = searching ? filterDistricts(ranked, query) : ranked;
  const rows = searching || open ? matches : matches.slice(0, COLLAPSED_ROWS);

  if (districts.length === 0) {
    return (
      <p className="sk-list__empty">
        Data risiko belum tersedia. Coba muat ulang halaman ini beberapa saat
        lagi.
      </p>
    );
  }

  return (
    <div className="sk-district-browse">
      <label htmlFor="daftar-cari" className="sr-only">
        Cari kecamatan atau kota
      </label>
      <div className="sk-search">
        <Search size={18} aria-hidden="true" />
        <input
          id="daftar-cari"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari kecamatan atau kota"
          autoComplete="off"
        />
      </div>
      <p className="sr-only" role="status">
        {searching ? `${matches.length} kecamatan cocok` : ""}
      </p>
      {rows.length === 0 ? (
        <p className="sk-list__empty">
          Tidak ada kecamatan yang cocok dengan “{query.trim()}”.
        </p>
      ) : (
        <ul className="sk-district-list" id="daftar-kecamatan">
          {rows.map((district) => (
            <li key={district.slug}>
              <Link href={`/wilayah/${district.slug}`}>
                <span
                  className="sk-dot"
                  data-level={district.level}
                  aria-hidden="true"
                />
                <span className="sk-district-list__name">
                  <b>{district.name}</b>
                  <span>{district.city}</span>
                </span>
                <RiskBadge level={district.level} size="sm" />
                <span className="sk-mono sk-district-list__score">
                  {district.score}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!searching && matches.length > COLLAPSED_ROWS ? (
        <button
          type="button"
          className="btn btn--secondary"
          aria-expanded={open}
          aria-controls="daftar-kecamatan"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
          {open
            ? "Tampilkan lebih sedikit"
            : `Tampilkan semua ${matches.length} kecamatan`}
        </button>
      ) : null}
    </div>
  );
}
