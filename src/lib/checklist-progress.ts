/** Share (0..1) of checked items among all items; drives the checklist rail. */
export function progressShare<T>(items: T[], isChecked: (item: T) => boolean) {
  return items.length ? items.filter(isChecked).length / items.length : 0;
}

/** Items shown under the "Wajib" (required) or "Semua" (all) filter. */
export function visibleItems<T extends { priority: string }>(
  items: T[],
  filter: "required" | "all",
) {
  return filter === "required"
    ? items.filter((item) => item.priority === "required")
    : items;
}
