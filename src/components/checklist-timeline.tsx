"use client";

import { useId, useState, type CSSProperties } from "react";
import { Check, ChevronDown } from "lucide-react";

export type TimelineItem = {
  item: string;
  quantity: string;
  audience: string;
  priority: string;
  reason: string;
};

type Props = {
  items: TimelineItem[];
  isChecked: (item: TimelineItem) => boolean;
  /** Share (0..1) of the rail to fill. */
  progress: number;
  /** Without it the timeline is a static preview (no checkboxes). */
  onToggle?: (item: TimelineItem) => void;
};

/** A vertical checklist timeline: a rail filled by progress, a node per item and a collapsible reason. */
export function ChecklistTimeline({
  items,
  isChecked,
  progress,
  onToggle,
}: Props) {
  return (
    <ol
      className="sk-timeline"
      style={{ "--sk-fill": progress } as CSSProperties}
    >
      {items.map((item) => (
        <TimelineRow
          key={item.item}
          item={item}
          checked={isChecked(item)}
          onToggle={onToggle}
        />
      ))}
    </ol>
  );
}

function TimelineRow({
  item,
  checked,
  onToggle,
}: {
  item: TimelineItem;
  checked: boolean;
  onToggle?: (item: TimelineItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <li className={`sk-timeline__item${checked ? " is-done" : ""}`}>
      <span className="sk-timeline__node">
        {onToggle ? (
          <input
            type="checkbox"
            className="sk-timeline__check"
            checked={checked}
            onChange={() => onToggle(item)}
            aria-label={`${item.item} siap`}
          />
        ) : (
          <span className="sk-timeline__check">
            <span className="sr-only">{checked ? "Siap" : "Belum siap"}</span>
          </span>
        )}
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </span>
      <div className="sk-timeline__body">
        <button
          type="button"
          className="sk-timeline__toggle"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            <b>{item.item}</b>
            <small>
              {item.quantity} · {item.audience}
              {item.priority !== "required" ? " · penting" : ""}
            </small>
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <div
          id={detailsId}
          className="sk-timeline__details"
          data-open={open || undefined}
        >
          <p>{item.reason}</p>
        </div>
      </div>
    </li>
  );
}
