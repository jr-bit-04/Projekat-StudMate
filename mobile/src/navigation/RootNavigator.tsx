import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { AdminNavigator } from "./AdminNavigator";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";

export function RootNavigator() {
  const { status, user, resetMode } = useAuth();

  return (
    <NavigationContainer>
      {status === "loading" ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : status === "authenticated" ? (
        user?.role === "admin" ? (
          <AdminNavigator initialRouteName={resetMode ? "Profil" : undefined} />
        ) : (
          <MainNavigator initialRouteName={resetMode ? "Profil" : undefined} />
        )
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
