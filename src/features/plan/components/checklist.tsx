"use client";

import { useEffect, useState } from "react";
import { Backpack } from "lucide-react";
import { ChecklistTimeline } from "@/components/checklist-timeline";
import type { GoKitItem } from "@/features/plan/ui-types";
import { progressShare, visibleItems } from "@/lib/checklist-progress";

/** The go-kit checklist, persisted per plan slug; "Wajib" shows the required items only. */
export function Checklist({
  slug,
  items,
}: {
  slug: string;
  items: GoKitItem[];
}) {
  const storageKey = `siagaku:checklist:${slug}`;
  const [checked, setChecked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"required" | "all">("required");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      // the checklist is local; reading it after mount avoids a hydration mismatch
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setChecked(JSON.parse(raw) as string[]);
    } catch {
      // a full or blocked storage keeps the checklist unchecked
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    // never write before the stored list has been read: [] must not overwrite progress
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // ignore a blocked storage
    }
  }, [checked, storageKey, loaded]);

  const toggle = (item: string) => {
    setChecked((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  };

  const isChecked = (item: { item: string }) => checked.includes(item.item);
  const ready = items.filter(isChecked).length;
  const shown = visibleItems(items, filter);

  return (
    <section className="sk-card sk-checklist-card" aria-labelledby="tas-h">
      <div className="sk-card__head">
        <h2 id="tas-h" className="sk-heading-icon">
          <Backpack size={18} aria-hidden="true" />
          Tas siaga
        </h2>
        <span className="sk-mono">
          {ready}/{items.length} siap
        </span>
      </div>
      <div className="sk-tabs" role="group" aria-label="Filter tas siaga">
        <button
          type="button"
          aria-pressed={filter === "required"}
          className={filter === "required" ? "is-on" : ""}
          onClick={() => setFilter("required")}
        >
          Wajib
        </button>
        <button
          type="button"
          aria-pressed={filter === "all"}
          className={filter === "all" ? "is-on" : ""}
          onClick={() => setFilter("all")}
        >
          Semua
        </button>
      </div>
      <ChecklistTimeline
        items={shown}
        isChecked={isChecked}
        // the rail tracks the rows on screen; the counter above counts every item
        progress={progressShare(shown, isChecked)}
        onToggle={(item) => toggle(item.item)}
      />
    </section>
  );
}
