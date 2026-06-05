import { NavigationProp, ParamListBase, useNavigation } from "@react-navigation/native";
import { PropsWithChildren, ReactNode } from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import backgroundArt from "../assets/background.png";
import ucgLogo from "../assets/ucg-logo.png";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { AppIcon } from "./AppIcon";
import { AvatarCircle } from "./AvatarCircle";

interface ScreenShellProps extends PropsWithChildren {
  eyebrow?: string;
  subtitle?: string;
  title: string;
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  image?: ImageSourcePropType;
  highlights?: string[];
}

export function ScreenShell({
  action,
  children,
  highlights = [],
  image,
  eyebrow,
  onRefresh,
  refreshing = false,
  subtitle,
  title,
}: ScreenShellProps) {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const isCompact = width < 430;
  const canGoBack = navigation.canGoBack();

  return (
    <ImageBackground source={backgroundArt} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandBlock}>
              <Image source={ucgLogo} style={styles.logo} resizeMode="contain" />
              <View style={styles.brandTextWrap}>
                <Text
                  numberOfLines={1}
                  style={[styles.brandTitle, isCompact ? styles.brandTitleCompact : null]}
                >
                  StudMate
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.brandSubtitle,
                    isCompact ? styles.brandSubtitleCompact : null,
                  ]}
                >
                  Univerzitet Crne Gore
                </Text>
              </View>
            </View>

            {user ? (
              <View style={styles.avatarBadge}>
                <AvatarCircle
                  name={user.name}
                  size={isCompact ? 42 : 46}
                  src={user.profile_image_url}
                />
              </View>
            ) : null}
          </View>

          {(canGoBack || user) ? (
            <View
              style={[
                styles.utilityRow,
                !canGoBack ? styles.utilityRowEnd : null,
                isCompact ? styles.utilityRowCompact : null,
              ]}
            >
              {canGoBack ? (
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [
                    styles.backButton,
                    isCompact ? styles.backButtonCompact : null,
                    pressed ? styles.backButtonPressed : null,
                  ]}
                >
                  <AppIcon name="back" size={18} color={colors.white} />
                  {!isCompact ? (
                    <Text style={styles.backButtonText}>Nazad</Text>
                  ) : null}
                </Pressable>
              ) : null}

              {user ? (
                <View style={styles.userMeta}>
                  <Text numberOfLines={1} style={styles.userMetaName}>
                    {user.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.userMetaEmail}>
                    {isCompact ? user.email || "StudMate korisnik" : user.email}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />
          <View style={[styles.heroRow, isWide ? styles.heroRowWide : null]}>
            <View style={styles.heroText}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

              {highlights.length > 0 ? (
                <View style={styles.highlightRow}>
                  {highlights.map((item) => (
                    <View key={item} style={styles.highlightChip}>
                      <Text style={styles.highlightChipText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {action ? <View style={styles.action}>{action}</View> : null}
            </View>

            {image ? (
              <View style={[styles.imageFrame, isWide ? styles.imageFrameWide : null]}>
                <Image source={image} style={styles.heroImage} resizeMode="cover" />
              </View>
            ) : null}
          </View>
        </View>
        {children}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: 16,
  },
  background: {
    flex: 1,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  backButtonCompact: {
    paddingHorizontal: 11,
  },
  backButtonArrow: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  backButtonPressed: {
    opacity: 0.9,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  brandBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  brandSubtitle: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.92,
  },
  brandSubtitleCompact: {
    fontSize: 11,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  brandTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  brandTitleCompact: {
    fontSize: 20,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    padding: 22,
    shadowColor: "#0B3A8F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  heroImage: {
    height: 220,
    width: "100%",
  },
  heroRowWide: {
    alignItems: "center",
    flexDirection: "row",
  },
  heroGlowPrimary: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 120,
    position: "absolute",
    right: -20,
    top: -25,
    width: 120,
  },
  heroGlowSecondary: {
    backgroundColor: "#EAF2FF",
    borderRadius: 999,
    bottom: -60,
    height: 160,
    position: "absolute",
    right: 30,
    width: 160,
  },
  heroRow: {
    gap: 12,
  },
  heroText: {
    flex: 1,
    maxWidth: 480,
  },
  highlightChip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  highlightChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  imageFrame: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
    padding: 6,
  },
  imageFrameWide: {
    flex: 0.92,
    marginTop: 0,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: "800",
  },
  logo: {
    height: 42,
    width: 42,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,58,143,0.12)",
  },
  topBar: {
    backgroundColor: "rgba(11,58,143,0.86)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#0B3A8F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  utilityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  utilityRowCompact: {
    gap: 10,
  },
  utilityRowEnd: {
    justifyContent: "flex-end",
  },
  userMeta: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userMetaEmail: {
    color: "#DCE8FF",
    fontSize: 11,
  },
  userMetaName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
