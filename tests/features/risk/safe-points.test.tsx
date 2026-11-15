import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SafePoints } from "@/features/risk/components/safe-points";
import type { SafePoint } from "@/features/risk/types";

const point = (id: number, name: string, lat: number | null): SafePoint => ({
  id,
  name,
  type: "other",
  isVerified: true,
  lat,
  lng: lat === null ? null : 106.87,
});

describe("SafePoints", () => {
  it("lists the nearest point first and points without coordinates last", () => {
    const html = renderToStaticMarkup(
      <SafePoints
        origin={{ lat: -6.22, lng: 106.87 }}
        points={[
          point(1, "Jauh", -6.26),
          point(2, "Tanpa lokasi", null),
          point(3, "Dekat", -6.221),
          point(4, "Sedang", -6.23),
        ]}
      />,
    );
    const order = ["Dekat", "Sedang", "Jauh", "Tanpa lokasi"].map((name) =>
      html.indexOf(name),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
