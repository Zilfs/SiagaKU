"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Search } from "lucide-react";
import {
  clearWatched,
  getServerSnapshot,
  getWatchSnapshot,
  parseWatched,
  setWatched,
  subscribe,
} from "../local-store";
import { IosInstallHint } from "./ios-install-hint";
import { PushControls } from "./push-controls";

type Kelurahan = {
  kode: string;
  nama: string;
  kecamatan?: string;
  kecamatanSlug?: string;
  kecamatan_slug?: string;
};

type AlertData = {
  status?: string;
  skor?: number;
  hujan24jMm?: number;
  kategoriHujan?: string | null;
  jendela?: { mulai?: string; selesai?: string } | null;
};

const STATUS_ORDER = ["Normal", "Waspada", "Siaga", "Awas"] as const;
type StatusName = (typeof STATUS_ORDER)[number];

function isStatus(value: string | undefined): value is StatusName {
  return STATUS_ORDER.includes(value as StatusName);
}

export function WatchArea() {
  const watchRaw = useSyncExternalStore(
    subscribe,
    getWatchSnapshot,
    getServerSnapshot,
  );
  const watched = parseWatched(watchRaw);
  const kode = watched?.kode;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Kelurahan[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{ kode: string; data: AlertData | null } | null>(
    null,
  );

  useEffect(() => {
    if (!kode) return;
    let cancelled = false;
    fetch(`/api/peringatan/${kode}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AlertData | null) => {
        if (!cancelled) setState({ kode, data });
      })
      .catch(() => {
        if (!cancelled) setState({ kode, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [kode]);

  const loading = Boolean(kode) && state?.kode !== kode;
  const data = state?.kode === kode ? state?.data : null;
  const status = isStatus(data?.status) ? data.status : null;

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    setMessage("");
    try {
      const response = await fetch(`/api/kelurahan?q=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error("not ready");
      const payload = (await response.json()) as
        | Kelurahan[]
        | { data?: Kelurahan[] };
      const list = Array.isArray(payload) ? payload : (payload.data ?? []);
      setResults(Array.isArray(list) ? list : []);
      if (!list.length) setMessage("Tidak ada kelurahan yang cocok.");
    } catch {
      setResults([]);
      setMessage("Data kelurahan belum tersedia. Coba lagi nanti.");
    } finally {
      setSearching(false);
    }
  };

  const choose = (item: Kelurahan) => {
    setWatched({
      kode: item.kode,
      nama: item.nama,
      kecamatanSlug: item.kecamatanSlug ?? item.kecamatan_slug,
    });
    setResults([]);
    setQuery("");
    setMessage("");
  };

  return (
    <section className="sk-card sk-watch" aria-labelledby="pantau-h">
      <div className="sk-card__head">
        <h2 id="pantau-h">{watched ? "Wilayah dipantau" : "Pantau wilayah"}</h2>
        <span className="sk-mono">{watched ? watched.kode : "BMKG"}</span>
      </div>

      {watched ? (
        <>
          <div className="sk-watch__current">
            <b>{watched.nama}</b>
            {watched.kecamatanSlug ? <span>{watched.kecamatanSlug}</span> : null}
          </div>

          <div className="sk-watch__status" aria-live="polite">
            {loading ? (
              <p className="sk-field__hint">Memuat status…</p>
            ) : status ? (
              <>
                <span className={`sk-status sk-status--${status.toLowerCase()}`}>
                  {status}
                </span>
                {data?.kategoriHujan ? (
                  <p>Prakiraan: {data.kategoriHujan}</p>
                ) : null}
                {data?.hujan24jMm != null ? (
                  <p>Hujan 24 jam: {data.hujan24jMm} mm</p>
                ) : null}
                {data?.jendela?.mulai && data.jendela.selesai ? (
                  <p>
                    Jendela hujan: {data.jendela.mulai}–{data.jendela.selesai}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="sk-field__hint">
                Status belum tersedia. Coba muat ulang beberapa saat lagi.
              </p>
            )}
          </div>

          <PushControls
            kode={watched.kode}
            onStop={() => {
              clearWatched();
              setState(null);
            }}
          />
        </>
      ) : (
        <>
          <form className="sk-watch__search" onSubmit={search}>
            <label className="sr-only" htmlFor="kelurahan-cari">
              Cari kelurahan
            </label>
            <div className="sk-search">
              <Search size={17} aria-hidden="true" />
              <input
                id="kelurahan-cari"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kelurahan, contoh: Ceger"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={searching}>
              {searching ? "Mencari…" : "Cari"}
            </button>
          </form>

          {results.length > 0 ? (
            <ul className="sk-watch__results">
              {results.map((item) => (
                <li key={item.kode}>
                  <button type="button" onClick={() => choose(item)}>
                    <b>{item.nama}</b>
                    <span>
                      {item.kecamatan ??
                        item.kecamatanSlug ??
                        item.kecamatan_slug ??
                        item.kode}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {message ? (
            <p className="sk-field__hint" role="status">
              {message}
            </p>
          ) : null}
        </>
      )}

      <IosInstallHint />
    </section>
  );
}
