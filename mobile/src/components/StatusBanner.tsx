import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface StatusBannerProps {
  tone?: "danger" | "info" | "success" | "warning";
  text: string;
}

export function StatusBanner({
  text,
  tone = "info",
}: StatusBannerProps) {
  return (
    <View style={[styles.banner, toneStyles[tone].container]}>
      <Text style={[styles.text, toneStyles[tone].text]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});

const toneStyles = {
  info: StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceAlt,
    },
    text: {
      color: colors.primary,
    },
  }),
  success: StyleSheet.create({
    container: {
      backgroundColor: colors.successBg,
    },
    text: {
      color: colors.successText,
    },
  }),
  warning: StyleSheet.create({
    container: {
      backgroundColor: colors.warningBg,
    },
    text: {
      color: colors.warningText,
    },
  }),
  danger: StyleSheet.create({
    container: {
      backgroundColor: colors.dangerBg,
    },
    text: {
      color: colors.dangerText,
    },
  }),
};
