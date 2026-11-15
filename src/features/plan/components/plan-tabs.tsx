"use client";

import { useState } from "react";

const TABS = {
  before: "Sebelum",
  during: "Saat",
  after: "Setelah",
} as const;

type TabKey = keyof typeof TABS;

/** The before/during/after steps as three tabs. */
export function PlanTabs({
  before,
  during,
  after,
}: {
  before: string[];
  during: string[];
  after: string[];
}) {
  const [tab, setTab] = useState<TabKey>("before");
  const items = tab === "before" ? before : tab === "during" ? during : after;

  return (
    <section className="sk-card sk-plan-tabs" aria-labelledby="langkah-h">
      <div className="sk-card__head">
        <h2 id="langkah-h">Langkah saat banjir</h2>
      </div>
      <div className="sk-tabs" role="tablist" aria-label="Waktu langkah">
        {(Object.keys(TABS) as TabKey[]).map((key) => (
          <button
            key={key}
            id={`tab-${key}`}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            className={tab === key ? "is-on" : ""}
            onClick={() => setTab(key)}
          >
            {TABS[key]}
          </button>
        ))}
      </div>
      <ol
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="sk-plan-steps"
      >
        {items.length === 0 ? (
          <li className="sk-list__empty">Belum ada langkah untuk bagian ini.</li>
        ) : (
          items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span className="sk-plan-steps__num">{index + 1}</span>
              <span>{item}</span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
