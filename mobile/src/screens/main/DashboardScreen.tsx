import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCallback, useEffect, useState } from "react";

import { api, getApiErrorMessage } from "../../api/client";
import { AppIcon, IconName } from "../../components/AppIcon";
import { AvatarCircle } from "../../components/AvatarCircle";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import {
  AnnouncementItem,
  DiscountItem,
  ScholarshipItem,
} from "../../types/modules";
import { formatDate, mealLabel } from "../../utils/format";

type Props = NativeStackScreenProps<MainStackParamList, "Dashboard">;

interface DashboardData {
  announcements: AnnouncementItem[];
  discounts: DiscountItem[];
  scholarships: ScholarshipItem[];
  menu: Array<{
    id: number;
    datum: string;
    naslov: string;
    opis: string;
    tip_obroka: string;
  }>;
}

const shortcuts: Array<{
  title: string;
  route: keyof Omit<MainStackParamList, "Dashboard">;
  description: string;
  icon: IconName;
  badgeBg: string;
  badgeColor: string;
}> = [
  {
    title: "Dom",
    route: "Dom",
    description: "Mjesečne obaveze i novosti doma.",
    icon: "dom",
    badgeBg: "rgba(11,58,143,0.1)",
    badgeColor: "#0B3A8F",
  },
  {
    title: "Menza",
    route: "Menza",
    description: "Meni, bonovi i obavještenja.",
    icon: "menza",
    badgeBg: "#E8F5EC",
    badgeColor: "#15803D",
  },
  {
    title: "Čitaona",
    route: "Citaona",
    description: "Rezervacije, praćenje i status mjesta.",
    icon: "citaona",
    badgeBg: "#F3E8FF",
    badgeColor: "#7E22CE",
  },
  {
    title: "Popusti",
    route: "Popusti",
    description: "Aktivne pogodnosti i partneri.",
    icon: "popusti",
    badgeBg: "#FEF3C7",
    badgeColor: "#B45309",
  },
  {
    title: "Stipendije",
    route: "Stipendije",
    description: "Konkursi, rokovi i detalji prijave.",
    icon: "stipendije",
    badgeBg: "#FFE4E6",
    badgeColor: "#BE123C",
  },
  {
    title: "Profil",
    route: "Profil",
    description: "Lozinka, profilna slika i lokacija.",
    icon: "profil",
    badgeBg: "#EEF5FF",
    badgeColor: "#0B3A8F",
  },
];

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    announcements: [],
    discounts: [],
    scholarships: [],
    menu: [],
  });
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showModules, setShowModules] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<DashboardData>("/dashboard");
      setData({
        announcements: response.data.announcements || [],
        discounts: response.data.discounts || [],
        scholarships: response.data.scholarships || [],
        menu: response.data.menu || [],
      });
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Greška pri učitavanju početne stranice.")
      );
    }
  }, []);

  useEffect(() => {
    setRefreshing(true);
    loadDashboard().finally(() => setRefreshing(false));
  }, [loadDashboard]);

  return (
    <ScreenShell
      action={
        <Pressable
          onPress={() => navigation.navigate("Profil")}
          style={({ pressed }) => [
            styles.identityCard,
            pressed ? styles.shortcutPressed : null,
          ]}
        >
          <AvatarCircle
            name={user?.name}
            size={58}
            src={user?.profile_image_url}
          />
          <View style={styles.identityText}>
            <Text style={styles.identityLabel}>Tvoj nalog</Text>
            <Text numberOfLines={1} style={styles.identityName}>
              {user?.name || "Student"}
            </Text>
            <Text numberOfLines={1} style={styles.identityMeta}>
              {user?.email || "Profil nije učitan"}
            </Text>
          </View>
        </Pressable>
      }
      eyebrow="StudMate"
      highlights={[
        user?.faculty || "Fakultet nije dodat",
        user?.index_number ? `Indeks ${user.index_number}` : "Indeks nije dodat",
        user?.dorm ? `Dom ${user.dorm}` : "Dom nije dodat",
      ]}
      onRefresh={() => {
        setRefreshing(true);
        loadDashboard().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle="Tvoja obavještenja, pogodnosti i studentske obaveze na jednom mjestu."
      title={`Zdravo, ${user?.name?.split(" ")[0] || "studente"}`}
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}

      <SectionCard
        subtitle="Najvažnije stvari koje te čekaju danas."
        title="Brzi pregled"
      >
        <View style={styles.summaryGrid}>
          <SummaryTile label="Popusti" value={String(data.discounts.length)} />
          <SummaryTile
            label="Stipendije"
            value={String(data.scholarships.length)}
          />
          <SummaryTile label="Menza danas" value={String(data.menu.length)} />
          <SummaryTile
            label="Obavještenja"
            value={String(data.announcements.length)}
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Brzi pristup glavnim modulima i aplikacijama."
        title="Moduli"
      >
        <View style={styles.moduleHeaderRow}>
          <Text style={styles.moduleTitle}>Aplikacijski launcher</Text>
          <Pressable
            onPress={() => setShowModules((current) => !current)}
            style={({ pressed }) => [
              styles.moduleToggleButton,
              pressed ? styles.shortcutPressed : null,
            ]}
          >
            <Text style={styles.moduleToggleText}>
              {showModules ? "Sakrij" : "Prikaži"}
            </Text>
          </Pressable>
        </View>
        {showModules ? (
          <View style={styles.moduleGrid}>
            {shortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.route}
                onPress={() => navigation.navigate(shortcut.route as never)}
                style={({ pressed }) => [
                  styles.moduleItem,
                  pressed ? styles.shortcutPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.shortcutBadge,
                    { backgroundColor: shortcut.badgeBg },
                  ]}
                >
                  <AppIcon
                    name={shortcut.icon}
                    size={22}
                    color={shortcut.badgeColor}
                  />
                </View>
                <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.moduleHint}>
            Pritisni dugme da vidiš sve module i brzo otvoriš željenu stranicu.
          </Text>
        )}
      </SectionCard>

      <SectionCard
        subtitle="Najnovije informacije koje su ti trenutno važne."
        title="Obavještenja"
      >
        {data.announcements.length === 0 ? (
          <EmptyState text="Trenutno nema novih obavještenja." />
        ) : (
          data.announcements.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <InfoBadge value={item.modul || item.kategorija || "StudMate"} />
                <Text style={styles.mutedText}>
                  {formatDate(item.datum_vrijeme)}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{item.naslov}</Text>
              <Text style={styles.cardBody}>{item.opis}</Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard
        subtitle="Aktivne ponude koje su trenutno izdvojene."
        title="Popusti"
      >
        {data.discounts.length === 0 ? (
          <EmptyState text="Nema aktivnih popusta za prikaz." />
        ) : (
          data.discounts.slice(0, 3).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate("Popusti")}
              style={({ pressed }) => [
                styles.listCard,
                pressed ? styles.shortcutPressed : null,
              ]}
            >
              <View style={styles.rowWrap}>
                {item.kategorija ? <InfoBadge value={item.kategorija} /> : null}
                {item.vrijednost ? (
                  <InfoBadge tone="warning" value={item.vrijednost} />
                ) : null}
              </View>
              <Text style={styles.cardTitle}>{item.naslov}</Text>
              <Text style={styles.cardBody}>
                {item.partner_naziv || "Partner"}
                {item.valid_until ? ` - važi do ${formatDate(item.valid_until)}` : ""}
              </Text>
            </Pressable>
          ))
        )}
      </SectionCard>

      <SectionCard
        subtitle="Rokovi koje vrijedi odmah pregledati."
        title="Stipendije"
      >
        {data.scholarships.length === 0 ? (
          <EmptyState text="Nema aktivnih konkursa." />
        ) : (
          data.scholarships.slice(0, 3).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate("Stipendije")}
              style={({ pressed }) => [
                styles.listCard,
                pressed ? styles.shortcutPressed : null,
              ]}
            >
              <View style={styles.rowWrap}>
                <InfoBadge value={item.tip || "Konkurs"} />
              </View>
              <Text style={styles.cardTitle}>{item.naslov}</Text>
              <Text style={styles.cardBody}>
                {item.institucija} - rok {formatDate(item.rok)}
              </Text>
            </Pressable>
          ))
        )}
      </SectionCard>

      <SectionCard
        subtitle="Pregled današnje ponude u menzi."
        title="Menza danas"
      >
        {data.menu.length === 0 ? (
          <EmptyState text="Za danas još nema unesenog menija." />
        ) : (
          data.menu.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate("Menza")}
              style={({ pressed }) => [
                styles.listCard,
                pressed ? styles.shortcutPressed : null,
              ]}
            >
              <View style={styles.rowWrap}>
                <InfoBadge value={mealLabel(item.tip_obroka)} />
              </View>
              <Text style={styles.cardTitle}>{item.naslov}</Text>
              <Text style={styles.cardBody}>{item.opis}</Text>
            </Pressable>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

const styles = StyleSheet.create({
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    maxWidth: 380,
    padding: 14,
  },
  identityLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  identityMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  identityName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  listCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  mutedText: {
    color: "#708194",
    fontSize: 12,
    fontWeight: "600",
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shortcutBadge: {
    alignItems: "center",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  shortcutCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 150,
    padding: 16,
  },
  shortcutCta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  shortcutCtaText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  shortcutDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  moduleHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  moduleHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  moduleItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "31%",
    minHeight: 124,
    justifyContent: "center",
    padding: 14,
    width: "31%",
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  moduleToggleButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  moduleToggleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  shortcutPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  shortcutTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  summaryTile: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: "47%",
    padding: 16,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
