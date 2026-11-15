"use client";

import { useEffect, useState } from "react";
import type { GoKitItem } from "@/features/plan/ui-types";

/** The go-kit checklist, persisted per plan slug; "Wajib" shows the required items only. */
export function Checklist({ slug, items }: { slug: string; items: GoKitItem[] }) {
  const storageKey = `siagaku:checklist:${slug}`;
  const [checked, setChecked] = useState<string[]>([]);
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
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // ignore a blocked storage
    }
  }, [checked, storageKey]);

  const toggle = (item: string) => {
    setChecked((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  };

  const ready = items.filter((item) => checked.includes(item.item)).length;
  const visible =
    filter === "required"
      ? items.filter((item) => item.priority === "required")
      : items;

  return (
    <section className="sk-card sk-checklist-card" aria-labelledby="tas-h">
      <div className="sk-card__head">
        <h2 id="tas-h">Tas siaga</h2>
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
      <ul className="sk-checklist">
        {visible.map((item) => (
          <li key={item.item}>
            <label>
              <input
                type="checkbox"
                checked={checked.includes(item.item)}
                onChange={() => toggle(item.item)}
              />
              <span>
                <b>{item.item}</b>
                <small>
                  {item.quantity} · {item.audience}
                  {item.priority !== "required" ? " · penting" : ""}
                </small>
                <span className="sk-checklist__reason">{item.reason}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="sk-progress" aria-hidden="true">
        <i style={{ width: `${items.length ? (ready / items.length) * 100 : 0}%` }} />
      </div>
    </section>
  );
}
