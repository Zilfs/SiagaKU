import { checkDb, pingProviders } from "@/lib/health";
import { env } from "@/lib/env";
import { isBearer, jsonError } from "@/lib/http";

export async function GET(req: Request) {
  const deep = new URL(req.url).searchParams.get("deep") === "1";
  if (deep && !isBearer(req, env.CRON_SECRET)) {
    return jsonError("UNAUTHORIZED", "Token tidak valid.", 401);
  }

  const [db, providers] = await Promise.all([
    checkDb(),
    deep ? pingProviders(env) : Promise.resolve({}),
  ]);
  const ok = db === "ok" && (!deep || Object.values(providers).includes("ok"));
  return Response.json(
    { ok, db, providers, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
