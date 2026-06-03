import { useEffect, useRef } from "react";

import api from "../../api/axios";
import useStoredUser from "../../hooks/useStoredUser";
import {
  CITAONA_TRACKING_EVENT,
  dispatchCitaonaTrackingEvent,
} from "../../utils/citaonaTracking";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 15000,
};

const TRACKING_POLL_MS = 15000;
const SEND_THROTTLE_MS = 20000;
const TRACKABLE_STATUSES = new Set(["pending", "active"]);

function CitaonaLocationTracker() {
  const user = useStoredUser();
  const watchIdRef = useRef(null);
  const activeReservationIdRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const isSendingRef = useRef(false);
  const permissionWarningShownRef = useRef(false);
  const cancelledReservationRef = useRef(null);

  useEffect(() => {
    const clearWatch = () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = null;
      activeReservationIdRef.current = null;
    };

    const sendPosition = async (position) => {
      const reservationId = activeReservationIdRef.current;

      if (!reservationId) return;

      const now = Date.now();

      if (
        isSendingRef.current ||
        now - lastSentAtRef.current < SEND_THROTTLE_MS
      ) {
        return;
      }

      isSendingRef.current = true;

      try {
        const res = await api.post("/citaona/tracking/ping", {
          reservation_id: reservationId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: position.coords.accuracy,
        });

        dispatchCitaonaTrackingEvent(res.data);

        const nextReservation = res.data?.reservation;

        if (
          !nextReservation ||
          !TRACKABLE_STATUSES.has(nextReservation.status)
        ) {
          clearWatch();
        }

        if (
          nextReservation?.status === "cancelled" &&
          cancelledReservationRef.current !== nextReservation.id
        ) {
          cancelledReservationRef.current = nextReservation.id;
          window.alert(
            "Rezervacija u čitaonici je automatski otkazana jer si bio van dozvoljenog radijusa duže od 60 minuta."
          );
        }
      } catch {
        // If tracking ping fails, keep the watch alive and retry on the next update.
      } finally {
        lastSentAtRef.current = Date.now();
        isSendingRef.current = false;
      }
    };

    const handleLocationError = (error) => {
      if (
        error?.code === error?.PERMISSION_DENIED &&
        !permissionWarningShownRef.current
      ) {
        permissionWarningShownRef.current = true;
        window.alert(
            "Za dnevnu rezervaciju čitaonice moraš ostaviti dozvoljenu lokaciju u browseru dok koristiš aplikaciju."
          );
      }

      if (error?.code === error?.PERMISSION_DENIED) {
        clearWatch();
      }
    };

    const ensureWatchStarted = () => {
      if (!("geolocation" in navigator) || watchIdRef.current !== null) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        sendPosition,
        handleLocationError,
        GEO_OPTIONS
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        sendPosition,
        handleLocationError,
        GEO_OPTIONS
      );
    };

    const syncTrackingReservation = async () => {
      try {
        const res = await api.get("/citaona/tracking/active");
        dispatchCitaonaTrackingEvent(res.data);

        const reservation = res.data?.reservation;

        if (
          !res.data?.enabled_by_preference ||
          !res.data?.shouldTrack ||
          !reservation?.id
        ) {
          clearWatch();
          return;
        }

        if (activeReservationIdRef.current !== reservation.id) {
          clearWatch();
          lastSentAtRef.current = 0;
          cancelledReservationRef.current = null;
        }

        activeReservationIdRef.current = reservation.id;
        ensureWatchStarted();
      } catch {
        // Silent polling failure.
      }
    };

    const handleExternalTrackingUpdate = (event) => {
      const reservation = event.detail?.reservation;

      if (!reservation || !TRACKABLE_STATUSES.has(reservation.status)) {
        clearWatch();
      }
    };

    if (
      !user ||
      user.role !== "student" ||
      user.location_tracking_consent !== true
    ) {
      clearWatch();
      return undefined;
    }

    syncTrackingReservation();

    const pollId = window.setInterval(syncTrackingReservation, TRACKING_POLL_MS);
    window.addEventListener(CITAONA_TRACKING_EVENT, handleExternalTrackingUpdate);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener(
        CITAONA_TRACKING_EVENT,
        handleExternalTrackingUpdate
      );
      clearWatch();
    };
  }, [user]);

  return null;
}

export default CitaonaLocationTracker;
