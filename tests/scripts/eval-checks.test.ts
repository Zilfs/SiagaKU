import { describe, expect, it } from "vitest";
import {
  chatMeetsTargets,
  checkChat,
  checkPlan,
  disallowedPhones,
  expectedAudiences,
  hasCitation,
  includesPhrase,
  normalizeText,
  planShapeError,
  scoreChatGroups,
  type ChatAnswer,
  type ChatQuestion,
  type PlanProfile,
} from "../../scripts/lib/eval-checks";

const answer = (overrides: Partial<ChatAnswer> = {}): ChatAnswer => ({
  text: "",
  sources: 0,
  emergency: false,
  provider: "gemini",
  model: "gemini-3.5-flash-lite",
  cached: false,
  ...overrides,
});

const question = (
  group: ChatQuestion["group"],
  must_include: string[] = [],
): ChatQuestion => ({
  id: "T01",
  group,
  question: "contoh",
  must_include,
});

describe("normalizeText", () => {
  it("lowercases, collapses whitespace and turns underscores into spaces", () => {
    expect(normalizeText("  Pengguna_KURSI   Roda ")).toBe(
      "pengguna kursi roda",
    );
  });

  it("treats geladi and gladi as the same word", () => {
    expect(includesPhrase("latihan gladi lapang", "geladi")).toBe(true);
    expect(includesPhrase("geladi lapang", "gladi")).toBe(true);
  });
});

describe("hasCitation", () => {
  it("matches numbered citations only", () => {
    expect(hasCitation("Air 2 liter [1].")).toBe(true);
    expect(hasCitation("Air 2 liter.")).toBe(false);
    expect(hasCitation("[catatan]")).toBe(false);
  });
});

describe("checkChat", () => {
  it("passes a doc answer with a source, citation and phrases", () => {
    const result = checkChat(
      question("doc", ["air", "dokumen"]),
      answer({ text: "Bawa air dan dokumen penting [1].", sources: 2 }),
    );
    expect(result.pass).toBe(true);
  });

  it("fails a doc answer without a source", () => {
    const result = checkChat(
      question("doc", ["air"]),
      answer({ text: "Bawa air [1].", sources: 0 }),
    );
    expect(result).toMatchObject({
      pass: false,
      reason: "tanpa sumber dokumen",
    });
  });

  it("fails a doc answer without a citation", () => {
    const result = checkChat(
      question("doc", ["air"]),
      answer({ text: "Bawa air.", sources: 1 }),
    );
    expect(result.reason).toBe("tanpa sitasi [n]");
  });

  it("reports missing phrases", () => {
    const result = checkChat(
      question("doc", ["air", "dokumen"]),
      answer({ text: "Bawa air [1].", sources: 1 }),
    );
    expect(result.reason).toBe("tidak memuat: dokumen");
  });

  it("never passes the template answer", () => {
    const result = checkChat(
      question("doc", ["air"]),
      answer({
        text: "Maaf, SiagaKU sedang sibuk. [1]",
        sources: 1,
        provider: "template",
      }),
    );
    expect(result.pass).toBe(false);
  });

  it("passes a general answer with the label and no citation", () => {
    const result = checkChat(
      question("general", ["jawaban umum"]),
      answer({
        text: "Jawaban umum (tidak dari dokumen resmi): premi berbeda.",
      }),
    );
    expect(result.pass).toBe(true);
  });

  it("fails a general answer that invents a citation", () => {
    const result = checkChat(
      question("general", ["jawaban umum"]),
      answer({ text: "Jawaban umum: premi berbeda [1]." }),
    );
    expect(result.reason).toBe("mengarang sitasi dokumen");
  });

  it("passes a polite refusal even when retrieval attached sources", () => {
    const result = checkChat(
      question("out_of_scope"),
      answer({
        text: "Maaf, pertanyaan itu di luar topik banjir.",
        sources: 5,
      }),
    );
    expect(result.pass).toBe(true);
  });

  it("fails a refusal that still cites a document", () => {
    const result = checkChat(
      question("out_of_scope"),
      answer({ text: "Maaf, di luar topik [1].", sources: 1 }),
    );
    expect(result.reason).toBe("menyertakan sitasi dokumen");
  });

  it("fails an in-scope answer that never refuses", () => {
    const result = checkChat(
      question("out_of_scope"),
      answer({ text: "Berikut resep bolu pisang." }),
    );
    expect(result.reason).toBe("tidak menolak dengan sopan");
  });

  it('does not treat a bare "Maaf" as a refusal', () => {
    const result = checkChat(
      question("out_of_scope"),
      answer({ text: "Maaf, berikut resep bolu pisang." }),
    );
    expect(result.pass).toBe(false);
  });

  it("passes an emergency answer with the card and 112", () => {
    const result = checkChat(
      question("emergency", ["112"]),
      answer({
        text: "Jika kamu dalam bahaya, hubungi 112.",
        emergency: true,
      }),
    );
    expect(result.pass).toBe(true);
  });

  it("fails an emergency answer without the data part", () => {
    const result = checkChat(
      question("emergency", ["112"]),
      answer({ text: "Hubungi 112." }),
    );
    expect(result.reason).toBe("data-emergency tidak terkirim");
  });
});

