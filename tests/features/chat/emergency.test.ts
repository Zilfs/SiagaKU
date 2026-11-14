import { describe, expect, it } from "vitest";
import { detectEmergency } from "@/features/chat/detect-emergency";

describe("detectEmergency", () => {
  it.each([
    "Tolong air sudah masuk rumah",
    "Anak saya terjebak di lantai 2",
    "Ada yang hanyut di sungai",
    "Kesetrum pas banjir",
    "Kami naik ke atap",
    "Air sudah masuk ke kamar",
    "Saya tidak bisa keluar, pintu terkunci",
    "Ada orang tenggelam di gang",
    "Tersengat listrik saat pegang tiang",
    "Ini darurat, tolong bantu",
    "Naik ke genteng sekarang",
    "Tetangga hanyut terbawa arus",
    "Tolong, anak saya terjebak",
    "Air masuk rumah, kami butuh bantuan",
    "Kami terjebak di lantai dua",
    "Anak saya terjebak, tolong jelaskan apa yang harus dilakukan",
    "Apa yang harus dilakukan jika anak saya terjebak",
  ])("flags %s", (text) => {
    expect(detectEmergency(text)).toBe(true);
  });

  it.each([
    "Apa isi tas siaga",
    "Bagaimana cara mencegah banjir",
    "Tolong jelaskan banjir rob",
    "Tolong sebutkan isi tas siaga",
    "Apa yang harus dilakukan saat banjir",
    "Di mana posko terdekat",
    "Kapan musim hujan",
    "Bagaimana cara mematikan listrik saat banjir",
    "Apa nomor darurat Jakarta",
    "Tolong beri tahu cara membuat rencana siaga",
    "Apakah banjir rob berbahaya?",
    "Saya ingin tahu risiko banjir di Jatinegara",
    "Bagaimana evakuasi saat gempa",
    "Tolong carikan posko terdekat",
    "Jelaskan cara membuat tas siaga",
    "Apa itu tas siaga bencana",
  ])("does not flag %s", (text) => {
    expect(detectEmergency(text)).toBe(false);
  });

  it("ignores casing and surrounding spaces", () => {
    expect(detectEmergency("  ANAK SAYA TERJEBAK  ")).toBe(true);
  });
});
