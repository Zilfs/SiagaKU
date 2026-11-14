import "server-only";
import { getBmkgForecast } from "@/lib/data/bmkg";
import { getMaxRainfall3Days } from "@/lib/data/open-meteo";
import { calculateRiskScore } from "@/lib/risk/score";
import type { District, DistrictSummary, RiskDetail } from "../types";
import {
  findDistrict,
  listDistricts,
  listFloodEvents,
  listShelters,
} from "./risk-repository";

async function scoreDistrict(d: District) {
  const { maxMm } = await getMaxRainfall3Days(d.id, d.lat, d.lng);
  return {
    maxMm,
    ...calculateRiskScore({
      baseVulnerability: d.baseVulnerability,
      maxRainfallMm: maxMm,
    }),
  };
}

export async function listDistrictsWithScore(): Promise<DistrictSummary[]> {
  const districts = await listDistricts();
  return Promise.all(
    districts.map(async (d) => {
      const { score, level } = await scoreDistrict(d);
      return {
        id: d.id,
        slug: d.slug,
        name: d.name,
        city: d.city,
        lat: d.lat,
        lng: d.lng,
        score,
        level,
        tidalFloodProne: d.tidalFloodProne,
      };
    }),
  );
}

/** Numeric strings are ids, anything else is a slug. */
export async function getRiskDetail(
  idOrSlug: string,
): Promise<RiskDetail | null> {
  const d = await findDistrict(
    /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug,
  );
  if (!d) return null;

  const [risk, bmkg, floodHistory, safePoints] = await Promise.all([
    scoreDistrict(d),
    getBmkgForecast(d.bmkgAdm4),
    listFloodEvents(d.id),
    listShelters(d.id),
  ]);

  return {
    district: {
      id: d.id,
      slug: d.slug,
      name: d.name,
      city: d.city,
      tidalFloodProne: d.tidalFloodProne,
    },
    score: risk.score,
    level: risk.level,
    components: {
      baseVulnerability: d.baseVulnerability,
      rainfallFactor: risk.rainfallFactor,
      maxRainfallMm: risk.maxMm,
      rainfallCategory: risk.rainfallCategory,
    },
    noRainfallData: risk.noRainfallData,
    weather: {
      source: "BMKG",
      updatedAt: bmkg.data?.updatedAt ?? null,
      stale: bmkg.stale,
      slots: bmkg.data?.slots ?? [],
    },
    floodHistory,
    safePoints,
  };
}
