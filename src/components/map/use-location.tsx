"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";


/**
 * "Use my location": finds the nearest district and opens its page. The 15 km limit in
 * `findNearestDistrict` covers the "outside Jakarta" case; a denied permission falls back to the list.
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
      async (position) => {
        try {
          const response = await fetch(
            `/api/location/nearest?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          );
          if (!response.ok) {
            setMessage("SiagaKU saat ini hanya untuk DKI Jakarta.");
            return;
          }
          const { slug } = await response.json();
          router.push(`/wilayah/${slug}`);
        } catch {
          setMessage("Gagal mencari lokasi. Coba lagi.");
        }
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
