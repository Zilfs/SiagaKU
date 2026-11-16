"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Camera,
  LoaderCircle,
  LocateFixed,
  RotateCcw,
  Send,
} from "lucide-react";
import { findNearestDistrict } from "@/lib/geo";
import { compressImage } from "../compress-image";
import {
  toReportResult,
  type RawReportCreated,
  type ReportResult,
} from "../report-point";
import type { ReportDistrict } from "../types";

type Step = "idle" | "compressing" | "uploading" | "analyzing";

export function ReportForm({ districts }: { districts: ReportDistrict[] }) {
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [description, setDescription] = useState("");
  const [districtId, setDistrictId] = useState<number | "">("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const busy = step !== "idle";

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setMessage("");
    setResult(null);
    setStep("compressing");
    try {
      const blob = await compressImage(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
    } catch (error) {
      setPhoto(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Foto gagal diproses. Coba lagi.",
      );
    } finally {
      setStep("idle");
    }
  };

  const chooseDistrict = (value: string) => {
    const id = Number(value);
    const district = districts.find((item) => item.id === id);
    setDistrictId(district ? district.id : "");
    setCoords(district ? { lat: district.lat, lng: district.lng } : null);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setMessage(
        "Perangkat ini tidak mendukung lokasi. Pilih kecamatan dari daftar.",
      );
      return;
    }
    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocating(false);
        const nearest = findNearestDistrict(point, districts);
        if (!nearest && districts.length > 0) {
          setMessage(
            "Lokasimu di luar DKI Jakarta. SiagaKU hanya untuk DKI Jakarta.",
          );
          return;
        }
        setDistrictId(nearest?.id ?? "");
        setCoords(point);
        setMessage(
          nearest
            ? `Lokasi terdeteksi di sekitar ${nearest.name}.`
            : "Lokasi terdeteksi. Kami akan mencocokkannya dengan kecamatan terdekat.",
        );
      },
      () => {
        setLocating(false);
        setMessage("Izin lokasi ditolak. Pilih kecamatan dari daftar.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const reset = () => {
    setResult(null);
    setMessage("");
    setPhoto(null);
    setDescription("");
    setDistrictId("");
    setCoords(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photo || !coords || busy) return;
    setMessage("");
    setResult(null);

    try {
      setStep("uploading");
      const uploadResponse = await fetch("/api/reports/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: photo.blob.type || "image/jpeg",
          size: photo.blob.size,
        }),
      });
      if (!uploadResponse.ok) {
        throw new Error(
          uploadResponse.status === 429
            ? "Kamu sudah mengirim beberapa laporan. Coba lagi nanti."
            : "Laporan belum bisa dikirim. Coba lagi sebentar lagi.",
        );
      }
      const upload = (await uploadResponse.json()) as {
        path: string;
        signedUrl: string;
      };

      const putResponse = await fetch(upload.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": photo.blob.type || "image/jpeg" },
        body: photo.blob,
      });
      if (!putResponse.ok) {
        throw new Error("Foto gagal diunggah. Coba lagi.");
      }

      setStep("analyzing");
      const note = description.trim();
      const reportResponse = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: upload.path,
          lat: coords.lat,
          lng: coords.lng,
          description: note,
        }),
      });
      if (!reportResponse.ok) {
        throw new Error(
          reportResponse.status === 429
            ? "Kamu sudah mengirim beberapa laporan. Coba lagi nanti."
            : "Laporan belum bisa dikirim. Coba lagi sebentar lagi.",
        );
      }
      setResult(
        toReportResult((await reportResponse.json()) as RawReportCreated),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Laporan belum bisa dikirim. Coba lagi.",
      );
    } finally {
      setStep("idle");
    }
  };

  const rejected = result?.rejected === true;

  return (
    <section className="sk-card sk-report" aria-labelledby="lapor-h">
      <div className="sk-card__head">
        <h2 id="lapor-h" className="sk-heading-icon">
          <Camera size={18} aria-hidden="true" />
          Lapor genangan
        </h2>
        <span className="sk-mono">foto · lokasi</span>
      </div>

      {result && !rejected ? (
        <div className="sk-report-result" role="status">
          <b>
            {result.status === "menunggu"
              ? "Laporan diterima."
              : "Laporan diterima dan sudah diperiksa."}
          </b>
          {result.summary ? <p>{result.summary}</p> : null}
          {result.waterHeight ? (
            <p className="sk-mono">
              Perkiraan tinggi air: {result.waterHeight}
            </p>
          ) : null}
          <p className="sk-field__hint">
            Laporan warga belum diverifikasi petugas. Laporan tampil di peta
            setelah AI memastikan ada genangan.
          </p>
          <div className="sk-report-result__actions">
            <Link className="btn btn--primary" href="/laporan">
              Lihat laporan warga
            </Link>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={reset}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Lapor lagi
            </button>
          </div>
        </div>
      ) : null}

      {rejected ? (
        <div
          className="sk-report-result sk-report-result--rejected"
          role="alert"
        >
          <b>Foto ini belum bisa kami tampilkan.</b>
          <p>
            Sepertinya bukan genangan atau banjir. Coba foto lain yang
            memperlihatkan air dan patokan jalan.
          </p>
          <button type="button" className="btn btn--secondary" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Coba foto lain
          </button>
        </div>
      ) : null}

      <form className="sk-report-form" onSubmit={submit}>
        <div className="sk-field">
          <label htmlFor="lapor-foto">Foto genangan</label>
          <label className="sk-photo" htmlFor="lapor-foto">
            {photo ? (
              // a local blob preview; the alt says what the photo is for
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt="Pratinjau foto laporan" />
            ) : (
              <span>
                <Camera size={22} aria-hidden="true" />
                Ambil atau pilih foto
              </span>
            )}
            <input
              id="lapor-foto"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              aria-describedby="lapor-foto-hint"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void onPhoto(file);
              }}
            />
          </label>
          <p className="sk-field__hint" id="lapor-foto-hint">
            Foto genangan dengan patokan jalan. Jangan sertakan wajah orang lain
            atau data pribadi.
          </p>
        </div>

        <div className="sk-field">
          <label htmlFor="lapor-kecamatan">Kecamatan</label>
          <select
            id="lapor-kecamatan"
            value={districtId}
            onChange={(event) => chooseDistrict(event.target.value)}
            aria-describedby="lapor-lokasi-hint"
          >
            <option value="">Pilih kecamatan</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name} · {district.city}
              </option>
            ))}
          </select>
          <div className="sk-report-locate">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={locate}
              disabled={locating}
            >
              <LocateFixed size={16} aria-hidden="true" />
              {locating ? "Mencari lokasi…" : "Gunakan lokasiku"}
            </button>
            {coords ? (
              <span className="sk-mono">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            ) : null}
          </div>
          <p className="sk-field__hint" id="lapor-lokasi-hint">
            {districts.length === 0
              ? "Data kecamatan belum tersedia. Gunakan lokasimu agar laporan tetap bisa dikirim."
              : "Pilih kecamatan atau gunakan lokasimu. Alamat lengkap tidak disimpan."}
          </p>
        </div>

        <div className="sk-field">
          <label htmlFor="lapor-deskripsi">Deskripsi (opsional)</label>
          <textarea
            id="lapor-deskripsi"
            rows={3}
            maxLength={200}
            value={description}
            placeholder="Contoh: air setinggi lutut di depan gang"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        {message ? (
          <p className="sk-field__error" role="alert">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={!photo || !coords || busy}
        >
          {busy ? (
            <>
              <LoaderCircle size={16} className="sk-spin" aria-hidden="true" />
              {step === "compressing"
                ? "Menyiapkan foto…"
                : step === "uploading"
                  ? "Mengunggah foto…"
                  : "AI memeriksa foto…"}
            </>
          ) : (
            <>
              <Send size={16} aria-hidden="true" />
              Kirim laporan
            </>
          )}
        </button>
      </form>
    </section>
  );
}
