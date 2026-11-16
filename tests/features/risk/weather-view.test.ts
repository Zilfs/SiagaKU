import { describe, expect, it } from "vitest";
import type { WeatherSlot } from "@/lib/data/bmkg";
import type { RainOutlook } from "@/lib/data/open-meteo";
import {
  groupSlotsByDay,
  jakartaHour,
  kindFromCode,
  kindFromDescription,
  pickCurrentSlot,
  freshOutlook,
  pickNextRainSlot,
  rainHeadline,
} from "@/features/risk/weather-view";

const slot = (
  localTime: string,
  description = "Berawan",
  rainfallMm: number | null = 0,
): WeatherSlot => ({
  localTime,
  description,
  rainfallMm,
  temperature: 28,
  humidity: 80,
  icon: null,
  windSpeedKmh: 10,
});

// 16 Nov 2026 13:40 WIB
const now = new Date("2026-11-16T06:40:00Z");

describe("kindFromCode", () => {
  it("maps WMO weather codes", () => {
    expect(kindFromCode(0)).toBe("sun");
    expect(kindFromCode(2)).toBe("cloud-sun");
    expect(kindFromCode(3)).toBe("cloud");
    expect(kindFromCode(45)).toBe("fog");
    expect(kindFromCode(53)).toBe("drizzle");
    expect(kindFromCode(63)).toBe("rain");
    expect(kindFromCode(81)).toBe("rain");
    expect(kindFromCode(95)).toBe("storm");
  });
  it("falls back to cloud for null or unknown codes", () => {
    expect(kindFromCode(null)).toBe("cloud");
    expect(kindFromCode(71)).toBe("cloud");
  });
});

describe("kindFromDescription", () => {
  it("maps BMKG descriptions", () => {
    expect(kindFromDescription("Cerah")).toBe("sun");
    expect(kindFromDescription("Cerah Berawan")).toBe("cloud-sun");
    expect(kindFromDescription("Berawan Tebal")).toBe("cloud");
    expect(kindFromDescription("Hujan Ringan")).toBe("drizzle");
    expect(kindFromDescription("Hujan Lebat")).toBe("rain");
    expect(kindFromDescription("Hujan Petir")).toBe("storm");
    expect(kindFromDescription("Udara Kabur")).toBe("fog");
    expect(kindFromDescription("Kabut")).toBe("fog");
  });
  it("falls back to cloud for an empty description", () => {
    expect(kindFromDescription("")).toBe("cloud");
  });
});

describe("pickCurrentSlot", () => {
  it("returns the slot nearest to now in Asia/Jakarta time", () => {
    const slots = [
      slot("2026-11-16 09:00:00"),
      slot("2026-11-16 12:00:00"),
      slot("2026-11-16 15:00:00"),
    ];
    // 13:40 is 100 min after 12:00 and 80 min before 15:00
    expect(pickCurrentSlot(slots, now)?.localTime).toBe("2026-11-16 15:00:00");
  });
  it("skips unparseable times and returns null for no slots", () => {
    expect(pickCurrentSlot([], now)).toBeNull();
    expect(pickCurrentSlot([slot("x")], now)).toBeNull();
  });
});

describe("pickNextRainSlot", () => {
  it("returns the first rainy slot within 24 hours", () => {
    const slots = [
      slot("2026-11-16 06:00:00", "Hujan Lebat", 12), // past
      slot("2026-11-16 15:00:00", "Berawan", 0),
      slot("2026-11-16 18:00:00", "Hujan Sedang", null), // rain by description
      slot("2026-11-16 21:00:00", "Berawan", 3),
    ];
    expect(pickNextRainSlot(slots, now)?.localTime).toBe("2026-11-16 18:00:00");
  });
  it("counts rainfall of 1 mm or more even with a dry description", () => {
    const slots = [slot("2026-11-17 03:00:00", "Berawan", 1)];
    expect(pickNextRainSlot(slots, now)?.localTime).toBe("2026-11-17 03:00:00");
  });
  it("ignores drizzle under 1 mm with a dry description", () => {
    expect(
      pickNextRainSlot([slot("2026-11-17 03:00:00", "Berawan", 0.4)], now),
    ).toBeNull();
  });
  it("ignores rain more than 24 hours ahead", () => {
    const slots = [slot("2026-11-17 18:00:00", "Hujan Lebat", 20)];
    expect(pickNextRainSlot(slots, now)).toBeNull();
  });
});

describe("rainHeadline", () => {
  it("names the time and district, today", () => {
    expect(
      rainHeadline(
        slot("2026-11-16 15:00:00", "Hujan Lebat", 12),
        now,
        "Jatinegara",
      ),
    ).toBe("Hujan lebat diprakirakan 15:00 di Jatinegara.");
  });
  it("says besok for tomorrow and uses a generic word without a rain description", () => {
    expect(
      rainHeadline(slot("2026-11-17 03:00:00", "Berawan", 1), now, "Gambir"),
    ).toBe("Hujan diprakirakan besok 03:00 di Gambir.");
  });
});

describe("jakartaHour", () => {
  it("returns the hour in Asia/Jakarta", () => {
    expect(jakartaHour(now)).toBe(13);
    expect(jakartaHour(new Date("2026-11-16T20:00:00Z"))).toBe(3);
  });
});

describe("freshOutlook", () => {
  const day = (date: string) => ({
    date,
    weatherCode: 0,
    tempMax: 30,
    rainMm: 0,
  });
  const outlook = (dates: string[]) =>
    ({
      daily: dates.map(day),
      hourlyToday: [{ hour: 1, rainMm: 2 }],
    }) as unknown as RainOutlook;
  it("keeps a current outlook", () => {
    const r = freshOutlook(outlook(["2026-11-16", "2026-11-17"]), now);
    expect(r?.daily).toHaveLength(2);
    expect(r?.hourlyToday).toHaveLength(1);
  });
  it("drops yesterday and the hourly bars when day 0 is not today", () => {
    const r = freshOutlook(outlook(["2026-11-15", "2026-11-16"]), now);
    expect(r?.daily.map((d) => d.date)).toEqual(["2026-11-16"]);
    expect(r?.hourlyToday).toEqual([]);
  });
  it("passes null through", () => {
    expect(freshOutlook(null, now)).toBeNull();
  });
});

describe("groupSlotsByDay", () => {
  const slot = (
    localTime: string,
    temperature: number | null,
    rainfallMm: number | null,
    description: string,
  ) => ({
    localTime,
    temperature,
    humidity: null,
    description,
    icon: null,
    rainfallMm,
    windSpeedKmh: null,
  });

  it("gives one entry per local date with the range, the total and the wettest description", () => {
    expect(
      groupSlotsByDay([
        slot("2026-11-16 16:00:00", 30, 0.5, "Cerah"),
        slot("2026-11-16 19:00:00", 27, 2.2, "Hujan Ringan"),
        slot("2026-11-17 01:00:00", 25, null, "Berawan"),
      ]),
    ).toEqual([
      {
        date: "2026-11-16",
        minTemp: 27,
        maxTemp: 30,
        rainfallMm: 2.7,
        description: "Hujan Ringan",
      },
      {
        date: "2026-11-17",
        minTemp: 25,
        maxTemp: 25,
        rainfallMm: 0,
        description: "Berawan",
      },
    ]);
  });

  it("keeps a day without temperatures and returns nothing for no slots", () => {
    expect(
      groupSlotsByDay([slot("2026-11-16 16:00:00", null, 1, "Hujan")])[0],
    ).toMatchObject({ minTemp: null, maxTemp: null });
    expect(groupSlotsByDay([])).toEqual([]);
  });
});
