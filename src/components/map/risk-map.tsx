"use client";

import dynamic from "next/dynamic";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export const RiskMap = dynamic(() => import("./risk-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="sk-map">
      <LoadingStatus />
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  ),
});
