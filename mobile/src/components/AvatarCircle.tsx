import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { absoluteAssetUrl, getInitials } from "../utils/format";

interface AvatarCircleProps {
  name?: string | null;
  size?: number;
  src?: string | null;
}

export function AvatarCircle({
  name,
  size = 84,
  src,
}: AvatarCircleProps) {
  const imageUrl = absoluteAssetUrl(src);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { height: size, width: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { height: size, width: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.fallbackText}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.borderStrong,
    borderWidth: 3,
    justifyContent: "center",
  },
  fallbackText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  image: {
    borderColor: colors.borderStrong,
    borderWidth: 3,
  },
});
