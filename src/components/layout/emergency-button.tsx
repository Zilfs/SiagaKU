"use client";

import { openEmergency } from "./emergency";

export function EmergencyButton({
  className = "nav__link",
  children = "Darurat 112",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={openEmergency}>
      {children}
    </button>
  );
}
