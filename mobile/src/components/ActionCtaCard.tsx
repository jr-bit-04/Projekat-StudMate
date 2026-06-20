import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

interface ActionCtaCardProps {
  badge: string;
  chipLabel?: string;
  description: string;
  onPress: () => void;
  title: string;
}

export function ActionCtaCard({
  badge,
  chipLabel = "Otvori uplatu",
  description,
  onPress,
  title,
}: ActionCtaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.footer}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{chipLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    marginTop: 10,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  description: {
    color: "rgba(255, 255, 255, 0.84)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  footer: {
    alignItems: "flex-start",
    marginTop: 16,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
  },
});