const profile: PlanProfile = {
  id: "P01",
  name: "Keluarga bayi",
  district_slug: "jatinegara",
  request: {
    district_id: 37,
    members: {
      adults: 2,
      children: 0,
      infants: 1,
      elderly: 1,
      pregnant: 0,
      disabilities: [{ type: "wheelchair_user" }],
      routineMedicine: 1,
      pets: ["kucing"],
    },
  },
  must_include: ["bayi", "lansia", "kursi roda"],
};

function plan() {
  return {
    summary: "Rencana untuk keluarga di Jatinegara.",
    recommendedReadinessLevel: "watch",
    goKit: [
      { item: "Susu formula", audience: "bayi", priority: "required" },
      { item: "Obat rutin", audience: "lansia", priority: "required" },
      {
        item: "Kursi roda cadangan",
        audience: "pengguna kursi roda",
        priority: "required",
      },
      { item: "Pakan hewan", audience: "hewan", priority: "important" },
    ],
    before: ["Siapkan tas siaga."],
    during: ["Hubungi 112 jika dalam bahaya."],
    after: ["Bersihkan rumah."],
    vulnerableGroups: [{ group: "bayi", notes: ["Bawa susu."] }],
    safePointIds: [31, 32],
    safePointReason: "Titik aman terdekat.",
  };
}

const payload = (value: unknown = plan()) => ({
  plan: value,
  safePoints: [{ id: 31 }, { id: 32 }],
});

describe("checkPlan", () => {
  it("passes a grounded plan", () => {
    expect(checkPlan(profile, payload()).pass).toBe(true);
  });

  it("fails when a must_include phrase is missing", () => {
    const value = {
      ...plan(),
      summary: "Rencana keluarga.",
      goKit: [
        { item: "Susu formula", audience: "bayi", priority: "required" },
        { item: "Obat rutin", audience: "lansia", priority: "required" },
      ],
    };
    expect(checkPlan(profile, payload(value)).reason).toContain("kursi roda");
  });

  it("fails safe point ids outside the district", () => {
    const value = { ...plan(), safePointIds: [31, 99] };
    expect(checkPlan(profile, payload(value)).reason).toBe(
      "safePointIds bukan milik kecamatan: 99",
    );
  });

  it("fails a phone number other than 112", () => {
    const value = { ...plan(), summary: "Hubungi 0812 3456 7890." };
    expect(checkPlan(profile, payload(value)).reason).toContain("0812");
  });

  it("fails a vulnerable group without an item", () => {
    const value = {
      ...plan(),
      goKit: [{ item: "Air", audience: "semua", priority: "required" }],
      vulnerableGroups: [],
    };
    expect(checkPlan(profile, payload(value)).reason).toContain("bayi");
  });

  it("fails an empty plan", () => {
    expect(checkPlan(profile, payload({})).reason).toBe("summary kosong");
  });
});

