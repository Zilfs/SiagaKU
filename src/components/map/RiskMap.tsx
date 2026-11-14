"use client";

import dynamic from "next/dynamic";

export const RiskMap = dynamic(() => import("./RiskMapInner"), {
  ssr: false,
  loading: () => (
    <div className="sk-map sk-map--loading" role="status">
      Memuat peta…
    </div>
  ),
});
