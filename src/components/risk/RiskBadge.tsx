import {
  CircleCheck,
  CircleExclamationPoint,
  OctagonExclamationPoint,
  TriangleExclamationPoint,
} from "lucide-react";
import type { RiskLevel } from "@/lib/demo/districts";
import { riskClass, riskLabel } from "@/lib/demo/districts";

const ICON = {
  low: CircleCheck,
  moderate: CircleExclamationPoint,
  high: TriangleExclamationPoint,
  very_high: OctagonExclamationPoint,
} as const;

/**
 * Risk level always reads as colour + label + icon, never colour alone (docs/08-ui-ux, accessibility).
 * The label is Indonesian; the enum value passed in stays English.
 */
export function RiskBadge({
  level,
  score,
  size = "md",
}: {
  level: RiskLevel;
  score?: number;
  size?: "sm" | "md";
}) {
  const Icon = ICON[level];
  return (
    <span className={`sk-risk ${riskClass(level)}`}>
      <Icon size={size === "sm" ? 13 : 14} aria-hidden="true" strokeWidth={2} />
      {riskLabel(level)}
      {typeof score === "number" ? (
        <span className="sk-mono" aria-hidden="true">
          {score}
        </span>
      ) : null}
    </span>
  );
}
