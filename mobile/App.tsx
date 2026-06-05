import "react-native-gesture-handler";

import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppServices } from "./src/components/AppServices";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import {
  applyMontserratDefaults,
  montserratFonts,
} from "./src/theme/typography";

applyMontserratDefaults();

export default function App() {
  const [fontsLoaded] = useFonts(montserratFonts);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppServices />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
