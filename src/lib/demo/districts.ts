/**
 * Demo district data for the landing page while the risk API (Task 7) is not wired yet.
 *
 * Scores follow the scoring rule in docs/06-data: round(0.55 * vulnerability + 0.45 * rainFactor).
 * `rainFactor` is the BMKG category table: 0 | 20 | 45 | 70 | 90 | 100. Every value here is sample
 * data and the interface labels it "Data contoh". Delete this file once `listDistrictsWithScore`
 * returns the same shape from the database.
 */

export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export type District = {
  slug: string;
  name: string;
  city: string;
  /** Approximate district centroid, for the demo map (data contoh). */
  lat: number;
  lng: number;
  /** Base vulnerability, 0-100 (docs/06-data). */
  vulnerability: number;
  /** Rain category factor, 0-100 (docs/06-data). */
  rainFactor: number;
  /** Largest forecast daily rainfall in the next three days, mm. */
  rainfallMm: number;
  /** Local time of the last refresh. */
  updatedAt: string;
};

export type ScoredDistrict = District & {
  score: number;
  level: RiskLevel;
};

export function levelOf(score: number): RiskLevel {
  if (score < 25) return "low";
  if (score < 50) return "moderate";
  if (score < 75) return "high";
  return "very_high";
}

export function scoreOf(district: District): number {
  return Math.round(0.55 * district.vulnerability + 0.45 * district.rainFactor);
}

export function withScore(district: District): ScoredDistrict {
  const score = scoreOf(district);
  return { ...district, score, level: levelOf(score) };
}

export const DEMO_DISTRICTS: ScoredDistrict[] = [
  {
    slug: "jatinegara",
    name: "Jatinegara",
    city: "Jakarta Timur",
    lat: -6.225,
    lng: 106.87,
    vulnerability: 80,
    rainFactor: 45,
    rainfallMm: 35,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "cengkareng",
    name: "Cengkareng",
    city: "Jakarta Barat",
    lat: -6.15,
    lng: 106.73,
    vulnerability: 88,
    rainFactor: 70,
    rainfallMm: 62,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "kalideres",
    name: "Kalideres",
    city: "Jakarta Barat",
    lat: -6.15,
    lng: 106.7,
    vulnerability: 82,
    rainFactor: 70,
    rainfallMm: 58,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "penjaringan",
    name: "Penjaringan",
    city: "Jakarta Utara",
    lat: -6.12,
    lng: 106.79,
    vulnerability: 84,
    rainFactor: 45,
    rainfallMm: 31,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "cilincing",
    name: "Cilincing",
    city: "Jakarta Utara",
    lat: -6.1,
    lng: 106.94,
    vulnerability: 86,
    rainFactor: 70,
    rainfallMm: 74,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "matraman",
    name: "Matraman",
    city: "Jakarta Timur",
    lat: -6.21,
    lng: 106.86,
    vulnerability: 70,
    rainFactor: 45,
    rainfallMm: 28,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "kembangan",
    name: "Kembangan",
    city: "Jakarta Barat",
    lat: -6.19,
    lng: 106.74,
    vulnerability: 62,
    rainFactor: 45,
    rainfallMm: 26,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "cipayung",
    name: "Cipayung",
    city: "Jakarta Timur",
    lat: -6.29,
    lng: 106.9,
    vulnerability: 52,
    rainFactor: 20,
    rainfallMm: 14,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "pancoran",
    name: "Pancoran",
    city: "Jakarta Selatan",
    lat: -6.245,
    lng: 106.84,
    vulnerability: 48,
    rainFactor: 35,
    rainfallMm: 22,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "kebayoran-baru",
    name: "Kebayoran Baru",
    city: "Jakarta Selatan",
    lat: -6.24,
    lng: 106.8,
    vulnerability: 40,
    rainFactor: 20,
    rainfallMm: 12,
    updatedAt: "14.00 WIB",
  },
  {
    slug: "menteng",
    name: "Menteng",
    city: "Jakarta Pusat",
    lat: -6.195,
    lng: 106.83,
    vulnerability: 34,
    rainFactor: 20,
    rainfallMm: 9,
    updatedAt: "14.00 WIB",
  },
].map(withScore);

/** City-wide count per level, the strip the landing shows under the search. Sample data. */
export const CITY_COUNTS: { level: RiskLevel; count: number }[] = [
  { level: "very_high", count: 3 },
  { level: "high", count: 9 },
  { level: "moderate", count: 18 },
  { level: "low", count: 14 },
];

export function searchDistricts(query: string): ScoredDistrict[] {
  const term = query.trim().toLowerCase();
  if (!term) return DEMO_DISTRICTS;
  return DEMO_DISTRICTS.filter(
    (district) =>
      district.name.toLowerCase().includes(term) ||
      district.city.toLowerCase().includes(term),
  );
}

/** Short, plain Indonesian line for the selected district's risk. */
export function riskAction(level: RiskLevel): string {
  switch (level) {
    case "very_high":
      return "Siapkan tas siaga dan rencanakan tempat mengungsi sekarang.";
    case "high":
      return "Pindahkan barang penting ke tempat tinggi dan cek jalur keluar.";
    case "moderate":
      return "Bersihkan saluran air di sekitar rumah dan simpan dokumen di tempat aman.";
    case "low":
      return "Simpan nomor darurat dan cek tas siaga keluarga tetap lengkap.";
  }
}
