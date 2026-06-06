import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { getDefaultAdminModule } from "../data/adminModules";
import { ProfilScreen } from "../screens/main/ProfilScreen";
import { AdminHubScreen } from "../screens/admin/AdminHubScreen";
import { AdminModuleScreen } from "../screens/admin/AdminModuleScreen";
import { colors } from "../theme/colors";
import { AdminStackParamList } from "./types";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator({
  initialRouteName,
}: {
  initialRouteName?: keyof AdminStackParamList;
}) {
  const { user } = useAuth();
  const defaultModule = getDefaultAdminModule(user);
  const isGlobalAdmin = user?.role === "admin" && user?.admin_module === "all";
  const showHub = isGlobalAdmin || !defaultModule;

  return (
    <Stack.Navigator
      initialRouteName={
        initialRouteName ?? (showHub ? "AdminHub" : "AdminModule")
      }
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {showHub ? (
        <Stack.Screen name="AdminHub" component={AdminHubScreen} />
      ) : null}

      {defaultModule || isGlobalAdmin ? (
        <Stack.Screen
          component={AdminModuleScreen}
          initialParams={
            defaultModule
              ? {
                  module: defaultModule,
                }
              : undefined
          }
          name="AdminModule"
        />
      ) : null}

      <Stack.Screen name="Profil" component={ProfilScreen} />
    </Stack.Navigator>
  );
}
