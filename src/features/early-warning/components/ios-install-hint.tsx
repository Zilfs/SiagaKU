"use client";

import { useEffect, useState } from "react";

/** The iOS instruction, shown only on an iPhone/iPad that is not already installed. */
export function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(ios && !standalone);
  }, []);

  if (!show) return null;
  return (
    <p className="sk-field__hint">
      Di iPhone, ketuk <b>Bagikan</b> → <b>Tambahkan ke Layar Utama</b>, lalu
      buka SiagaKU dari ikon itu untuk mengaktifkan notifikasi.
    </p>
  );
}
