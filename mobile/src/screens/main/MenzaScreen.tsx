import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import menzaHero from "../../assets/sections/menza.jpg";
import { api, getApiErrorMessage } from "../../api/client";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { colors } from "../../theme/colors";
import {
  MenzaBonovi,
  MenzaMenuItem,
  NoticeItem,
} from "../../types/modules";
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  getMondayISO,
  getTodayISO,
  getWeekDays,
  mealLabel,
} from "../../utils/format";

const meals = [
  { key: "dorucak", label: "Doručak", time: "08:00 - 10:00" },
  { key: "rucak", label: "Ručak", time: "11:00 - 16:00" },
  { key: "vecera", label: "Večera", time: "17:00 - 19:00" },
] as const;

interface MenzaData {
  meni: MenzaMenuItem[];
  bonovi: MenzaBonovi;
  obavjestenja: NoticeItem[];
}

export function MenzaScreen() {
  const [data, setData] = useState<MenzaData>({
    meni: [],
    bonovi: { dorucak: 0, rucak: 0, vecera: 0, updated_at: null },
    obavjestenja: [],
  });
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedMeal, setSelectedMeal] = useState<"dorucak" | "rucak" | "vecera">(
    "dorucak"
  );
  const [showNotices, setShowNotices] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const weekStart = useMemo(() => getMondayISO(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(), []);

  const loadMenza = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<MenzaData>(`/menza?od=${weekStart}`);
      setData({
        meni: response.data.meni || [],
        bonovi: response.data.bonovi || {
          dorucak: 0,
          rucak: 0,
          vecera: 0,
          updated_at: null,
        },
        obavjestenja: response.data.obavjestenja || [],
      });
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri učitavanju menze."));
    }
  }, [weekStart]);

  useEffect(() => {
    setRefreshing(true);
    loadMenza().finally(() => setRefreshing(false));
  }, [loadMenza]);

  const selectedMenu = data.meni.find(
    (item) =>
      item.datum?.slice(0, 10) === selectedDate && item.tip_obroka === selectedMeal
  );

  return (
    <ScreenShell
      eyebrow="Menza"
      highlights={[
        `${String(data.bonovi?.dorucak ?? 0)} doručak`,
        `${String(data.bonovi?.rucak ?? 0)} ručak`,
        `${String(data.bonovi?.vecera ?? 0)} večera`,
      ]}
      image={menzaHero}
      onRefresh={() => {
        setRefreshing(true);
        loadMenza().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle="Meni, bonovi i obavještenja studentske menze."
      title="Menza i bonovi"
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}

      <SectionCard subtitle="Pregled bonova po obroku." title="Bonovi">
        <View style={styles.ticketRow}>
          {meals.map((meal) => (
            <View key={meal.key} style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>{meal.label}</Text>
              <Text style={styles.ticketTime}>{meal.time}</Text>
              <Text style={styles.ticketCount}>
                {String(data.bonovi?.[meal.key] ?? 0)}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.helperText}>
          Bonovi ističu 10-og u mjesecu. Posljednje ažurirano:{" "}
          {formatDateTime(data.bonovi?.updated_at, "nije dostupno")}
        </Text>
      </SectionCard>

      <SectionCard
        right={
          <Pressable onPress={() => setShowNotices((value) => !value)}>
            <Text style={styles.linkText}>
              {showNotices ? "Sakrij" : "Prikaži"}
            </Text>
          </Pressable>
        }
        subtitle="Obavještenja sa menza modula."
        title="Obavještenja"
      >
        {showNotices ? (
          data.obavjestenja.length === 0 ? (
            <Text style={styles.emptyText}>Trenutno nema obavještenja za menzu.</Text>
          ) : (
            data.obavjestenja.map((item) => (
              <View key={item.id} style={styles.noticeCard}>
                <View style={styles.rowBetween}>
                  <InfoBadge value={item.kategorija || "Menza"} />
                  <Text style={styles.mutedText}>
                    {formatDate(item.datum_vrijeme)}
                  </Text>
                </View>
                <Text style={styles.noticeTitle}>{item.naslov}</Text>
                <Text style={styles.noticeBody}>{item.opis}</Text>
              </View>
            ))
          )
        ) : (
          <Text style={styles.emptyText}>
            Dodirni "Prikaži" da otvoriš obavještenja.
          </Text>
        )}
      </SectionCard>

      <SectionCard subtitle="Izaberi dan u sedmici." title="Sedmični pregled">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dayRow}>
            {weekDays.map((day) => {
              const active = selectedDate === day.iso;
              return (
                <Pressable
                  key={day.iso}
                  onPress={() => setSelectedDate(day.iso)}
                  style={({ pressed }) => [
                    styles.dayChip,
                    active ? styles.dayChipActive : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.dayName, active ? styles.dayNameActive : null]}>
                    {day.name}
                  </Text>
                  <Text style={[styles.dayDate, active ? styles.dayNameActive : null]}>
                    {formatDate(day.iso)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.mealSwitch}>
          {meals.map((meal) => (
            <Pressable
              key={meal.key}
              onPress={() => setSelectedMeal(meal.key)}
              style={({ pressed }) => [
                styles.mealButton,
                selectedMeal === meal.key ? styles.mealButtonActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.mealButtonText,
                  selectedMeal === meal.key ? styles.mealButtonTextActive : null,
                ]}
              >
                {meal.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={formatDateLong(selectedDate)}
        title={mealLabel(selectedMeal)}
      >
        {selectedMeal === "dorucak" ? (
          <View style={styles.foodColumn}>
            {normalizeBreakfastItems(selectedMenu?.dorucak_stavke).length === 0 ? (
              <Text style={styles.emptyText}>Nema unosa za doručak.</Text>
            ) : (
              normalizeBreakfastItems(selectedMenu?.dorucak_stavke).map(
                (item, index) => (
                  <View key={`${item.naziv}-${index}`} style={styles.breakfastCard}>
                    <Text style={styles.noticeTitle}>{item.naziv}</Text>
                    <Text style={styles.cardMeta}>
                      {item.bonovi || 1} bon • {item.cijena || "1.20 EUR"}
                    </Text>
                  </View>
                )
              )
            )}
          </View>
        ) : (
          <View style={styles.menuColumns}>
            <FoodGroup items={selectedMenu?.glavna_jela || []} title="Glavna jela" />
            <FoodGroup items={selectedMenu?.prilozi || []} title="Prilozi" />
            <FoodGroup items={selectedMenu?.salate || []} title="Salate" />
            <FoodGroup items={selectedMenu?.dodatno || []} title="Dodatno" />
          </View>
        )}
      </SectionCard>
    </ScreenShell>
  );
}

function normalizeBreakfastItems(items?: MenzaMenuItem["dorucak_stavke"]) {
  return (items || []).map((item) =>
    typeof item === "string"
      ? { naziv: item, bonovi: 1, cijena: "1.20 EUR" }
      : item
  );
}

function FoodGroup({ items, title }: { items: string[]; title: string }) {
  return (
    <View style={styles.foodColumn}>
      <Text style={styles.foodTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nema unosa.</Text>
      ) : (
        items.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.foodItem}>
            <Text style={styles.noticeBody}>{item}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  breakfastCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  cardMeta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  dayChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 116,
    padding: 14,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  dayName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  dayNameActive: {
    color: colors.white,
  },
  dayRow: {
    flexDirection: "row",
    paddingRight: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  foodColumn: {
    gap: 10,
  },
  foodItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  foodTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  mealButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  mealButtonActive: {
    backgroundColor: colors.primary,
  },
  mealButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  mealButtonTextActive: {
    color: colors.white,
  },
  mealSwitch: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    padding: 6,
  },
  menuColumns: {
    gap: 14,
  },
  mutedText: {
    color: "#708194",
    fontSize: 12,
    fontWeight: "600",
  },
  noticeBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  noticeCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: "30%",
    padding: 14,
  },
  ticketCount: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },
  ticketRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ticketTime: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  ticketTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
});
