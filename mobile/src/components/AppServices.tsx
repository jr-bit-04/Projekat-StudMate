import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { navigateFromNotification } from "../navigation/navigationRef";
import {
  startCitaonaTrackingAgent,
  stopCitaonaTrackingAgent,
} from "../services/citaonaTracking";
import { registerForPushNotificationsAsync } from "../services/notifications";

export function AppServices() {
  const { status, user } = useAuth();

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      stopCitaonaTrackingAgent();
      return;
    }

    void registerPushToken();

    if (user.role === "student") {
      if (user.location_tracking_consent === true) {
        const stop = startCitaonaTrackingAgent();
        return () => {
          stop?.();
        };
      }
    }

    stopCitaonaTrackingAgent();

    return undefined;
  }, [status, user?.id, user?.role, user?.location_tracking_consent]);

  useEffect(() => {
    const notificationSubscription =
      Notifications.addNotificationReceivedListener(() => {});
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        navigateFromNotification(data);
      });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}

async function registerPushToken() {
  try {
    const push = await registerForPushNotificationsAsync();
    if (!push.token) {
      if (push.error) {
        console.warn("Push token registration skipped:", push.error);
      }
      return;
    }

    await api.post("/users/push-token", {
      expo_push_token: push.token,
      device_platform: "mobile",
      enabled: true,
    });
  } catch (error) {
    console.warn("Push token registration failed", error);
  }
}
