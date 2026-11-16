"use client";

import { useState } from "react";
import { Waves } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlyFloodCount } from "../flood-trend";
import { monthLabel, niceTicks, stepAreaPath } from "../trend-chart";

const W = 600;
const H = 180;

export function FloodTrendChart({ trend }: { trend: MonthlyFloodCount[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...trend.map((m) => m.count));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const slot = W / Math.max(trend.length, 1);
  const last = trend.length - 1;
  const { line, area } =
    max > 0
      ? stepAreaPath(
          trend.map((m) => m.count),
          W,
          H,
          top,
        )
      : { line: "", area: "" };
  const cur = active === null ? null : trend[active];
  return (
    <section className="sk-card sk-dash__card" aria-labelledby="dash-trend-h">
      <div className="sk-card__head">
        <h2 id="dash-trend-h" className="sk-heading-icon">
          <Waves size={18} aria-hidden="true" />
          Riwayat genangan per bulan
        </h2>
        <span className="sk-mono">12 bulan terakhir</span>
      </div>
      {max === 0 ? (
        <p className="sk-list__empty">
          Belum ada kejadian genangan tercatat dalam 12 bulan terakhir.
        </p>
      ) : (
        <figure className="sk-dash__trend">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label="Grafik kejadian genangan per bulan"
          >
            {ticks.map((t) => {
              const y = H - (t / top) * H;
              return (
                <g key={t}>
                  <line
                    x1="0"
                    x2={W}
                    y1={y}
                    y2={y}
                    className="sk-dash__grid-line"
                  />
                  <text x="4" y={Math.max(y - 4, 10)} className="sk-dash__tick">
                    {t}
                  </text>
                </g>
              );
            })}
            <path d={area} className="sk-dash__area" />
            <path d={line} className="sk-dash__line" />
            {trend.map((m, i) => (
              <rect
                key={m.month}
                x={i * slot}
                y="0"
                width={slot}
                height={H}
                tabIndex={0}
                role="img"
                aria-label={`${monthLabel(m.month, true)}: ${m.count} kejadian`}
                className={`sk-dash__hit${i === last ? " is-latest" : ""}${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>
          {cur && active !== null && (
            <span
              className="sk-dash__tip sk-mono"
              style={{ left: `${((active + 0.5) / trend.length) * 100}%` }}
            >
              {monthLabel(cur.month, true)} · {cur.count} kejadian
            </span>
          )}
          <div className="sk-dash__months" aria-hidden="true">
            {trend.map((m, i) => (
              <span
                key={m.month}
                className={i === last ? "is-latest" : undefined}
              >
                {monthLabel(m.month)}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>Kejadian genangan per bulan di Jakarta</caption>
            <thead>
              <tr>
                <th scope="col">Bulan</th>
                <th scope="col">Kejadian</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((m) => (
                <tr key={m.month}>
                  <th scope="row">{monthLabel(m.month, true)}</th>
                  <td>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </section>
  );
}

export function FloodTrendSkeleton() {
  return (
    <div className="sk-card sk-dash__card">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}
