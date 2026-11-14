/**
 * Sample detail for one district (weather slots, flood history, safe points) while Task 7's API is
 * not wired. Every line is labelled "data contoh" in the interface. Delete this file when
 * `getRiskDetail` returns the same shapes from the database.
 */

import { riskAction, type ScoredDistrict } from "@/lib/demo/districts";

export type WeatherSlot = {
  day: string;
  time: string;
  condition: string;
  rainfallMm: number;
};

export type FloodEvent = {
  when: string;
  area: string;
  depthCm: number;
  duration: string;
};

export type SafePoint = {
  name: string;
  kind: string;
  distance: string;
  note: string;
};

const CONDITION = (mm: number) =>
  mm >= 50
    ? "Hujan lebat"
    : mm >= 20
      ? "Hujan sedang"
      : mm > 0
        ? "Hujan ringan"
        : "Berawan";

/** Three days of sample rain, scaled from the district's forecast figure. */
export function weatherFor(district: ScoredDistrict): WeatherSlot[] {
  const today = district.rainfallMm;
  return [
    { day: "Hari ini", time: "14.00", condition: CONDITION(today), rainfallMm: today },
    { day: "Besok", time: "13.00", condition: CONDITION(Math.round(today * 0.7)), rainfallMm: Math.round(today * 0.7) },
    { day: "Lusa", time: "13.00", condition: CONDITION(Math.round(today * 0.4)), rainfallMm: Math.round(today * 0.4) },
  ];
}

/** Two sample events, deeper for the districts with a higher base vulnerability. */
export function historyFor(district: ScoredDistrict): FloodEvent[] {
  const depth = Math.max(20, Math.round(district.vulnerability * 0.75));
  return [
    {
      when: "Feb 2025",
      area: `Jl. ${district.name} Raya`,
      depthCm: depth,
      duration: "4 jam",
    },
    {
      when: "Jan 2024",
      area: `Permukiman ${district.name}`,
      depthCm: Math.max(15, depth - 20),
      duration: "2 jam",
    },
  ];
}

/** Two sample safe points. Names stay generic so nothing reads as a verified shelter list. */
export function safePointsFor(district: ScoredDistrict): SafePoint[] {
  return [
    {
      name: `Balai RW 03 ${district.name}`,
      kind: "Posko banjir",
      distance: "600 m",
      note: "Buka 24 jam saat status Siaga",
    },
    {
      name: `SD Negeri ${district.name} 01`,
      kind: "Titik kumpul",
      distance: "1,2 km",
      note: "Halaman luas, akses kursi roda",
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
