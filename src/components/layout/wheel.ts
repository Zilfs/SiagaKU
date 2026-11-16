/** Below this a pixel-mode wheel event is a trackpad or precision wheel, which is already smooth. */
const MIN_NOTCH_PX = 50;
/** Firefox reports mouse wheels in lines; one line is about this many pixels. */
const LINE_PX = 40;

export type WheelInput = Pick<
  WheelEvent,
  "deltaX" | "deltaY" | "deltaMode" | "ctrlKey"
>;

/**
 * How far a notched mouse wheel wants the page to move, in pixels, or null when the browser
 * should handle the event itself (pinch zoom, sideways scroll, trackpads, page-mode wheels).
 */
export function wheelPixels(event: WheelInput): number | null {
  if (event.ctrlKey || event.deltaY === 0) return null;
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return null;
  if (event.deltaMode === 1) return event.deltaY * LINE_PX;
  if (event.deltaMode !== 0) return null;
  return Math.abs(event.deltaY) < MIN_NOTCH_PX ? null : event.deltaY;
}
