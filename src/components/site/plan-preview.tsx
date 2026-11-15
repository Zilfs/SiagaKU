"use client";

import { useRef } from "react";
import {
  ChecklistTimeline,
  type TimelineItem,
} from "@/components/checklist-timeline";
import { gsap, MOTION_OK, onceInView, useGSAP } from "./gsap";

const ITEMS: TimelineItem[] = [
  {
    item: "Air minum 3 L per orang, 3 hari",
    quantity: "6 botol",
    audience: "Semua anggota",
    priority: "required",
    reason:
      "Air bersih sering terputus saat banjir; tiga hari memberi waktu sampai bantuan datang.",
  },
  {
    item: "Dokumen di kantong tahan air",
    quantity: "KK, KTP",
    audience: "Semua anggota",
    priority: "required",
    reason:
      "Dokumen asli dibutuhkan untuk bantuan dan pengurusan ulang setelah banjir.",
  },
  {
    item: "Obat rutin 7 hari untuk lansia",
    quantity: "7 hari",
    audience: "Lansia",
    priority: "required",
    reason:
      "Apotek terdekat bisa tutup atau tergenang; obat rutin tidak boleh terputus.",
  },
  {
    item: "Lampu senter dan baterai cadangan",
    quantity: "2 buah",
    audience: "Semua anggota",
    priority: "recommended",
    reason: "Listrik biasanya dipadamkan saat air masuk permukiman.",
  },
  {
    item: "Jalur keluar dan titik aman keluarga",
    quantity: "1 titik",
    audience: "Semua anggota",
    priority: "required",
    reason:
      "Semua anggota tahu ke mana harus pergi jika terpisah saat mengungsi.",
  },
];

const DONE = new Set(ITEMS.slice(0, 2).map((entry) => entry.item));
/** The sample plan: 8 of 22 items ready. */
const PROGRESS = 8 / 22;

/** The landing's #cara preview: the plan page's timeline with sample data; the rail fills on view. */
export function PlanPreview() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      gsap.matchMedia(root).add(MOTION_OK, () => {
        const rail = root.querySelector(".sk-timeline");
        if (!rail) return;
        // the rail's own CSS transition (transform only) carries the fill from 0 to the progress
        gsap.set(rail, { "--sk-fill": 0 });
        return onceInView(root, "20%", () => {
          gsap.set(rail, { "--sk-fill": PROGRESS });
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref}>
      <ChecklistTimeline
        items={ITEMS}
        isChecked={(entry) => DONE.has(entry.item)}
        progress={PROGRESS}
      />
    </div>
  );
}
