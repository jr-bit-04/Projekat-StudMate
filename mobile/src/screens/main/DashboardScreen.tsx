import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCallback, useEffect, useState } from "react";

import { api, getApiErrorMessage } from "../../api/client";
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
}> = [
  {
    title: "Citaona",
    route: "Citaona",
    description: "Rezervacije, pracenje i status mjesta.",
  },
  {
    title: "Menza",
    route: "Menza",
    description: "Meni, bonovi i obavjestenja.",
  },
  {
    title: "Dom",
    route: "Dom",
    description: "Mjesecne obaveze i novosti doma.",
  },
  {
    title: "Popusti",
    route: "Popusti",
    description: "Aktivne pogodnosti i partneri.",
  },
  {
    title: "Stipendije",
    route: "Stipendije",
    description: "Konkursi, rokovi i detalji prijave.",
  },
  {
    title: "Profil",
    route: "Profil",
    description: "Lozinka, profilna slika i lokacija.",
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
        getApiErrorMessage(error, "Greska pri ucitavanju pocetne stranice.")
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
              {user?.email || "Profil nije ucitan"}
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
      subtitle="Tvoje obavjestenja, pogodnosti i studentske obaveze na jednom mjestu."
      title={`Zdravo, ${user?.name?.split(" ")[0] || "studente"}`}
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}

      <SectionCard
        subtitle="Najvaznije stvari koje te cekaju danas."
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
            label="Obavjestenja"
            value={String(data.announcements.length)}
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Najbrzi put do svakog studentskog modula."
        title="Precice"
      >
        <View style={styles.shortcutGrid}>
          {shortcuts.map((shortcut) => (
            <Pressable
              key={shortcut.route}
              onPress={() => navigation.navigate(shortcut.route as never)}
              style={({ pressed }) => [
                styles.shortcutCard,
                pressed ? styles.shortcutPressed : null,
              ]}
            >
              <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
              <Text style={styles.shortcutDescription}>
                {shortcut.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Najnovije informacije koje su ti trenutno vazne."
        title="Obavjestenja"
      >
        {data.announcements.length === 0 ? (
          <EmptyState text="Trenutno nema novih obavjestenja." />
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
                {item.valid_until ? ` - vazi do ${formatDate(item.valid_until)}` : ""}
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
        subtitle="Pregled danasnje ponude u menzi."
        title="Menza danas"
      >
        {data.menu.length === 0 ? (
          <EmptyState text="Za danas jos nema unesenog menija." />
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
  shortcutCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "100%",
    minHeight: 104,
    padding: 16,
  },
  shortcutDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
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
    fontSize: 18,
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
