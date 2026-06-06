import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../theme/colors";
import { CitaonaScreen } from "../screens/main/CitaonaScreen";
import { DashboardScreen } from "../screens/main/DashboardScreen";
import { DomScreen } from "../screens/main/DomScreen";
import { MenzaScreen } from "../screens/main/MenzaScreen";
import { PopustiScreen } from "../screens/main/PopustiScreen";
import { ProfilScreen } from "../screens/main/ProfilScreen";
import { StipendijeScreen } from "../screens/main/StipendijeScreen";
import { MainStackParamList } from "./types";

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator({
  initialRouteName,
}: {
  initialRouteName?: keyof MainStackParamList;
}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "StudMate" }}
      />
      <Stack.Screen
        name="Citaona"
        component={CitaonaScreen}
        options={{ title: "Čitaonica" }}
      />
      <Stack.Screen
        name="Menza"
        component={MenzaScreen}
        options={{ title: "Menza" }}
      />
      <Stack.Screen
        name="Dom"
        component={DomScreen}
        options={{ title: "Studentski dom" }}
      />
      <Stack.Screen
        name="Popusti"
        component={PopustiScreen}
        options={{ title: "Popusti" }}
      />
      <Stack.Screen
        name="Stipendije"
        component={StipendijeScreen}
        options={{ title: "Stipendije" }}
      />
      <Stack.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ title: "Profil" }}
      />
    </Stack.Navigator>
  );
}
