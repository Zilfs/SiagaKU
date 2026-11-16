"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DISTRICT_SHAPES, DISTRICT_SHAPES_VIEWBOX } from "../district-shapes";
import { MAX_FLOOD_SHADE } from "../flood-frequency";

export type FloodMapDistrict = {
  slug: string;
  name: string;
  city: string;
  count: number;
  /** 0..MAX_FLOOD_SHADE, from floodShade */
  shade: number;
};

type Tip = { district: FloodMapDistrict; x: number; y: number };

const SHADES = Array.from({ length: MAX_FLOOD_SHADE + 1 }, (_, i) => i);

/**
 * Jakarta's mainland districts shaded by how many flood events were recorded in each. Every shape
 * links to its district page; hover or keyboard focus outlines it and shows its name and count.
 */
export function FloodFrequencyMap({
  districts,
}: {
  districts: FloodMapDistrict[];
}) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const drawn = districts.filter((d) => DISTRICT_SHAPES[d.slug]);

  const show = (district: FloodMapDistrict, target: Element) => {
    const frame = box.current?.getBoundingClientRect();
    if (!frame) return;
    const shape = target.getBoundingClientRect();
    setTip({
      district,
      x: shape.left + shape.width / 2 - frame.left,
      y: shape.top + shape.height / 2 - frame.top,
    });
  };

  return (
    <div className="sk-floodmap" ref={box} onPointerLeave={() => setTip(null)}>
      <svg
        viewBox={DISTRICT_SHAPES_VIEWBOX}
        role="group"
        aria-label="Peta kecamatan Jakarta menurut jumlah kejadian banjir tercatat"
      >
        {drawn.map((district) => (
          <Link
            key={district.slug}
            href={`/wilayah/${district.slug}`}
            aria-label={`${district.name}, ${district.city}: ${district.count} kejadian banjir tercatat`}
            onPointerEnter={(event) => show(district, event.currentTarget)}
            onFocus={(event) => show(district, event.currentTarget)}
            onBlur={() => setTip(null)}
          >
            <path
              d={DISTRICT_SHAPES[district.slug]}
              data-shade={district.shade}
            />
          </Link>
        ))}
        {/* the active outline, drawn last so no neighbour covers it */}
        {tip ? (
          <path
            className="sk-floodmap__active"
            d={DISTRICT_SHAPES[tip.district.slug]}
          />
        ) : null}
      </svg>
      {tip ? (
        <p
          className="sk-floodmap__tip"
          style={{ left: tip.x, top: tip.y }}
          aria-hidden="true"
        >
          <b>{tip.district.name}</b>
          <span>{tip.district.count} kejadian banjir</span>
        </p>
      ) : null}
      <p className="sk-floodmap__legend" aria-hidden="true">
        Jarang
        {SHADES.map((shade) => (
          <i key={shade} data-shade={shade} />
        ))}
        Sering
      </p>
    </div>
  );
}
