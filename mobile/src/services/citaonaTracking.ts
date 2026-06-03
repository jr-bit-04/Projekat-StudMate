import { AppState, Platform } from "react-native";
import * as Location from "expo-location";

import { api } from "../api/client";
import { CitaonaTrackingStatus } from "../types/modules";
import { emitCitaonaTrackingEvent } from "./citaonaTrackerEvents";

const TRACKING_POLL_MS = 15000;
const SEND_THROTTLE_MS = 20000;
const TRACKABLE_STATUSES = new Set(["pending", "active"]);

let pollId: ReturnType<typeof setInterval> | null = null;
let activeReservationId: number | null = null;
let lastSentAt = 0;
let isSending = false;
let permissionWarningShown = false;

function stopLoop() {
  if (pollId) {
    clearInterval(pollId);
  }

  pollId = null;
  activeReservationId = null;
  lastSentAt = 0;
}

export async function ensureForegroundLocationPermission() {
  const current = await Location.getForegroundPermissionsAsync();

  if (current.status === "granted") {
    return true;
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === "granted";
}

async function sendCurrentPosition() {
  if (!activeReservationId || isSending) {
    return;
  }

  const now = Date.now();
  if (now - lastSentAt < SEND_THROTTLE_MS) {
    return;
  }

  isSending = true;

  try {
    const granted = await ensureForegroundLocationPermission();
    if (!granted) {
      if (!permissionWarningShown) {
        permissionWarningShown = true;
        emitCitaonaTrackingEvent({
          message:
            "Za dnevnu rezervaciju citaonice mora ostati dozvoljena lokacija na telefonu.",
        });
      }

      stopLoop();
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy:
        Platform.OS === "ios"
          ? Location.Accuracy.Balanced
          : Location.Accuracy.High,
    });

    const response = await api.post("/citaona/tracking/ping", {
      reservation_id: activeReservationId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy_meters: position.coords.accuracy,
    });

    emitCitaonaTrackingEvent(response.data);

    const nextReservation = response.data?.reservation;
    if (!nextReservation || !TRACKABLE_STATUSES.has(nextReservation.status)) {
      stopLoop();
    }
  } catch {
    // Silent retry on the next tick.
  } finally {
    lastSentAt = Date.now();
    isSending = false;
  }
}

async function syncTrackingReservation() {
  try {
    const response = await api.get<CitaonaTrackingStatus>("/citaona/tracking/active");
    const trackingStatus = response.data;

    emitCitaonaTrackingEvent({
      reservation: trackingStatus.reservation,
      shouldTrack: trackingStatus.shouldTrack,
    });

    const reservation = trackingStatus.reservation;
    if (
      !trackingStatus.enabled_by_preference ||
      !trackingStatus.shouldTrack ||
      !reservation?.id
    ) {
      stopLoop();
      return;
    }

    activeReservationId = reservation.id;
    await sendCurrentPosition();
  } catch {
    // Silent polling failure.
  }
}

export function startCitaonaTrackingAgent() {
  if (pollId) {
    return stopLoop;
  }

  void syncTrackingReservation();
  pollId = setInterval(() => {
    if (AppState.currentState === "active") {
      void syncTrackingReservation();
    }
  }, TRACKING_POLL_MS);

  return stopLoop;
}

export function stopCitaonaTrackingAgent() {
  stopLoop();
}
