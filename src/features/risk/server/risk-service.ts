import "server-only";
import { getBmkgForecast } from "@/lib/data/bmkg";
import {
  getMaxRainfall3Days,
  getRainOutlook,
  type RainOutlook,
} from "@/lib/data/open-meteo";
import { calculateRiskScore } from "@/lib/risk/score";
import { monthlyFloodCounts, type MonthlyFloodCount } from "../flood-trend";
import type { District, DistrictSummary, RiskDetail } from "../types";
import {
  findDistrict,
  listDistricts,
  listFloodEventDates,
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
      lat: d.lat,
      lng: d.lng,
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

export async function getDistrictOutlook(
  idOrSlug: string,
): Promise<{ found: false } | { found: true; outlook: RainOutlook | null }> {
  const d = await findDistrict(
    /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug,
  );
  if (!d) return { found: false };
  return { found: true, outlook: await getRainOutlook(d.id, d.lat, d.lng) };
}

/** Jakarta-wide flood events per month for the last 12 months. */
export async function getFloodTrend(
  now = new Date(),
): Promise<MonthlyFloodCount[]> {
  const first = monthlyFloodCounts([], now)[0].month;
  return monthlyFloodCounts(await listFloodEventDates(`${first}-01`), now);
}
