"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Radio,
  Sparkles,
  Sun,
  TriangleAlert,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { RiskMap } from "@/components/map/risk-map";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";
import type { RainOutlook } from "@/lib/data/open-meteo";
import type { DistrictSummary, RiskDetail } from "../types";
import {
  WEATHER_KIND_LABELS,
  jakartaHour,
  kindFromCode,
  kindFromDescription,
  pickCurrentSlot,
  pickNextRainSlot,
  rainHeadline,
  type WeatherKind,
} from "../weather-view";

const ICONS: Record<WeatherKind, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
};

function WeatherIcon({
  kind,
  size = 18,
}: {
  kind: WeatherKind;
  size?: number;
}) {
  const Icon = ICONS[kind];
  return <Icon size={size} aria-hidden="true" />;
}

type Loaded = {
  slug: string;
  detail: RiskDetail | null;
  outlook: RainOutlook | null;
  /** when this load finished; the cards read "now" from it, so render stays pure */
  now: Date;
};

/**
 * The /peta dashboard: the map (click a circle to select its district) beside a column of weather
 * cards for the selected district. Detail (BMKG) and outlook (Open-Meteo) load per selection; the
 * previous request is aborted when the selection changes.
 */
export function MapDashboard({
  districts,
  initialSlug,
  bottom,
}: {
  districts: DistrictSummary[];
  initialSlug: string | null;
  bottom?: ReactNode;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    const get = <T,>(url: string): Promise<T | null> =>
      fetch(url, { signal: controller.signal })
        .then((res) => (res.ok ? (res.json() as Promise<T>) : null))
        .catch(() => null);
    Promise.all([
      get<RiskDetail>(`/api/risk/${slug}`),
      get<{ outlook: RainOutlook | null }>(`/api/risk/${slug}/outlook`),
    ]).then(([detail, outlook]) => {
      if (controller.signal.aborted) return;
      setLoaded({
        slug,
        detail,
        outlook: outlook?.outlook ?? null,
        now: new Date(),
      });
    });
    return () => controller.abort();
  }, [slug]);

  const district = districts.find((d) => d.slug === slug) ?? null;
  const loading = slug !== null && loaded?.slug !== slug;
  const data = loading ? null : loaded;
  const alertCount = districts.filter(
    (d) => d.level === "high" || d.level === "very_high",
  ).length;

  return (
    <section className="sk-dash" aria-label="Dasbor cuaca dan risiko">
      <div className="sk-dash__bar">
        <div className="sk-dash__live" aria-live="polite">
          <Radio size={16} aria-hidden="true" />
          {!district ? (
            <span>Pilih kecamatan di peta untuk melihat prakiraannya.</span>
          ) : loading ? (
            <Skeleton className="h-4 w-64" />
          ) : (
            <LiveText
              detail={data?.detail ?? null}
              now={data?.now ?? new Date(0)}
              name={district.name}
            />
          )}
          {district ? (
            <Link href={`/wilayah/${district.slug}`}>Lihat prakiraan</Link>
          ) : null}
        </div>
        {districts.length ? (
          <label className="sk-dash__chip">
            <MapPin size={15} aria-hidden="true" />
            <span className="sr-only">Pilih kecamatan</span>
            <select
              value={slug ?? ""}
              onChange={(event) => setSlug(event.target.value)}
            >
              {districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="sk-dash__grid">
        <div className="sk-dash__main">
          <div className="sk-map-shell sk-dash__map">
            <RiskMap
              items={districts}
              onSelect={setSlug}
              selectedSlug={slug ?? undefined}
            />
            {alertCount > 0 ? (
              <p className="sk-dash__alert">
                <TriangleAlert size={15} aria-hidden="true" />
                {alertCount} kecamatan risiko Tinggi/Sangat Tinggi
              </p>
            ) : null}
          </div>
          {bottom}
        </div>

        <aside
          className="sk-dash__aside"
          aria-label="Ringkasan cuaca kecamatan"
        >
          {loading || !data ? (
            slug ? (
              <>
                <LoadingStatus />
                <DashCardsSkeleton />
              </>
            ) : (
              <EmptyCards />
            )
          ) : (
            <>
              <CurrentWeather detail={data.detail} now={data.now} />
              <SevenDay outlook={data.outlook} slug={slug} />
              <HourlyRain outlook={data.outlook} now={data.now} />
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function LiveText({
  detail,
  now,
  name,
}: {
  detail: RiskDetail | null;
  now: Date;
  name: string;
}) {
  if (!detail || detail.weather.slots.length === 0) {
    return <span>Prakiraan BMKG untuk {name} belum tersedia.</span>;
  }
  const next = pickNextRainSlot(detail.weather.slots, now);
  return (
    <span>
      {next ? (
        <>
          <b>Info terkini:</b> {rainHeadline(next, now, name)}
        </>
      ) : (
        `Tidak ada hujan diprakirakan dalam 24 jam ke depan di ${name}.`
      )}
    </span>
  );
}

/** The right column's placeholders (the caller announces loading); also used by loading.tsx. */
export function DashCardsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((key) => (
        <div key={key} className="sk-card">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </>
  );
}

/** No district to show (the risk data is down): each card says so. */
function EmptyCards() {
  return (
    <>
      <CurrentWeather detail={null} now={new Date(0)} />
      <SevenDay outlook={null} slug={null} />
      <HourlyRain outlook={null} now={new Date(0)} />
    </>
  );
}

function CurrentWeather({
  detail,
  now,
}: {
  detail: RiskDetail | null;
  now: Date;
}) {
  const slot = detail ? pickCurrentSlot(detail.weather.slots, now) : null;
  return (
    <section className="sk-card sk-dash__card" aria-labelledby="dash-now-h">
      <div className="sk-card__head">
        <h2 id="dash-now-h" className="sk-heading-icon">
          <CloudSun size={18} aria-hidden="true" />
          Cuaca saat ini
        </h2>
        {slot ? (
          <span className="sk-mono">
            BMKG · {slot.localTime.slice(11, 16)} WIB
          </span>
        ) : null}
      </div>
      {!detail || !slot ? (
        <p className="sk-list__empty">Data cuaca BMKG belum tersedia.</p>
      ) : (
        <>
          <div className="sk-dash__now">
            <WeatherIcon
              kind={kindFromDescription(slot.description)}
              size={40}
            />
            <div>
              <b className="sk-dash__temp">
                {slot.temperature === null ? "–" : `${slot.temperature}°C`}
              </b>
              <span>{slot.description || "Tanpa keterangan"}</span>
            </div>
          </div>
          <dl className="sk-dash__facts">
            <div>
              <dt>
                <Droplets size={14} aria-hidden="true" /> Kelembapan
              </dt>
              <dd className="sk-mono">
                {slot.humidity === null ? "–" : `${slot.humidity}%`}
              </dd>
            </div>
            <div>
              <dt>
                <Wind size={14} aria-hidden="true" /> Angin
              </dt>
              <dd className="sk-mono">
                {slot.windSpeedKmh === null
                  ? "–"
                  : `${slot.windSpeedKmh} km/jam`}
              </dd>
            </div>
            <div>
              <dt>
                <CloudRain size={14} aria-hidden="true" /> Hujan
              </dt>
              <dd className="sk-mono">
                {slot.rainfallMm === null ? "–" : `${slot.rainfallMm} mm`}
              </dd>
            </div>
          </dl>
          <Link
            className="sk-dash__link"
            href={`/wilayah/${detail.district.slug}`}
          >
            Lihat detail {detail.district.name}
          </Link>
        </>
      )}
    </section>
  );
}

const weekday = (date: string, index: number) => {
  if (index === 0) return "Hari ini";
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    timeZone: "UTC",
  }).format(d);
};

function SevenDay({
  outlook,
  slug,
}: {
  outlook: RainOutlook | null;
  slug: string | null;
}) {
  const days = outlook?.daily.slice(0, 7) ?? [];
  return (
    <section className="sk-card sk-dash__card" aria-labelledby="dash-week-h">
      <div className="sk-card__head">
        <h2 id="dash-week-h" className="sk-heading-icon">
          <CalendarDays size={18} aria-hidden="true" />
          Prakiraan 7 hari
        </h2>
        <span className="sk-mono">Open-Meteo</span>
      </div>
      {days.length === 0 ? (
        <p className="sk-list__empty">Prakiraan 7 hari belum tersedia.</p>
      ) : (
        <ol className="sk-dash__days">
          {days.map((day, index) => {
            const kind = kindFromCode(day.weatherCode);
            return (
              <li key={day.date}>
                <span className="sk-dash__day">{weekday(day.date, index)}</span>
                <span className="sk-dash__cond">
                  <WeatherIcon kind={kind} />
                  <span className="sr-only">{WEATHER_KIND_LABELS[kind]}</span>
                </span>
                <span className="sk-mono">
                  {day.tempMax === null ? "–" : `${Math.round(day.tempMax)}°`}
                </span>
                <span className="sk-mono sk-dash__mm">
                  {day.rainMm === null ? "–" : `${day.rainMm} mm`}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <Link
        className="btn btn--sm"
        href={slug ? `/tanya?kecamatan=${slug}` : "/tanya"}
      >
        <Sparkles size={15} aria-hidden="true" />
        Tanya AI
      </Link>
    </section>
  );
}

function HourlyRain({
  outlook,
  now,
}: {
  outlook: RainOutlook | null;
  now: Date;
}) {
  const hours = outlook?.hourlyToday ?? [];
  const hasData = hours.some((h) => h.rainMm !== null);
  const total = hours.reduce((sum, h) => sum + (h.rainMm ?? 0), 0);
  const max = Math.max(1, ...hours.map((h) => h.rainMm ?? 0));
  const wettest = hours.reduce(
    (best, h) =>
      (h.rainMm ?? 0) > best.mm ? { hour: h.hour, mm: h.rainMm ?? 0 } : best,
    { hour: 0, mm: 0 },
  );
  const current = jakartaHour(now);
  // 24 bars of 10 units in a 240 × 80 box; the axis labels sit under it in HTML
  return (
    <section className="sk-card sk-dash__card" aria-labelledby="dash-hour-h">
      <div className="sk-card__head">
        <h2 id="dash-hour-h" className="sk-heading-icon">
          <CloudRain size={18} aria-hidden="true" />
          Curah hujan hari ini
        </h2>
        {hasData ? (
          <span className="sk-mono">Total {total.toFixed(1)} mm</span>
        ) : null}
      </div>
      {!hasData ? (
        <p className="sk-list__empty">
          Data curah hujan per jam belum tersedia.
        </p>
      ) : (
        <figure className="sk-dash__hours">
          <svg
            viewBox="0 0 240 88"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {hours.map((h) => {
              const height = ((h.rainMm ?? 0) / max) * 72;
              return (
                <rect
                  key={h.hour}
                  x={h.hour * 10 + 1.5}
                  y={80 - height}
                  width={7}
                  height={Math.max(height, 0.75)}
                  rx={1.5}
                  className={h.hour < current ? "is-past" : undefined}
                />
              );
            })}
            <line
              x1={current * 10 + 5}
              x2={current * 10 + 5}
              y1={0}
              y2={80}
              className="sk-dash__nowline"
            />
          </svg>
          <div className="sk-dash__axis sk-mono" aria-hidden="true">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>23</span>
          </div>
          <figcaption className="sk-mono">
            <span className="sk-dash__nowkey" aria-hidden="true" /> Sekarang{" "}
            {String(current).padStart(2, "0")}:00 WIB
          </figcaption>
          <p className="sr-only">
            Total curah hujan hari ini {total.toFixed(1)} mm.
            {wettest.mm > 0
              ? ` Paling deras pukul ${String(wettest.hour).padStart(2, "0")}:00, ${wettest.mm} mm.`
              : " Tidak ada hujan per jam yang diprakirakan."}
          </p>
        </figure>
      )}
    </section>
  );
}
