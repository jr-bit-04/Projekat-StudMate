import { cloneElement, ReactElement } from "react";
import { StyleSheet, Text, TextInput, TextStyle } from "react-native";

import {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from "@expo-google-fonts/montserrat";

// Font assets passed to useFonts() in App.tsx.
export const montserratFonts = {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
};

// React Native ne mapira numericki fontWeight na zaseban font fajl, pa rucno
// biramo odgovarajucu Montserrat varijantu za svaku tezinu.
const familyByWeight: Record<string, string> = {
  "100": "Montserrat_300Light",
  "200": "Montserrat_300Light",
  "300": "Montserrat_300Light",
  "400": "Montserrat_400Regular",
  normal: "Montserrat_400Regular",
  "500": "Montserrat_500Medium",
  "600": "Montserrat_600SemiBold",
  "700": "Montserrat_700Bold",
  bold: "Montserrat_700Bold",
  "800": "Montserrat_800ExtraBold",
  "900": "Montserrat_900Black",
};

function familyForWeight(weight?: TextStyle["fontWeight"]): string {
  if (weight == null) {
    return "Montserrat_400Regular";
  }

  return familyByWeight[String(weight)] || "Montserrat_400Regular";
}

let patched = false;

// Globalno postavlja Montserrat kao podrazumijevani font za sve Text/TextInput
// komponente, birajuci varijantu na osnovu fontWeight-a u stilu.
export function applyMontserratDefaults() {
  if (patched) {
    return;
  }

  patched = true;

  for (const Component of [Text, TextInput] as Array<{
    render?: (...args: unknown[]) => ReactElement;
  }>) {
    const oldRender = Component.render;

    if (!oldRender) {
      continue;
    }

    Component.render = function render(...args: unknown[]) {
      const origin = oldRender.apply(this, args);
      const flattened =
        (StyleSheet.flatten((origin.props as { style?: unknown }).style) as
          | TextStyle
          | undefined) || {};
      const fontFamily = familyForWeight(flattened.fontWeight);

      return cloneElement(origin, {
        style: [
          (origin.props as { style?: unknown }).style,
          { fontFamily, fontWeight: undefined },
        ],
      } as never);
    };
  }
}
