"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ScoredDistrict } from "@/lib/demo/districts";
import { riskLabel } from "@/lib/demo/districts";

const COLOR: Record<ScoredDistrict["level"], string> = {
  low: "#2e9e5b",
  moderate: "#e2b007",
  high: "#e8771e",
  very_high: "#c62828",
};

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Leaflet map of the sample districts. Plain Leaflet in one effect (not react-leaflet): the effect
 * removes the map on unmount and on React's dev double-mount, so the container is always clean.
 */
export default function RiskMapInner({ items }: { items: ScoredDistrict[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = container.current;
    if (!node) return;

    const map = L.map(node, {
      center: [-6.2, 106.82],
      zoom: 11,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    for (const district of items) {
      L.circleMarker([district.lat, district.lng], {
        radius: 14,
        color: "#ffffff",
        weight: 2,
        fillColor: COLOR[district.level],
        fillOpacity: 0.92,
      })
        .addTo(map)
        .bindPopup(
          `<div class="sk-map__popup"><b>${escape(district.name)}</b>` +
            `<span>${riskLabel(district.level)} · skor ${district.score}</span>` +
            `<a href="/wilayah/${district.slug}">Lihat detail</a></div>`,
        );
    }

    // the panes can settle after the first frame (fonts, the sticky header): one size check
    const timer = window.setTimeout(() => map.invalidateSize(), 60);

    return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [items]);

  return (
    <div
      ref={container}
      className="sk-map"
      role="region"
      aria-label="Peta risiko banjir per kecamatan di Jakarta"
    />
  );
}
