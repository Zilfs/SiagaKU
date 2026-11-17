"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";
import type { DistrictSummary } from "@/features/risk/types";
import { findDistrictByPoint } from "@/lib/geo";

/**
 * "Use my location": opens the district whose boundary contains the point, falling back to the
 * nearest centre within 15 km (outside Jakarta). A denied permission keeps the user on the list.
 */
export function UseLocation({ districts }: { districts: DistrictSummary[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const locate = () => {
    if (!districts.length) {
      setMessage("Data risiko belum tersedia. Coba lagi nanti.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setMessage("Perangkat ini tidak mendukung lokasi. Pilih kecamatan dari daftar.");
      return;
    }
    setMessage("Mencari kecamatan…");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const match = await findDistrictByPoint(point, districts);
        if (!match) {
          setMessage("SiagaKU saat ini hanya untuk DKI Jakarta.");
          return;
        }
        router.push(`/wilayah/${match.slug}`);
      },
      (error) => {
        setMessage(
          error.code === error.TIMEOUT
            ? "Lokasi belum ditemukan. Coba lagi atau pilih kecamatan dari daftar."
            : "Izin lokasi ditolak. Pilih kecamatan dari daftar di bawah.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
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
