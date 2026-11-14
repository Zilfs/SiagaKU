import {
  CircleCheck,
  CircleExclamationPoint,
  OctagonExclamationPoint,
  TriangleExclamationPoint,
} from "lucide-react";
import type { RiskLevel } from "@/lib/risk/level";
import { RISK_LEVEL_LABELS } from "@/lib/risk/level";

const CLASS: Record<RiskLevel, string> = {
  low: "sk-risk--low",
  moderate: "sk-risk--moderate",
  high: "sk-risk--high",
  very_high: "sk-risk--very-high",
};

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
    <span className={`sk-risk ${CLASS[level]}`}>
      <Icon size={size === "sm" ? 13 : 14} aria-hidden="true" strokeWidth={2} />
      {RISK_LEVEL_LABELS[level]}
      {typeof score === "number" ? (
        <span className="sk-mono" aria-hidden="true">
          {score}
        </span>
      ) : null}
    </span>
  );
}
