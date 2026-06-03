export const CITAONA_TRACKING_EVENT = "studmate:citaona-tracking-updated";

export function dispatchCitaonaTrackingEvent(detail) {
  window.dispatchEvent(
    new CustomEvent(CITAONA_TRACKING_EVENT, {
      detail,
    })
  );
}
