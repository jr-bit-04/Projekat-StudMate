import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import stipendijeHero from "../../assets/sections/stipendije.jpg";
import { api, getApiErrorMessage } from "../../api/client";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { colors } from "../../theme/colors";
import { ScholarshipItem } from "../../types/modules";
import { formatDate, formatMoney } from "../../utils/format";

export function StipendijeScreen() {
  const [items, setItems] = useState<ScholarshipItem[]>([]);
  const [search, setSearch] = useState("");
  const [tip, setTip] = useState("all");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadScholarships = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<{ konkursi: ScholarshipItem[] }>("/stipendije");
      setItems(response.data.konkursi || []);
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Greška pri učitavanju stipendija.")
      );
    }
  }, []);

  useEffect(() => {
    setRefreshing(true);
    loadScholarships().finally(() => setRefreshing(false));
  }, [loadScholarships]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (tip !== "all") {
      list = list.filter((item) => item.tip === tip);
    }

    if (search.trim()) {
      const value = search.toLowerCase();
      list = list.filter((item) =>
        [item.naslov, item.institucija, item.opis]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(value))
      );
    }

    return list;
  }, [items, search, tip]);

  return (
    <ScreenShell
      eyebrow="Stipendije"
      highlights={[
        `${filtered.length} aktivnih`,
        tip === "all" ? "Svi konkursi" : tip === "stipendija" ? "Stipendije" : "Krediti",
        search.trim() ? "Filtriran prikaz" : "Cijela lista",
      ]}
      image={stipendijeHero}
      onRefresh={() => {
        setRefreshing(true);
        loadScholarships().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle="Aktivni konkursi za stipendije i kredite."
      title="Konkursi"
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}

      <SectionCard subtitle="Pretraži konkurse po vrsti i ključnim riječima." title="Filter">
        <TextInput
          onChangeText={setSearch}
          placeholder="Pretraga konkursa..."
          placeholderTextColor="#7a8696"
          style={styles.input}
          value={search}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <FilterChip active={tip === "all"} label="Sve" onPress={() => setTip("all")} />
            <FilterChip
              active={tip === "stipendija"}
              label="Stipendije"
              onPress={() => setTip("stipendija")}
            />
            <FilterChip
              active={tip === "kredit"}
              label="Krediti"
              onPress={() => setTip("kredit")}
            />
          </View>
        </ScrollView>
      </SectionCard>

      <SectionCard title="Aktivni konkursi">
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Nema aktivnih konkursa.</Text>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.badgesRow}>
                <InfoBadge value={item.tip || "Konkurs"} />
              </View>
              <Text style={styles.title}>{item.naslov}</Text>
              <Text style={styles.institution}>{item.institucija}</Text>
              <Text style={styles.body}>{item.opis}</Text>

              <View style={styles.metaRow}>
                <MetaLabel label="Rok" value={formatDate(item.rok)} />
                <MetaLabel label="Iznos" value={formatMoney(item.iznos, "Nije navedeno")} />
              </View>

              {item.link ? (
                <Pressable
                  onPress={() => void Linking.openURL(item.link!)}
                  style={({ pressed }) => [
                    styles.linkButton,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.linkButtonText}>Otvori konkurs</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MetaLabel({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaTitle}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.white,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    paddingRight: 12,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  institution: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  linkButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
  },
  linkButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    flex: 1,
    padding: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaTitle: {
    color: "#7a8696",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
});
