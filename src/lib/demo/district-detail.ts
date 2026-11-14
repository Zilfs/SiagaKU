/**
 * Sample detail for one district (weather slots, flood history, safe points) while the risk API
 * (Task 7) is not wired into the pages. The shapes match `@/features/risk/types` and
 * `@/lib/data/bmkg`, so wiring later only replaces the data source. Every line is labelled
 * "data contoh" in the interface. Delete this file when the pages read the API.
 */

import { riskAction, type ScoredDistrict } from "@/lib/demo/districts";
import type { WeatherSlot } from "@/lib/data/bmkg";
import type { FloodEvent, SafePoint } from "@/features/risk/types";

const CONDITION = (mm: number) =>
  mm >= 50
    ? "Hujan lebat"
    : mm >= 20
      ? "Hujan sedang"
      : mm > 0
        ? "Hujan ringan"
        : "Berawan";

/** Three days of sample rain, in the BMKG slot shape. */
export function weatherFor(district: ScoredDistrict): WeatherSlot[] {
  const today = district.rainfallMm;
  const slot = (localTime: string, mm: number, temperature: number): WeatherSlot => ({
    localTime,
    temperature,
    humidity: null,
    description: CONDITION(mm),
    icon: null,
    rainfallMm: mm,
  });
  return [
    slot("2026-11-14 14:00:00", today, 31),
    slot("2026-11-15 13:00:00", Math.round(today * 0.7), 30),
    slot("2026-11-16 13:00:00", Math.round(today * 0.4), 29),
  ];
}

/** Two sample events, deeper for the districts with a higher base vulnerability. */
export function historyFor(district: ScoredDistrict): FloodEvent[] {
  const depth = Math.max(20, Math.round(district.vulnerability * 0.75));
  return [
    {
      date: "2025-02-14",
      subdistrict: district.name,
      maxDepthCm: depth,
      sourceUrl: "https://data.jakarta.go.id/",
    },
    {
      date: "2024-01-11",
      subdistrict: district.name,
      maxDepthCm: Math.max(15, depth - 20),
      sourceUrl: "https://data.jakarta.go.id/",
    },
  ];
}

/** Two sample safe points in the Task 7 shape; distance is computed from lat/lng in the UI. */
export function safePointsFor(district: ScoredDistrict): SafePoint[] {
  return [
    {
      id: 1,
      name: `Balai RW 03 ${district.name}`,
      type: "Posko banjir",
      isVerified: true,
      lat: district.lat + 0.006,
      lng: district.lng - 0.004,
    },
    {
      id: 2,
      name: `SD Negeri ${district.name} 01`,
      type: "Titik kumpul",
      isVerified: false,
      lat: district.lat - 0.008,
      lng: district.lng + 0.005,
    },
  ];
}

/** Plain-language sample explanation for the district page. */
export function explanationFor(district: ScoredDistrict): string {
  const rain =
    district.rainfallMm >= 50
      ? `Hujan lebat ${district.rainfallMm} mm`
      : district.rainfallMm >= 20
        ? `Hujan sedang ${district.rainfallMm} mm`
        : `Hujan ringan ${district.rainfallMm} mm`;
  return `${rain} diperkirakan turun dalam tiga hari. Skor ${district.name} ${district.score} dari kerawanan dasar ${district.vulnerability} dan faktor hujan ${district.rainFactor}. ${riskAction(district.level)}`;
}
