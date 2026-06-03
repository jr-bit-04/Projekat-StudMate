import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { EXPO_EAS_PROJECT_ID } from "../config/env";
import { colors } from "../theme/colors";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function resolveProjectId() {
  return (
    EXPO_EAS_PROJECT_ID ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    ""
  );
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return {
      token: null,
      error: "Push notifikacije rade samo na pravom uredjaju.",
    };
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== "granted") {
    return {
      token: null,
      error: "Dozvola za push notifikacije nije odobrena.",
    };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.primary,
    });
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return {
      token: null,
      error:
        "Nedostaje EAS project ID. Upisi EXPO_PUBLIC_EAS_PROJECT_ID u mobile/.env.",
    };
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  return {
    token: token.data,
    error: null,
  };
}
