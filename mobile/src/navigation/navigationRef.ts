import { createNavigationContainerRef } from "@react-navigation/native";

import {
  AdminStackParamList,
  AuthStackParamList,
  MainStackParamList,
} from "./types";

type RootParamList = AuthStackParamList & MainStackParamList & AdminStackParamList;

export const navigationRef = createNavigationContainerRef<RootParamList>();

export function navigateFromNotification(data: Record<string, unknown>) {
  if (!navigationRef.isReady()) {
    return;
  }

  const type = String(data.type || "");

  if (type.startsWith("citaona_")) {
    navigationRef.navigate("Citaona");
    return;
  }

  if (type === "discount_approved") {
    navigationRef.navigate("Popusti");
    return;
  }

  if (type === "scholarship_published" || type === "credit_published") {
    navigationRef.navigate("Stipendije");
  }
}
