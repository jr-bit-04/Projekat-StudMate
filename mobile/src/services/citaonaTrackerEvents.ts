import { CitaonaTrackingStatus } from "../types/modules";

type Listener = (payload: CitaonaTrackingEventPayload) => void;

export interface CitaonaTrackingEventPayload {
  reservation?: CitaonaTrackingStatus["reservation"] | null;
  shouldTrack?: boolean;
  tracking?: {
    distance_meters?: number;
    within_radius?: boolean;
    radius_meters?: number;
    grace_minutes?: number;
  };
  message?: string;
}

const listeners = new Set<Listener>();

export function emitCitaonaTrackingEvent(payload: CitaonaTrackingEventPayload) {
  listeners.forEach((listener) => {
    listener(payload);
  });
}

export function subscribeToCitaonaTracking(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

