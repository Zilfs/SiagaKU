"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";
import { DEMO_DISTRICTS } from "@/lib/demo/districts";

/** Jakarta's rough bounding box; outside it the demo data says nothing useful. */
const JAKARTA = { north: -6.0, south: -6.45, west: 106.6, east: 107.05 };

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * "Use my location": finds the nearest sample district and opens its page. Outside Jakarta it
 * says so, as docs/04 asks; a denied permission falls back to the list.
 */
export function UseLocation() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setMessage("Perangkat ini tidak mendukung lokasi. Pilih kecamatan dari daftar.");
      return;
    }
    setMessage("Mencari kecamatan terdekat…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (
          latitude < JAKARTA.south ||
          latitude > JAKARTA.north ||
          longitude < JAKARTA.west ||
          longitude > JAKARTA.east
        ) {
          setMessage("SiagaKU saat ini hanya untuk DKI Jakarta.");
          return;
        }
        const point = { lat: latitude, lng: longitude };
        const nearest = DEMO_DISTRICTS.reduce((best, district) =>
          distanceKm(point, district) < distanceKm(point, best) ? district : best,
        );
        router.push(`/wilayah/${nearest.slug}`);
      },
      () => {
        setMessage("Izin lokasi ditolak. Pilih kecamatan dari daftar di bawah.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="sk-geo">
      <button className="btn" type="button" onClick={locate}>
        <LocateFixed size={16} aria-hidden="true" />
        Gunakan lokasiku
      </button>
      {message ? (
        <p className="sk-mono t-small muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
