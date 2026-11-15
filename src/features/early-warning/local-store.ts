"use client";

const WATCH_KEY = "siagaku:pantau";
const HIDE_KEY = "siagaku:banner-hidden-until";

export type WatchedArea = {
  kode: string;
  nama: string;
  kecamatan?: string;
  kecamatanSlug?: string;
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getWatchSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(WATCH_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getHiddenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(HIDE_KEY);
    if (!raw) return false;
    return Date.now() < Date.parse(raw);
  } catch {
    return false;
  }
}

export function getServerSnapshot(): string {
  return "";
}

export function parseWatched(raw: string): WatchedArea | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as WatchedArea;
    return value && typeof value.kode === "string" ? value : null;
  } catch {
    return null;
  }
}

export function setWatched(value: WatchedArea) {
  try {
    window.localStorage.setItem(WATCH_KEY, JSON.stringify(value));
  } catch {
    return;
  }
  emit();
}

export function clearWatched() {
  try {
    window.localStorage.removeItem(WATCH_KEY);
  } catch {
    return;
  }
  emit();
}

/** Hide the banner for the next three hours (docs/08 §7). */
export function hideBanner(hours = 3) {
  try {
    const until = new Date(Date.now() + hours * 3_600_000).toISOString();
    window.localStorage.setItem(HIDE_KEY, until);
  } catch {
    return;
  }
  emit();
}
