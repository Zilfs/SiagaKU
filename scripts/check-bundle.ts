/**
 * Fails if a server secret name or value appears in the client bundle.
 *
 *   npm run build && npm run check:bundle
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SECRET_ENV_NAMES, findSecretHits } from "./lib/bundle-secrets";

const DIR = ".next/static";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the ambient environment.
}

if (!existsSync(DIR)) {
  console.error(`${DIR} not found. Run "npm run build" first.`);
  process.exit(1);
}

let files = 0;
let failures = 0;
for (const entry of readdirSync(DIR, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile()) continue;
  const path = join(entry.parentPath, entry.name);
  files++;
  for (const hit of findSecretHits(
    readFileSync(path, "latin1"),
    SECRET_ENV_NAMES,
    process.env,
  )) {
    failures++;
    console.log(`FAIL ${hit} found in ${path}`);
  }
}
console.log(`Scanned ${files} files, ${failures} hit(s).`);
process.exit(failures > 0 ? 1 : 0);
