export const EMERGENCY_EVENT = "siagaku:emergency";

/** Opens the one emergency dialog mounted in the site layout. */
export function openEmergency() {
  window.dispatchEvent(new Event(EMERGENCY_EVENT));
}
