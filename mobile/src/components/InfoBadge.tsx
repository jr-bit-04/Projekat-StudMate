import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface InfoBadgeProps {
  tone?: "danger" | "primary" | "success" | "warning";
  value: string;
}

export function InfoBadge({
  tone = "primary",
  value,
}: InfoBadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone].container]}>
      <Text style={[styles.text, toneStyles[tone].text]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});

const toneStyles = {
  primary: StyleSheet.create({
    container: {
      backgroundColor: colors.primarySoft,
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
