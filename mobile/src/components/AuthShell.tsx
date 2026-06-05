import { PropsWithChildren, ReactNode } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import backgroundArt from "../assets/background.png";
import ucgLogo from "../assets/ucg-logo.png";
import { colors } from "../theme/colors";
import { AppIcon, IconName } from "./AppIcon";

interface AuthShellProps extends PropsWithChildren {
  brandCaption?: string;
  eyebrow: string;
  footer?: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthShell({
  brandCaption = "Sve studentske informacije na jednom mjestu",
  children,
  eyebrow,
  footer,
  title,
  subtitle,
}: AuthShellProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ImageBackground source={backgroundArt} style={styles.flex} resizeMode="cover">
        <View style={styles.overlay} />
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroTop}>
            <Image source={ucgLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandWordmark}>
              <Text style={styles.brandWordmarkLight}>Stud</Text>
              <Text style={styles.brandWordmarkAccent}>Mate</Text>
            </Text>
            <Text style={styles.brandIntro}>{brandCaption}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />
            <View style={styles.heroHeader}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.formBody}>{children}</View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ili</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.featuresRow}>
              <Feature icon="dom" label="Dom" />
              <Feature icon="menza" label="Menza" />
              <Feature icon="citaona" label="Čitaona" />
              <Feature icon="popusti" label="Popusti" />
              <Feature icon="info" label="Info" />
            </View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function Feature({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureBadge}>
        <AppIcon name={icon} size={18} color="#3F94FF" />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(6,39,99,0.74)",
    borderColor: "rgba(76,156,255,0.4)",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 22,
    shadowColor: "#1F75FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 4,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },
  eyebrow: {
    color: "#62A8FF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  dividerLine: {
    backgroundColor: "rgba(147,197,253,0.2)",
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginTop: 18,
  },
  dividerText: {
    color: "rgba(219,234,254,0.82)",
    fontSize: 14,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  featureBadge: {
    alignItems: "center",
    backgroundColor: "rgba(63,148,255,0.16)",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  featureBadgeText: {
    color: "#3F94FF",
    fontSize: 14,
    fontWeight: "800",
  },
  featureLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  featuresRow: {
    flexDirection: "row",
    marginTop: 18,
  },
  flex: {
    flex: 1,
  },
  footer: {
    marginTop: 18,
  },
  heroGlowBottom: {
    backgroundColor: "rgba(59,130,255,0.28)",
    borderRadius: 999,
    bottom: -50,
    height: 150,
    position: "absolute",
    right: -10,
    width: 150,
  },
  heroHeader: {
    marginBottom: 14,
  },
  heroGlowTop: {
    backgroundColor: "rgba(77,163,255,0.12)",
    borderRadius: 999,
    height: 120,
    position: "absolute",
    right: -18,
    top: -26,
    width: 120,
  },
  heroTop: {
    alignItems: "center",
    marginBottom: 18,
  },
  formBody: {
    gap: 12,
  },
  brandIntro: {
    color: "rgba(219,234,254,0.92)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  brandWordmark: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 48,
    marginTop: 4,
  },
  brandWordmarkAccent: {
    color: "#3F94FF",
  },
  brandWordmarkLight: {
    color: colors.white,
  },
  subtitle: {
    color: "rgba(239,246,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  title: {
    color: "#62A8FF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
  },
  logo: {
    height: 118,
    width: 118,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,58,143,0.16)",
  },
});
