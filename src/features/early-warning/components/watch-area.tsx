"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { MapPinned, Search } from "lucide-react";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";
import {
  parseSubdistricts,
  toAlertInfo,
  type AlertInfo,
  type Subdistrict,
} from "../alert-data";
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

export function WatchArea({ districtName }: { districtName?: string }) {
  const watchRaw = useSyncExternalStore(
    subscribe,
    getWatchSnapshot,
    getServerSnapshot,
  );
  const watched = parseWatched(watchRaw);
  const kode = watched?.kode;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Subdistrict[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{
    kode: string;
    data: AlertInfo | null;
  } | null>(null);

  useEffect(() => {
    if (!kode) return;
    let cancelled = false;
    fetch(`/api/early-warning/${kode}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (!cancelled) {
          setState({ kode, data: payload ? toAlertInfo(payload) : null });
        }
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
  const status = data?.status ?? null;

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/subdistricts?q=${encodeURIComponent(term)}`,
      );
      if (!response.ok) throw new Error("not ready");
      const list = parseSubdistricts(await response.json());
      const inDistrict = districtName
        ? list.filter((item) =>
            item.kecamatan.toLowerCase().includes(districtName.toLowerCase()),
          )
        : list;
      const visible = inDistrict.length > 0 ? inDistrict : list;
      setResults(visible);
      if (!visible.length) setMessage("Tidak ada kelurahan yang cocok.");
    } catch {
      setResults([]);
      setMessage("Data kelurahan belum tersedia. Coba lagi nanti.");
    } finally {
      setSearching(false);
    }
  };

  const choose = (item: Subdistrict) => {
    setWatched({
      kode: item.kode,
      nama: item.nama,
      kecamatan: item.kecamatan,
    });
    setResults([]);
    setQuery("");
    setMessage("");
  };

  return (
    <section className="sk-card sk-watch" aria-labelledby="pantau-h">
      <div className="sk-card__head">
        <h2 id="pantau-h" className="sk-heading-icon">
          <MapPinned size={18} aria-hidden="true" />
          {watched ? "Wilayah dipantau" : "Pantau wilayah"}
        </h2>
        <span className="sk-mono">{watched ? watched.kode : "BMKG"}</span>
      </div>

      {watched ? (
        <>
          <div className="sk-watch__current">
            <b>{watched.nama}</b>
            {(watched.kecamatan ?? watched.kecamatanSlug) ? (
              <span>{watched.kecamatan ?? watched.kecamatanSlug}</span>
            ) : null}{" "}
          </div>

          <div className="sk-watch__status" aria-live="polite">
            {loading ? (
              <>
                <LoadingStatus />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-2/5" />
              </>
            ) : status ? (
              <>
                <span
                  className={`sk-status sk-status--${status.toLowerCase()}`}
                >
                  {status}
                </span>
                {data?.category ? <p>Prakiraan: {data.category}</p> : null}
                {data?.rainfallMm != null ? (
                  <p>Hujan 24 jam: {data.rainfallMm} mm</p>
                ) : null}
                {data?.windowLabel ? (
                  <p>Jendela hujan: {data.windowLabel}</p>
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
          {districtName ? (
            <p className="sk-watch__context">
              Kecamatan <b>{districtName}</b>. Cari kelurahanmu di bawah.
            </p>
          ) : null}

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
            <button
              type="submit"
              className="btn btn--primary"
              disabled={searching}
            >
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
                      {[item.kecamatan, item.kota]
                        .filter(Boolean)
                        .join(" · ") || item.kode}
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
