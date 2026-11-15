import { env } from "@/lib/env";
import { isBearer, jsonError } from "@/lib/http";
import {
  runEarlyWarningCron,
  type EarlyWarningDeps,
} from "@/features/early-warning/server/run";

// The run can take ~30 s with BMKG at 5 parallel requests.
export const maxDuration = 120;

/** POST /api/cron/early-warning: hourly from GitHub Actions, `Authorization: Bearer CRON_SECRET`. */
export async function handleCron(
  req: Request,
  deps: EarlyWarningDeps = {},
): Promise<Response> {
  if (!isBearer(req, env.CRON_SECRET)) {
    return jsonError("UNAUTHORIZED", "Token tidak valid.", 401);
  }
  try {
    return Response.json(await runEarlyWarningCron(deps), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("POST /api/cron/early-warning failed", error);
    return jsonError("INTERNAL", "Cron peringatan gagal.", 500);
  }
}

export function POST(req: Request): Promise<Response> {
  return handleCron(req);
}
