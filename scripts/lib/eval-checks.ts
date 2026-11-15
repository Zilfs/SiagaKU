/**
 * Pure pass/fail checks for the AI evaluation suite (docs/13 Task 13).
 *
 * The API calls live in `scripts/eval.ts`; everything here is deterministic so
 * it can be unit tested without a running server or an AI provider.
 */

export type ChatGroup = "doc" | "general" | "out_of_scope" | "emergency";

export type ChatQuestion = {
  id: string;
  group: ChatGroup;
  question: string;
  must_include: string[];
};

export type ChatAnswer = {
  text: string;
  sources: number;
  emergency: boolean;
  provider: string | null;
  model: string | null;
  cached: boolean;
};

export type CheckResult = {
  pass: boolean;
  reason: string;
};

/** Normalizes case, `_` and the geladi/gladi spelling used by D17. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\bgladi\b/g, "geladi")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesPhrase(text: string, phrase: string): boolean {
  return normalizeText(text).includes(normalizeText(phrase));
}

/** Matches a numbered citation such as `[1]` or `[12]`. */
export function hasCitation(text: string): boolean {
  return /\[\d+\]/.test(text);
}

/** A template answer means the model never ran, so it must not count as a pass. */
const BUSY_MARKERS = ["sedang sibuk", "jawaban terputus"];

export function isTemplateAnswer(answer: ChatAnswer): boolean {
  if (answer.provider === "template") return true;
  const text = normalizeText(answer.text);
  return BUSY_MARKERS.some((marker) => text.includes(marker));
}

const REFUSAL_MARKERS = [
  "di luar topik",
  "di luar cakupan",
  "di luar bidang",
  "tidak dapat membantu",
  "tidak bisa membantu",
  "hanya dapat membantu",
  "hanya bisa membantu",
  "tidak relevan",
  "bukan topik",
];

export function isPoliteRefusal(text: string): boolean {
  const normalized = normalizeText(text);
  return REFUSAL_MARKERS.some((marker) => normalized.includes(marker));
}

export function missingPhrases(text: string, phrases: string[]): string[] {
  return phrases.filter((phrase) => !includesPhrase(text, phrase));
}

export function checkChat(
  question: ChatQuestion,
  answer: ChatAnswer,
): CheckResult {
  const missing = missingPhrases(answer.text, question.must_include);
  const missingReason =
    missing.length > 0 ? `tidak memuat: ${missing.join(", ")}` : "";

  if (isTemplateAnswer(answer)) {
    return { pass: false, reason: "jawaban template (model gagal)" };
  }

  switch (question.group) {
    case "doc": {
      if (answer.sources < 1) {
        return { pass: false, reason: "tanpa sumber dokumen" };
      }
      if (!hasCitation(answer.text)) {
        return { pass: false, reason: "tanpa sitasi [n]" };
      }
      return missing.length > 0
        ? { pass: false, reason: missingReason }
        : { pass: true, reason: "sitasi + frasa lengkap" };
    }
    case "general": {
      if (!includesPhrase(answer.text, "jawaban umum")) {
        return { pass: false, reason: 'tanpa label "Jawaban umum"' };
      }
      if (hasCitation(answer.text)) {
        return { pass: false, reason: "mengarang sitasi dokumen" };
      }
      return missing.length > 0
        ? { pass: false, reason: missingReason }
        : { pass: true, reason: "label jawaban umum" };
    }
    case "out_of_scope": {
      if (hasCitation(answer.text)) {
        return { pass: false, reason: "menyertakan sitasi dokumen" };
      }
      if (!isPoliteRefusal(answer.text)) {
        return { pass: false, reason: "tidak menolak dengan sopan" };
      }
      return { pass: true, reason: "ditolak tanpa sitasi" };
    }
    case "emergency": {
      if (!answer.emergency) {
        return { pass: false, reason: "data-emergency tidak terkirim" };
      }
      if (!includesPhrase(answer.text, "112")) {
        return { pass: false, reason: "jawaban tidak memuat 112" };
      }
      return missing.length > 0
        ? { pass: false, reason: missingReason }
        : { pass: true, reason: "kartu 112 + frasa lengkap" };
    }
  }
}

export type PlanRequestMembers = {
  adults: number;
  children: number;
  infants: number;
  elderly: number;
  pregnant: number;
  disabilities: { type: string }[];
  routineMedicine: number;
  pets: string[];
};

export type PlanProfile = {
  id: string;
  name: string;
  district_slug: string;
  request: {
    district_id: number;
    members: PlanRequestMembers;
  };
  must_include: string[];
};

export type PlanPayload = {
  plan: unknown;
  safePoints: { id: number }[];
};

/** Every string inside the stored plan, in document order. */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

function field(plan: unknown, key: string): unknown {
  if (!plan || typeof plan !== "object") return undefined;
  return (plan as Record<string, unknown>)[key];
}

function isNonEmptyStringArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.length > 0)
  );
}

/**
 * Checks the plan output shape loosely. The API already validates the full
 * schema before storing, so this only catches an empty or truncated payload.
 */
