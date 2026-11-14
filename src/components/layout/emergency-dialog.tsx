"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { EMERGENCY_EVENT } from "./emergency";

/**
 * The emergency dialog: one native <dialog> for the whole site, opened from the header, the footer
 * and the FAQ card. Esc and the close button both work without script; the only phone number is 112.
 */
export function EmergencyDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const open = () => {
      if (!dialog.open) dialog.showModal();
    };
    window.addEventListener(EMERGENCY_EVENT, open);
    return () => window.removeEventListener(EMERGENCY_EVENT, open);
  }, []);

  return (
    <dialog ref={ref} className="sk-dialog" aria-labelledby="darurat-h">
      <div className="sk-dialog__in">
        <div className="sk-dialog__head">
          <div>
            <h2 id="darurat-h">Dalam bahaya? Hubungi 112 sekarang.</h2>
            <p>Layanan Jakarta Siaga, gratis 24 jam.</p>
          </div>
          <button
            type="button"
            className="sk-dialog__close"
            aria-label="Tutup dialog darurat"
            onClick={() => ref.current?.close()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <a className="sk-dialog__call" href="tel:112">
          <span>Telepon darurat</span>
          <b>112</b>
          <small>Gratis dari telepon dan ponsel</small>
        </a>
        <p className="sk-dialog__note">
          Jika air sudah masuk rumah atau ada orang terjebak, hubungi 112 dan
          ikuti arahan petugas. SiagaKU hanya memberi informasi persiapan, bukan
          peringatan resmi.
        </p>
        <p className="sk-dialog__note">
          Tidak ada data pribadi yang dikirim saat kamu memakai halaman ini.
          Nomor kelurahan atau posko bisa berubah, jadi cek di kantor kelurahan
          setempat.
        </p>
      </div>
    </dialog>
  );
}