describe("planShapeError", () => {
  it("rejects a missing phase", () => {
    expect(planShapeError({ ...plan(), during: [] })).toBe("during kosong");
  });

  it("accepts the golden path", () => {
    expect(planShapeError(plan())).toBeNull();
  });
});

describe("expectedAudiences", () => {
  it("maps household members to group labels", () => {
    expect(expectedAudiences(profile.request.members)).toEqual([
      "bayi",
      "lansia",
      "kursi roda",
      "hewan",
    ]);
  });

  it("returns nothing for a single adult", () => {
    expect(
      expectedAudiences({
        adults: 1,
        children: 0,
        infants: 0,
        elderly: 0,
        pregnant: 0,
        disabilities: [],
        routineMedicine: 0,
        pets: [],
      }),
    ).toEqual([]);
  });
});

describe("disallowedPhones", () => {
  it("allows 112 and dates", () => {
    expect(disallowedPhones(["Hubungi 112.", "Banjir 3 Mar 2025"])).toEqual([]);
  });

  it("flags mobile, landline and other emergency numbers", () => {
    const found = disallowedPhones([
      "Telepon 0812-3456-7890 atau 021-555-1234.",
      "Nomor lain 119.",
    ]);
    expect(found).toContain("0812-3456-7890");
    expect(found).toContain("021-555-1234");
    expect(found).toContain("119");
  });

  it("does not treat a flood depth as an emergency number", () => {
    expect(
      disallowedPhones(["Banjir hingga 110 cm di Kampung Melayu."]),
    ).toEqual([]);
    expect(disallowedPhones(["Genangan 115 m dan 119%."])).toEqual([]);
  });

  it("flags an emergency number followed by a word starting with m", () => {
    expect(disallowedPhones(["Hubungi 110 malam ini."])).toEqual(["110"]);
    expect(disallowedPhones(["Telepon 113 minta bantuan."])).toEqual(["113"]);
  });
});

describe("scoreChatGroups", () => {
  it("groups the results and rounds percentages", () => {
    const scores = scoreChatGroups([
      { group: "doc", pass: true },
      { group: "doc", pass: false },
      { group: "doc", pass: false },
      { group: "general", pass: true },
    ]);
    const doc = scores.find((score) => score.group === "doc");
    expect(doc).toEqual({ group: "doc", passed: 1, total: 3, percent: 33 });
  });

  it("requires 90% for doc and 100% for the other groups", () => {
    const scores = scoreChatGroups([
      ...Array.from({ length: 9 }, () => ({
        group: "doc" as const,
        pass: true,
      })),
      { group: "doc", pass: false },
      ...Array.from({ length: 5 }, () => ({
        group: "general" as const,
        pass: true,
      })),
      ...Array.from({ length: 5 }, () => ({
        group: "out_of_scope" as const,
        pass: true,
      })),
      ...Array.from({ length: 5 }, () => ({
        group: "emergency" as const,
        pass: true,
      })),
    ]);
    expect(chatMeetsTargets(scores)).toBe(true);
  });

  it("skips groups a --limit subset never reached", () => {
    const scores = scoreChatGroups(
      Array.from({ length: 10 }, () => ({ group: "doc" as const, pass: true })),
    );
    expect(scores.filter((score) => score.total === 0)).toHaveLength(3);
    expect(chatMeetsTargets(scores)).toBe(true);
  });

  it("still fails doc below 90%", () => {
    const scores = scoreChatGroups(
      Array.from({ length: 10 }, (_, index) => ({
        group: "doc" as const,
        pass: index >= 2,
      })),
    );
    expect(chatMeetsTargets(scores)).toBe(false);
  });
});
