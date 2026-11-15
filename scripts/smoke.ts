/**
 * Production smoke test.
 *
 *   SMOKE_BASE_URL=https://<prod> npm run smoke
 */
import { readFileSync } from "node:fs";
import { parseCsv } from "./lib/csv";
import { extractChatText } from "./lib/smoke";

const base = process.env.SMOKE_BASE_URL?.replace(/\/$/, "");
if (!base) {
  console.error("SMOKE_BASE_URL is required, e.g. https://example.vercel.app");
  process.exit(1);
}

const post = (path: string, body: unknown, ms = 30_000) =>
  fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ms),
  });

const plan = {
  district_id: 1,
  housing: { type: "single_story", floor: 1 },
  members: {
    adults: 2,
    children: 0,
    infants: 0,
    elderly: 0,
    pregnant: 0,
    disabilities: [],
    routineMedicine: 0,
    pets: [],
  },
  conditions: {
    vehicle: "none",
    riverDistance: "unknown",
    floodedBefore: false,
  },
};

/** Each check throws on failure; the message is the reason. */
const checks: [string, () => Promise<void>][] = [];

const slugs = parseCsv(readFileSync("data/districts.csv", "utf8")).map(
  (r) => r.slug,
);
for (const slug of slugs) {
  checks.push([
    `GET /wilayah/${slug}`,
    async () => {
      const res = await fetch(`${base}/wilayah/${slug}`, {
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status !== 200) throw new Error(`status ${res.status}`);
    },
  ]);
}
checks.push([
  "GET /api/health",
  async () => {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(20_000),
    });
    const json = await res.json().catch(() => null);
    if (res.status !== 200 || json?.ok !== true) {
      throw new Error(`status ${res.status}, ok=${json?.ok}`);
    }
  },
]);
checks.push([
  "POST /api/plans",
  async () => {
    const res = await post("/api/plans", plan);
    const json = await res.json().catch(() => null);
    if (res.status !== 201 || !json?.slug) {
      throw new Error(`status ${res.status}, body ${JSON.stringify(json)}`);
    }
  },
]);
checks.push([
  "POST /api/chat",
  async () => {
    const res = await post("/api/chat", {
      messages: [
        { role: "user", content: "Apa yang harus disiapkan sebelum banjir?" },
      ],
    });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    if (!extractChatText(await res.text()).trim()) {
      throw new Error("stream has no answer text");
    }
  },
]);

async function main() {
  let failed = 0;
  const run = async ([name, fn]: (typeof checks)[number]) => {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed++;
      console.log(
        `FAIL ${name} — ${error instanceof Error ? error.message : error}`,
      );
    }
  };

  // Limited concurrency: 5 workers share one queue.
  const queue = [...checks];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) await run(c);
    }),
  );

  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

void main();
