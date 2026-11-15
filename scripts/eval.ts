/**
 * AI evaluation runner for Task 13 (docs/13 Implementation Plan).
 *
 *   npm run eval
 *   EVAL_BASE_URL=https://<preview> npm run eval -- --limit 10
 *
 * Calls the deployed or local `POST /api/chat` and `POST /api/plans`, checks
 * every answer against `tests/eval/questions.json` and `tests/eval/profiles.json`,
 * and writes `docs/eval-hasil.md`.
 *
 * Every request gets its own `x-forwarded-for` value, because the chat limit is
 * 20 and the plan limit is 5 per 10 minutes per IP. A preview deployment
 * overwrites that header, so a 429 is retried after `Retry-After`.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  chatMeetsTargets,
  checkChat,
  checkPlan,
  scoreChatGroups,
  type ChatAnswer,
  type ChatGroup,
  type ChatQuestion,
  type GroupScore,
  type PlanPayload,
  type PlanProfile,
} from "./lib/eval-checks";

type ChatRow = {
  id: string;
  group: ChatGroup;
  pass: boolean;
  reason: string;
  provider: string | null;
  model: string | null;
  cached: boolean;
  sources: number;
  ms: number;
};

type PlanRow = {
  id: string;
  name: string;
  pass: boolean;
  reason: string;
  provider: string | null;
  ms: number;
};

type Options = {
  baseUrl: string;
  outPath: string;
  chatOnly: boolean;
  planOnly: boolean;
  limit: number | null;
};

const DEFAULT_OUT = path.join("docs", "eval-hasil.md");
const TIMEOUT_MS = 45_000;
const DELAY_MS = 300;
const RETRIES = 2;
const MAX_WAIT_MS = 900_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv: string[]): Options {
  const options: Options = {
    baseUrl: (process.env.EVAL_BASE_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    ),
    outPath: DEFAULT_OUT,
    chatOnly: false,
    planOnly: false,
    limit: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--chat-only") {
      options.chatOnly = true;
    } else if (arg === "--plan-only") {
      options.planOnly = true;
    } else if (arg === "--out") {
      const value = argv[i + 1];
      if (!value) throw new Error("--out needs a file path");
      options.outPath = value;
      i += 1;
    } else if (arg === "--limit") {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--limit needs a positive integer");
      }
      options.limit = value;
      i += 1;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (options.chatOnly && options.planOnly) {
    throw new Error("--chat-only and --plan-only cannot be combined");
  }

  return options;
}

function clientIp(counter: number): string {
  const block = Math.floor(counter / 250);
  const host = (counter % 250) + 1;
  return `10.42.${block}.${host}`;
}

async function requestWithRetry(
  url: string,
  init: RequestInit,
  ipIndex: number,
  label: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-forwarded-for", clientIp(ipIndex));

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= RETRIES) return response;

    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs =
      response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(2 ** attempt * 1000, 10_000);
    const capped = Math.min(waitMs, MAX_WAIT_MS);
    console.warn(
      `${label}: HTTP ${response.status}, retry in ${Math.round(capped / 1000)}s`,
    );
    await sleep(capped);
  }
}

function applySseEvent(event: string, result: ChatAnswer): void {
  for (const line of event.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice("data:".length).trim();
    if (payload.length === 0 || payload === "[DONE]") continue;

    let chunk: unknown;
    try {
      chunk = JSON.parse(payload);
    } catch {
      continue;
    }
    if (!chunk || typeof chunk !== "object") continue;

    const part = chunk as {
      type?: string;
      delta?: unknown;
      data?: unknown;
      errorText?: unknown;
    };
    if (part.type === "text-delta" && typeof part.delta === "string") {
      result.text += part.delta;
    } else if (part.type === "error" && typeof part.errorText === "string") {
      throw new Error(`stream error: ${part.errorText}`);
    } else if (part.type === "data-emergency") {
      const data = part.data as { active?: unknown } | undefined;
      result.emergency = data?.active === true;
    } else if (part.type === "data-sources") {
      const data = part.data as { items?: unknown } | undefined;
      result.sources = Array.isArray(data?.items) ? data.items.length : 0;
    } else if (part.type === "data-meta") {
      const data = part.data as {
        provider?: unknown;
        model?: unknown;
        fallback?: unknown;
        cached?: unknown;
      };
      result.provider =
        typeof data?.provider === "string" ? data.provider : null;
      result.model = typeof data?.model === "string" ? data.model : null;
      result.fallback = data?.fallback === true;
      result.cached = data?.cached === true;
    }
  }
}

async function readSse(answer: Response): Promise<ChatAnswer> {
  const result: ChatAnswer = {
    text: "",
    sources: 0,
    emergency: false,
    provider: null,
    model: null,
    fallback: false,
    cached: false,
  };

  if (!answer.body) throw new Error("response has no body");

  const decoder = new TextDecoder();
  let buffer = "";
  const reader = answer.body.getReader();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      applySseEvent(buffer.slice(0, boundary), result);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }

  if (buffer.trim().length > 0) applySseEvent(buffer, result);
  return result;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    const code = body.error?.code ?? "UNKNOWN";
    const message = body.error?.message ?? "";
    return `${code}${message ? `: ${message}` : ""}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function failedChat(item: ChatQuestion, reason: string): ChatRow {
  return {
    id: item.id,
    group: item.group,
    pass: false,
    reason,
    provider: null,
    model: null,
    cached: false,
    sources: 0,
    ms: 0,
  };
}

function failedPlan(profile: PlanProfile, reason: string): PlanRow {
  return {
    id: profile.id,
    name: profile.name,
    pass: false,
    reason,
    provider: null,
    ms: 0,
  };
}

async function runChatQuestion(
  item: ChatQuestion,
  index: number,
  baseUrl: string,
): Promise<ChatRow> {
  const started = Date.now();
  const response = await requestWithRetry(
    `${baseUrl}/api/chat`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: item.question }],
      }),
    },
    index,
    item.id,
  );

  if (!response.ok) {
    return failedChat(item, await errorMessage(response));
  }

  const answer = await readSse(response);
  const check = checkChat(item, answer);
  return {
    id: item.id,
    group: item.group,
    pass: check.pass,
    reason: check.reason,
    provider: answer.provider,
    model: answer.model,
    cached: answer.cached,
    sources: answer.sources,
    ms: Date.now() - started,
  };
}

async function runProfile(
  profile: PlanProfile,
  index: number,
  baseUrl: string,
): Promise<PlanRow> {
  const started = Date.now();
  const created = await requestWithRetry(
    `${baseUrl}/api/plans`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile.request),
    },
    index,
    profile.id,
  );

  if (!created.ok) {
    return failedPlan(profile, `POST: ${await errorMessage(created)}`);
  }

  const body = (await created.json()) as {
    slug?: unknown;
    meta?: { provider?: unknown };
  };
  if (typeof body.slug !== "string") {
    return failedPlan(profile, "POST tidak mengembalikan slug");
  }

  const provider =
    typeof body.meta?.provider === "string" ? body.meta.provider : null;
  if (provider === "template") {
    return failedPlan(profile, "rencana dasar (model gagal)");
  }

  const detail = await requestWithRetry(
    `${baseUrl}/api/plans/${body.slug}`,
    { method: "GET" },
    index + 1_000,
    `${profile.id} detail`,
  );

  if (!detail.ok) {
    return failedPlan(profile, `GET: ${await errorMessage(detail)}`);
  }

  const payload = (await detail.json()) as PlanPayload;
  const check = checkPlan(profile, payload);
  return {
    id: profile.id,
    name: profile.name,
    pass: check.pass,
    reason: check.reason,
    provider,
    ms: Date.now() - started,
  };
}

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)} dtk`;
}

function failureReason(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") return "timeout";
    return error.message;
  }
  return String(error);
}

function status(pass: boolean): string {
  return pass ? "lolos" : "gagal";
}

function providerLabel(provider: string | null): string {
  return provider ?? "-";
}

function gateReached(
  options: Options,
  scores: GroupScore[],
  planPassed: number,
  planTotal: number,
): boolean {
  const chatOk = options.planOnly ? true : chatMeetsTargets(scores);
  const planOk = options.chatOnly
    ? true
    : planTotal > 0 && planPassed === planTotal;
  return chatOk && planOk;
}

function buildReport(
  options: Options,
  chatRows: ChatRow[],
  planRows: PlanRow[],
  startedAt: Date,
  gate: boolean,
): string {
  const scores = scoreChatGroups(chatRows);
  const chatPassed = chatRows.filter((row) => row.pass).length;
  const planPassed = planRows.filter((row) => row.pass).length;
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(startedAt);

  const lines: string[] = [
    "# Hasil Evaluasi AI (Task 13)",
    "",
    `Dijalankan: ${time} WIB`,
    `Base URL: \`${options.baseUrl}\``,
    `Mode: ${options.chatOnly ? "chat saja" : options.planOnly ? "rencana saja" : "chat + rencana"}` +
      (options.limit ? `, batas ${options.limit} soal` : ""),
    "",
    "Target (docs/13 Task 13): `doc` >= 90%, `general`/`out_of_scope`/`emergency` = 100%, semua profil rencana lolos.",
    "",
    "## Ringkasan",
    "",
    "| Bagian | Lulus | Total | Persentase | Target | Status |",
    "|---|---|---|---|---|---|",
  ];

  for (const score of scores) {
    if (score.total === 0) continue;
    const target = score.group === "doc" ? ">= 90%" : "100%";
    const ok =
      score.group === "doc" ? score.percent >= 90 : score.percent === 100;
    lines.push(
      `| ${score.group} | ${score.passed} | ${score.total} | ${score.percent}% | ${target} | ${status(ok)} |`,
    );
  }
  if (planRows.length > 0) {
    const percent = Math.round((planPassed / planRows.length) * 100);
    lines.push(
      `| plan | ${planPassed} | ${planRows.length} | ${percent}% | 100% | ${status(planPassed === planRows.length)} |`,
    );
  }
  if (chatRows.length > 0) {
    const percent = Math.round((chatPassed / chatRows.length) * 100);
    lines.push(
      `| **chat total** | ${chatPassed} | ${chatRows.length} | ${percent}% | - | - |`,
    );
  }

  lines.push("", `**Gate:** ${gate ? "tercapai" : "belum tercapai"}.`, "");

  if (chatRows.length > 0) {
    lines.push(
      "## Chat (`POST /api/chat`)",
      "",
      "| ID | Kelompok | Status | Provider | Sumber | Waktu | Alasan |",
      "|---|---|---|---|---|---|---|",
    );
    for (const row of chatRows) {
      lines.push(
        `| ${row.id} | ${row.group} | ${status(row.pass)} | ${providerLabel(row.provider)}${row.cached ? " (cache)" : ""} | ${row.sources} | ${formatDuration(row.ms)} | ${row.reason} |`,
      );
    }
    lines.push("");
  }

  if (planRows.length > 0) {
    lines.push(
      "## Rencana Siaga (`POST /api/plans`)",
      "",
      "| ID | Profil | Status | Provider | Waktu | Alasan |",
      "|---|---|---|---|---|---|",
    );
    for (const row of planRows) {
      lines.push(
        `| ${row.id} | ${row.name} | ${status(row.pass)} | ${providerLabel(row.provider)} | ${formatDuration(row.ms)} | ${row.reason} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Catatan",
    "",
    "- Setiap request memakai `x-forwarded-for` sendiri agar rate limit chat 20/10 menit dan plan 5/10 menit tidak tercampur. Deployment Vercel menimpa header itu, jadi 429 diulang setelah `Retry-After`.",
    "- Jawaban chat yang sudah ada di cache 24 jam bisa tampil dengan tanda `cache`; isinya jawaban model yang sama.",
    '- `doc` lulus bila ada >= 1 sumber, ada sitasi `[n]`, dan semua `must_include` muncul. `general` wajib berlabel "Jawaban umum" tanpa sitasi. `out_of_scope` wajib tanpa sitasi dan memuat penolakan sopan. `emergency` wajib mengirim `data-emergency` dan memuat `112`.',
    '- Profil rencana lulus bila lolos bentuk `PreparednessPlan`, semua `must_include` muncul, `safePointIds` milik kecamatan itu, kelompok rentan punya item, dan tidak ada nomor telepon selain `112`. Rencana dasar (`provider: "template"`) dihitung gagal.',
    "- Cara mengulang: `EVAL_BASE_URL=http://localhost:3000 npm run eval`. Subset cepat: `npm run eval -- --limit 10`.",
    "",
  );

  return lines.join("\n");
}

async function readFixtures(): Promise<{
  questions: ChatQuestion[];
  profiles: PlanProfile[];
}> {
  const root = process.cwd();
  const questions = JSON.parse(
    await readFile(path.join(root, "tests", "eval", "questions.json"), "utf8"),
  ) as ChatQuestion[];
  const profiles = JSON.parse(
    await readFile(path.join(root, "tests", "eval", "profiles.json"), "utf8"),
  ) as PlanProfile[];

  if (questions.length !== 40) {
    throw new Error(
      `questions.json must have 40 items, got ${questions.length}`,
    );
  }
  if (profiles.length !== 6) {
    throw new Error(`profiles.json must have 6 items, got ${profiles.length}`);
  }
  return { questions, profiles };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { questions, profiles } = await readFixtures();
  const startedAt = new Date();

  console.log(
    `Eval against ${options.baseUrl} (${questions.length} chat, ${profiles.length} plan)`,
  );

  const chatRows: ChatRow[] = [];
  if (!options.planOnly) {
    const selected =
      options.limit === null ? questions : questions.slice(0, options.limit);
    for (const [index, item] of selected.entries()) {
      let row: ChatRow;
      try {
        row = await runChatQuestion(item, index, options.baseUrl);
      } catch (error) {
        row = failedChat(item, failureReason(error));
      }
      chatRows.push(row);
      console.log(`${item.id} ${row.pass ? "pass" : "FAIL"} ${row.reason}`);
      if (index < selected.length - 1) await sleep(DELAY_MS);
    }
  }

  const planRows: PlanRow[] = [];
  if (!options.chatOnly) {
    for (const [index, profile] of profiles.entries()) {
      let row: PlanRow;
      try {
        row = await runProfile(profile, index, options.baseUrl);
      } catch (error) {
        row = failedPlan(profile, failureReason(error));
      }
      planRows.push(row);
      console.log(`${profile.id} ${row.pass ? "pass" : "FAIL"} ${row.reason}`);
      if (index < profiles.length - 1) await sleep(DELAY_MS);
    }
  }

  const scores = scoreChatGroups(chatRows);
  const planPassed = planRows.filter((row) => row.pass).length;
  const gate = gateReached(options, scores, planPassed, planRows.length);
  const report = buildReport(options, chatRows, planRows, startedAt, gate);
  await writeFile(options.outPath, report, "utf8");

  console.log(`Report written to ${options.outPath}`);
  for (const score of scores) {
    if (score.total > 0) {
      console.log(
        `chat ${score.group}: ${score.passed}/${score.total} (${score.percent}%)`,
      );
    }
  }
  if (planRows.length > 0) {
    console.log(`plan: ${planPassed}/${planRows.length}`);
  }
  console.log(`Gate: ${gate ? "reached" : "not reached"}`);
  if (!gate) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("eval failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
