"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RISK_LEVEL_LABELS } from "@/lib/risk/level";
import type { MapDistrict, MapReport } from "./map-types";

// Leaflet needs real colour strings, so the risk and palette tokens are read from globals.css
const TOKEN: Record<MapDistrict["level"], string> = {
  low: "--risk-low",
  moderate: "--risk-moderate",
  high: "--risk-high",
  very_high: "--risk-very-high",
};
const token = (node: Element, name: string) =>
  getComputedStyle(node).getPropertyValue(name).trim();

// stable default: a fresh [] per render would rebuild the map on every parent render
const NO_REPORTS: MapReport[] = [];

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const CAMERA = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;

/**
 * Leaflet map shared by the risk and report pages: a circle per district and an optional camera
 * marker per citizen report. Plain Leaflet in one effect (not react-leaflet): the effect removes
 * the map on unmount and on React's dev double-mount, so the container is always clean.
 */
export default function RiskMapInner({
  items,
  reports = NO_REPORTS,
  label = "Peta risiko banjir per kecamatan di Jakarta",
  onSelect,
  selectedSlug,
}: {
  items: MapDistrict[];
  reports?: MapReport[];
  label?: string;
  onSelect?: (slug: string) => void;
  selectedSlug?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const circles = useRef(new Map<string, L.CircleMarker>());
  // read through a ref so a new callback never rebuilds the map
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

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

    const markers = circles.current;
    const rim = token(node, "--p-card");
    for (const district of items) {
      const circle = L.circleMarker([district.lat, district.lng], {
        radius: 14,
        color: rim,
        weight: 2,
        fillColor: token(node, TOKEN[district.level]),
        fillOpacity: 0.92,
      })
        .addTo(map)
        .bindPopup(
          `<div class="sk-map__popup"><b>${escape(district.name)}</b>` +
            `<span>${RISK_LEVEL_LABELS[district.level]} · skor ${district.score}</span>` +
            `<a href="/wilayah/${district.slug}">Lihat detail</a></div>`,
        )
        .on("click", () => onSelectRef.current?.(district.slug));
      markers.set(district.slug, circle);
    }

    const camera = L.divIcon({
      className: "sk-map__camera",
      html: `<span class="sk-map__camera-pin">${CAMERA}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -14],
    });

    for (const report of reports) {
      L.marker([report.lat, report.lng], {
        icon: camera,
        zIndexOffset: 500,
        alt: `Laporan warga${report.isDemo ? " contoh" : ""}`,
      })
        .addTo(map)
        .bindPopup(
          `<div class="sk-map__popup"><b>Laporan warga${
            report.isDemo ? ' <span class="sk-tag">Contoh</span>' : ""
          }</b>` +
            `<span>Keparahan ${report.severity}/4</span>` +
            (report.summary ? `<span>${escape(report.summary)}</span>` : "") +
            `</div>`,
        );
    }

    // the box settles after the first frame and, on /peta, follows the weather column's height
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(map.getContainer());

    return () => {
      resize.disconnect();
      markers.clear();
      map.remove();
    };
  }, [items, reports]);

  // selection only restyles the circles; the map itself stays
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const ink = token(node, "--p-ink");
    const rim = token(node, "--p-card");
    for (const [slug, circle] of circles.current) {
      const selected = slug === selectedSlug;
      circle.setStyle({
        color: selected ? ink : rim,
        weight: selected ? 4 : 2,
      });
      if (selected) circle.bringToFront();
    }
  }, [items, selectedSlug]);

  return (
    <div ref={container} className="sk-map" role="region" aria-label={label} />
  );
}
