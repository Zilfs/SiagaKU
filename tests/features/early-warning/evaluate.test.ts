import { describe, expect, it } from "vitest";
import {
  evaluateEarlyWarning,
  notificationText,
  shouldSendPush,
} from "@/features/early-warning/evaluate";
import type { WeatherSlot } from "@/lib/data/bmkg";

const now = new Date("2026-11-18T09:00:00+07:00");

/** A BMKG slot `hours` after `now`, in BMKG's local "YYYY-MM-DD HH:mm:ss" (WIB) format. */
function slot(
  hours: number,
  description: string,
  rainfallMm: number | null,
): WeatherSlot {
  const wib = new Date(now.getTime() + (hours + 7) * 3_600_000);
  const localTime = wib.toISOString().slice(0, 19).replace("T", " ");
  return {
    localTime,
    temperature: 28,
    humidity: 80,
    description,
    icon: null,
    rainfallMm,
    windSpeedKmh: 10,
  };
}

const clear = (hours: number) => slot(hours, "Cerah Berawan", 0);

describe("evaluateEarlyWarning", () => {
  it("returns normal without rain even for a very vulnerable district", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 100,
      floodProne: true,
      slots: [0, 3, 6, 9, 12, 15, 18, 21].map(clear),
      now,
    });
    expect(result.status).toBe("normal");
    expect(result.rainfall24hMm).toBe(0);
    expect(result.window).toBeNull();
  });

  it("30 mm in 24 h with vulnerability 80 gives factor 45, score 64, watch", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 80,
      floodProne: false,
      slots: [
        slot(3, "Hujan Sedang", 10),
        slot(6, "Hujan Sedang", 20),
        clear(9),
      ],
      now,
    });
    expect(result.rainfall24hMm).toBe(30);
    expect(result.rainfallCategory).toBe("moderate");
    expect(result.score).toBe(64); // round(0.55*80 + 0.45*45)
    expect(result.status).toBe("watch");
  });

  it("raises the factor to at least 70 when a slot says Hujan Lebat, even with a small tp", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 40,
      floodProne: false,
      slots: [slot(3, "Hujan Lebat", 1)],
      now,
    });
    expect(result.score).toBe(Math.round(0.55 * 40 + 0.45 * 70));
    expect(result.rainfallCategory).toBe("heavy");
  });

  it("treats Hujan Petir like heavy rain", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 0,
      floodProne: false,
      slots: [slot(3, "Hujan Petir", 0)],
      now,
    });
    expect(result.score).toBe(32); // round(0.45 * 70)
  });

  it("adds 15 vulnerability for a flood-prone subdistrict, capped at 100", () => {
    const rain = [slot(3, "Hujan Sedang", 30)];
    const prone = evaluateEarlyWarning({
      baseVulnerability: 50,
      floodProne: true,
      slots: rain,
      now,
    });
    expect(prone.score).toBe(Math.round(0.55 * 65 + 0.45 * 45));
    const capped = evaluateEarlyWarning({
      baseVulnerability: 95,
      floodProne: true,
      slots: rain,
      now,
    });
    expect(capped.score).toBe(Math.round(0.55 * 100 + 0.45 * 45));
  });

  it("ignores slots outside the next 24 hours", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 80,
      floodProne: false,
      slots: [slot(-6, "Hujan Lebat", 60), slot(27, "Hujan Lebat", 60)],
      now,
    });
    expect(result.rainfall24hMm).toBe(0);
    expect(result.status).toBe("normal");
  });

  it("estimates a slot without tp from its description (Hujan Sedang = 15 mm)", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 0,
      floodProne: false,
      slots: [slot(3, "Hujan Sedang", null), slot(6, "Hujan Ringan", null)],
      now,
    });
    expect(result.rainfall24hMm).toBe(20);
  });

  it("sets the window from the first to the end of the last rainy slot", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 80,
      floodProne: false,
      slots: [
        clear(0),
        slot(6, "Hujan Sedang", 10),
        slot(9, "Berawan", 2),
        clear(12),
      ],
      now,
    });
    expect(result.window).toEqual({
      start: "2026-11-18T08:00:00.000Z", // 15.00 WIB
      end: "2026-11-18T14:00:00.000Z", // 18.00 + 3 h = 21.00 WIB
    });
  });

  it("25 mm with vulnerability 20 gives score 31, advisory", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 20,
      floodProne: false,
      slots: [slot(3, "Hujan Sedang", 25)],
      now,
    });
    expect(result.score).toBe(31);
    expect(result.status).toBe("advisory");
  });

  it("scores 75 or more as warning", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 100,
      floodProne: false,
      slots: [slot(3, "Hujan Lebat", 60)],
      now,
    });
    expect(result.status).toBe("warning");
  });
});

describe("shouldSendPush", () => {
  const h = (hours: number) => new Date(now.getTime() + hours * 3_600_000);

  it("follows the dedupe rule", () => {
    expect(
      shouldSendPush({
        status: "watch",
        lastSentAt: null,
        lastStatus: null,
        now,
      }),
    ).toBe(true);
    expect(
      shouldSendPush({
        status: "watch",
        lastSentAt: now,
        lastStatus: "watch",
        now: h(2),
      }),
    ).toBe(false);
    expect(
      shouldSendPush({
        status: "warning",
        lastSentAt: now,
        lastStatus: "watch",
        now: h(1),
      }),
    ).toBe(true);
    expect(
      shouldSendPush({
        status: "advisory",
        lastSentAt: null,
        lastStatus: null,
        now,
      }),
    ).toBe(false);
    expect(
      shouldSendPush({
        status: "watch",
        lastSentAt: now,
        lastStatus: "watch",
        now: h(7),
      }),
    ).toBe(true);
  });
});

describe("notificationText", () => {
  it("names the subdistrict, the rain category, the WIB window and the word potensi", () => {
    const result = evaluateEarlyWarning({
      baseVulnerability: 80,
      floodProne: false,
      slots: [slot(6, "Hujan Sedang", 30)],
      now,
    });
    const { title, body } = notificationText("Ceger", result);
    expect(title).toContain("Ceger");
    expect(`${title} ${body}`).toContain("Siaga");
    expect(body.toLowerCase()).toContain("potensi");
    expect(body).toContain("sedang");
    expect(body).toContain("15.00–18.00 WIB");
  });
});