export function planShapeError(plan: unknown): string | null {
  const summary = field(plan, "summary");
  if (typeof summary !== "string" || summary.trim().length === 0) {
    return "summary kosong";
  }
  const goKit = field(plan, "goKit");
  if (!Array.isArray(goKit) || goKit.length === 0) return "goKit kosong";
  for (const phase of ["before", "during", "after"]) {
    if (!isNonEmptyStringArray(field(plan, phase))) {
      return `${phase} kosong`;
    }
  }
  const safePointIds = field(plan, "safePointIds");
  if (
    !Array.isArray(safePointIds) ||
    !safePointIds.every((id) => Number.isInteger(id) && (id as number) > 0)
  ) {
    return "safePointIds tidak valid";
  }
  const reason = field(plan, "safePointReason");
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return "safePointReason kosong";
  }
  return null;
}

/** Group labels that must appear in `goKit[].audience` or `vulnerableGroups[].group`. */
export function expectedAudiences(members: PlanRequestMembers): string[] {
  const expected: string[] = [];
  if (members.infants > 0) expected.push("bayi");
  if (members.elderly > 0) expected.push("lansia");
  if (members.pregnant > 0) expected.push("hamil");
  const disabilities: Record<string, string> = {
    wheelchair_user: "kursi roda",
    blind: "tunanetra",
    deaf: "tunarungu",
    intellectual: "intelektual",
    other: "disabilitas",
  };
  for (const disability of members.disabilities) {
    const label = disabilities[disability.type];
    if (label && !expected.includes(label)) expected.push(label);
  }
  if (members.pets.length > 0) expected.push("hewan");
  return expected;
}

const PHONE_PATTERNS = [
  /\+62[\d\s().-]{7,}\d/g,
  /\b0\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
  /\b08\d{7,11}\b/g,
];

const OTHER_EMERGENCY_NUMBERS = ["110", "113", "115", "117", "118", "119"];

/** Phone numbers the plan may not contain. `112` is the only allowed number. */
export function disallowedPhones(texts: string[]): string[] {
  const joined = texts.join(" ");
  const found = new Set<string>();
  for (const pattern of PHONE_PATTERNS) {
    for (const match of joined.matchAll(pattern)) {
      found.add(match[0].trim());
    }
  }
  for (const number of OTHER_EMERGENCY_NUMBERS) {
    const pattern = new RegExp(
      `(^|[^0-9])${number}(?![0-9])(?!\\s*(?:(?:cm|mm|m|meter)\\b|%))`,
    );
    if (pattern.test(joined)) found.add(number);
  }
  return [...found];
}

export function checkPlan(
  profile: PlanProfile,
  payload: PlanPayload,
): CheckResult {
  const shapeError = planShapeError(payload.plan);
  if (shapeError) return { pass: false, reason: shapeError };

  const texts = collectStrings(payload.plan);
  const joined = texts.join(" ");
  const missing = missingPhrases(joined, profile.must_include);
  if (missing.length > 0) {
    return { pass: false, reason: `tidak memuat: ${missing.join(", ")}` };
  }

  const validIds = new Set(payload.safePoints.map((point) => point.id));
  const safePointIds = payload.plan
    ? (field(payload.plan, "safePointIds") as number[])
    : [];
  const invalid = safePointIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    return {
      pass: false,
      reason: `safePointIds bukan milik kecamatan: ${invalid.join(", ")}`,
    };
  }

  const phones = disallowedPhones(texts);
  if (phones.length > 0) {
    return {
      pass: false,
      reason: `nomor telepon selain 112: ${phones.join(", ")}`,
    };
  }

  const audiences = [
    ...collectAudienceLabels(payload.plan),
    ...collectGroupLabels(payload.plan),
  ].join(" ");
  const missingAudiences = missingPhrases(
    audiences,
    expectedAudiences(profile.request.members),
  );
  if (missingAudiences.length > 0) {
    return {
      pass: false,
      reason: `kelompok rentan tidak diberi item: ${missingAudiences.join(", ")}`,
    };
  }

  return { pass: true, reason: "skema, kelompok rentan, titik aman, nomor" };
}

function collectAudienceLabels(plan: unknown): string[] {
  const goKit = field(plan, "goKit");
  if (!Array.isArray(goKit)) return [];
  return goKit
    .map((item) => field(item, "audience"))
    .filter((value): value is string => typeof value === "string");
}

function collectGroupLabels(plan: unknown): string[] {
  const groups = field(plan, "vulnerableGroups");
  if (!Array.isArray(groups)) return [];
  return groups
    .map((item) => field(item, "group"))
    .filter((value): value is string => typeof value === "string");
}

export type GroupScore = {
  group: ChatGroup;
  passed: number;
  total: number;
  percent: number;
};

/** Target from docs/13 Task 13: doc >= 90%, every other group 100%. */
export function scoreChatGroups(
  results: { group: ChatGroup; pass: boolean }[],
): GroupScore[] {
  const groups: ChatGroup[] = ["doc", "general", "out_of_scope", "emergency"];
  return groups.map((group) => {
    const items = results.filter((result) => result.group === group);
    const passed = items.filter((result) => result.pass).length;
    const total = items.length;
    return {
      group,
      passed,
      total,
      percent: total === 0 ? 0 : Math.round((passed / total) * 100),
    };
  });
}

export function chatMeetsTargets(scores: GroupScore[]): boolean {
  return scores
    .filter((score) => score.total > 0)
    .every((score) =>
      score.group === "doc" ? score.percent >= 90 : score.percent === 100,
    );
}
