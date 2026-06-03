import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Faza 3</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    color: "#516274",
    fontSize: 16,
    lineHeight: 24,
  },
  kicker: {
    color: "#9a6a1d",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  page: {
    backgroundColor: colors.background,
    flex: 1,
    padding: 20,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 22,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
