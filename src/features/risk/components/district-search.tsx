"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import type { DistrictSummary } from "@/features/risk/types";
import { filterDistricts } from "@/features/risk/district-filter";

/** The hero's matches: a short list, so the popover never runs past the hero. */
const HERO_ROWS = 6;

/**
 * The hero's district search: each match links straight to the district page, and Enter opens
 * the first match. The matches float over the hero, so typing never moves the layout.
 */
export function HeroDistrictSearch({
  districts,
}: {
  districts: DistrictSummary[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const listId = useId();
  const term = query.trim();
  const rows = useMemo(
    () => filterDistricts(districts, query),
    [query, districts],
  );
  const empty = districts.length === 0;

  return (
    <form
      className="sk-hero-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (term && rows[0]) router.push(`/wilayah/${rows[0].slug}`);
        else event.currentTarget.querySelector("input")?.focus();
      }}
    >
      <label htmlFor="hero-cari-kecamatan" className="sr-only">
        Cari kecamatan di Jakarta
      </label>
      <div className="sk-search sk-hero-search__field">
        <Search size={18} aria-hidden="true" />
        <input
          id="hero-cari-kecamatan"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          disabled={empty}
          placeholder={
            empty ? "Data risiko belum tersedia" : "Contoh: Jatinegara"
          }
          autoComplete="off"
          aria-controls={term ? listId : undefined}
        />
        <button type="submit" className="btn btn--primary" disabled={empty}>
          Cek risiko
        </button>
      </div>
      <p className="sr-only" role="status">
        {term ? `${rows.length} kecamatan cocok` : ""}
      </p>
      {term ? (
        <ul className="sk-hero-search__results" id={listId}>
          {rows.slice(0, HERO_ROWS).map((district) => (
            <li key={district.slug}>
              <Link href={`/wilayah/${district.slug}`}>
                <span className="sk-list__name">
                  <b>{district.name}</b>
                  <span>{district.city}</span>
                </span>
                <RiskBadge level={district.level} size="sm" />
                <span className="sk-list__score">{district.score}</span>
              </Link>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="sk-list__empty">
              Tidak ada kecamatan yang cocok. Coba nama lain, misalnya
              Jatinegara atau Cengkareng.
            </li>
          ) : null}
        </ul>
      ) : null}
    </form>
  );
}
