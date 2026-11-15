type Box = { left: number; top: number; width: number; height: number };

/** The text of a count-up frame: a whole number between 0 and the target. */
export function formatCount(value: number, target: number): string {
  return String(Math.min(target, Math.max(0, Math.round(value))));
}

/** The x/y that puts `anchor` (e.g. a cursor's fingertip) on the centre of `target`, inside `root`. */
export function pointIn(
  target: Box,
  root: Box,
  anchor: { x: number; y: number } = { x: 0, y: 0 },
) {
  return {
    x: target.left - root.left + target.width / 2 - anchor.x,
    y: target.top - root.top + target.height / 2 - anchor.y,
  };
}
