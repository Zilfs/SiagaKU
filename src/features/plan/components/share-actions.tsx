"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Printer, RotateCcw, Share2 } from "lucide-react";

/** Copy the plan link, send it on WhatsApp, print it, or start over. */
export function ShareActions({
  districtSlug,
  districtName,
}: {
  districtSlug: string;
  districtName: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // the browser may block the clipboard; the link stays in the address bar
    }
  };

  const share = () => {
    const text = `Rencana siaga keluarga ${districtName}: ${window.location.href}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="sk-share sk-print-hide">
      <button type="button" className="btn" onClick={copy}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {copied ? "Tersalin" : "Salin link"}
      </button>
      <button type="button" className="btn" onClick={share}>
        <Share2 size={16} aria-hidden="true" />
        WhatsApp
      </button>
      <button type="button" className="btn" onClick={() => window.print()}>
        <Printer size={16} aria-hidden="true" />
        Cetak
      </button>
      <Link className="link" href={`/rencana?kecamatan=${districtSlug}`}>
        <RotateCcw size={15} aria-hidden="true" />
        Buat ulang
      </Link>
      <span className="sr-only" role="status">
        {copied ? "Link rencana tersalin" : ""}
      </span>
    </div>
  );
}
