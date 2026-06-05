import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import popustiHero from "../../assets/sections/popusti.png";
import { api, getApiErrorMessage } from "../../api/client";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { DiscountItem, PartnerItem } from "../../types/modules";
import { colors } from "../../theme/colors";
import {
  formatDate,
  isExpired,
  normalizeUrl,
} from "../../utils/format";

export function PopustiScreen() {
  const [popusti, setPopusti] = useState<DiscountItem[]>([]);
  const [partneri, setPartneri] = useState<PartnerItem[]>([]);
  const [selected, setSelected] = useState<DiscountItem | null>(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showExpired, setShowExpired] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadPopusti = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<{
        popusti: DiscountItem[];
        partneri: PartnerItem[];
      }>("/popusti");

      setPopusti(response.data.popusti || []);
      setPartneri(response.data.partneri || []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri učitavanju popusta."));
    }
  }, []);

  useEffect(() => {
    setRefreshing(true);
    loadPopusti().finally(() => setRefreshing(false));
  }, [loadPopusti]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        popusti
          .map((item) => item.kategorija)
          .filter((value): value is string => Boolean(value))
      ),
    ];
  }, [popusti]);

  const filteredPopusti = useMemo(() => {
    let next = [...popusti];

    if (!showExpired) {
      next = next.filter((item) => !isExpired(item.valid_until));
    }

    if (category !== "all") {
      next = next.filter((item) => item.kategorija === category);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      next = next.filter((item) =>
        [
          item.naslov,
          item.opis,
          item.partner_naziv,
          item.kategorija,
          item.vrijednost,
          item.kod,
          item.lokacija,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      );
    }

    return next.sort((a, b) => {
      if (!a.valid_until) return 1;
      if (!b.valid_until) return -1;
      return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
    });
  }, [category, popusti, search, showExpired]);

  return (
    <>
      <ScreenShell
        eyebrow="Popusti"
        highlights={[
          `${filteredPopusti.length} ponuda`,
          `${partneri.length} partnera`,
          showExpired ? "Sa isteklim ponudama" : "Samo aktivne ponude",
        ]}
        image={popustiHero}
        onRefresh={() => {
          setRefreshing(true);
          loadPopusti().finally(() => setRefreshing(false));
        }}
        refreshing={refreshing}
        subtitle="Aktivne studentske pogodnosti i partnerske ponude."
        title="Studentski popusti"
      >
        {message ? <StatusBanner text={message} tone="danger" /> : null}

        <SectionCard subtitle="Pretraži i izdvoji ponude koje te zanimaju." title="Pretraga">
          <TextInput
            onChangeText={setSearch}
            placeholder="Partner ili ključna riječ..."
            placeholderTextColor="#7a8696"
            style={styles.input}
            value={search}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <FilterChip
                active={category === "all"}
                label="Sve"
                onPress={() => setCategory("all")}
              />
              {categories.map((item) => (
                <FilterChip
                  key={item}
                  active={category === item}
                  label={item}
                  onPress={() => setCategory(item)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Prikaži istekle ponude</Text>
            <Switch
              onValueChange={setShowExpired}
              trackColor={{ false: "#d3d6dc", true: colors.primary }}
              value={showExpired}
            />
          </View>
        </SectionCard>

        <SectionCard title="Ponude">
          {filteredPopusti.length === 0 ? (
            <Text style={styles.emptyText}>Nema pronađenih popusta.</Text>
          ) : (
            filteredPopusti.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item)}
                style={({ pressed }) => [
                  styles.discountCard,
                  isExpired(item.valid_until) ? styles.discountExpired : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.badgesRow}>
                  {item.kategorija ? <InfoBadge value={item.kategorija} /> : null}
                  {item.vrijednost ? (
                    <InfoBadge tone="warning" value={item.vrijednost} />
                  ) : null}
                </View>
                <Text style={styles.cardTitle}>{item.naslov}</Text>
                <Text style={styles.partnerName}>
                  {item.partner_naziv || "Partner"}
                </Text>
                <Text style={styles.cardBody} numberOfLines={3}>
                  {item.opis}
                </Text>
                <Text style={styles.expiryText}>
                  {item.valid_until
                    ? `Važi do ${formatDate(item.valid_until)}`
                    : "Trajna ponuda"}
                </Text>
              </Pressable>
            ))
          )}
        </SectionCard>

        <SectionCard title="Partneri">
          {partneri.length === 0 ? (
            <Text style={styles.emptyText}>Nema aktivnih partnera.</Text>
          ) : (
            partneri.map((partner) => {
              const website = normalizeUrl(partner.website);

              return (
                <Pressable
                  key={partner.id}
                  disabled={!website}
                  onPress={() => website && void Linking.openURL(website)}
                  style={({ pressed }) => [
                    styles.partnerCard,
                    pressed && website ? styles.pressed : null,
                    !website ? styles.partnerMuted : null,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{partner.naziv}</Text>
                    <Text style={styles.cardBody}>
                      {website || "Link nije dostupan"}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </SectionCard>
      </ScreenShell>

      <Modal
        animationType="slide"
        onRequestClose={() => setSelected(null)}
        transparent
        visible={Boolean(selected)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable onPress={() => setSelected(null)} style={styles.closeButton}>
                <Text style={styles.closeText}>Zatvori</Text>
              </Pressable>
              {selected ? (
                <>
                  <View style={styles.badgesRow}>
                    {selected.kategorija ? (
                      <InfoBadge value={selected.kategorija} />
                    ) : null}
                    {selected.vrijednost ? (
                      <InfoBadge tone="warning" value={selected.vrijednost} />
                    ) : null}
                  </View>
                  <Text style={styles.modalTitle}>{selected.naslov}</Text>
                  <Text style={styles.partnerName}>
                    {selected.partner_naziv || "Partner"}
                  </Text>

                  <View style={styles.detailBlock}>
                    <DetailRow
                      label="Period"
                      value={
                        selected.valid_until
                          ? `${formatDate(selected.valid_from)} - ${formatDate(selected.valid_until)}`
                          : "Trajna ponuda"
                      }
                    />
                    {selected.lokacija ? (
                      <DetailRow label="Lokacija" value={selected.lokacija} />
                    ) : null}
                    {selected.kod ? (
                      <DetailRow label="Kod popusta" value={selected.kod} />
                    ) : null}
                  </View>

                  <Text style={styles.modalSectionTitle}>Opis i uslovi</Text>
                  <Text style={styles.cardBody}>{selected.opis}</Text>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
        styles.filterChip,
        active ? styles.filterChipActive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  closeText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  detailBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 18,
    overflow: "hidden",
  },
  detailLabel: {
    color: "#7a8696",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 5,
    padding: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  discountCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  discountExpired: {
    opacity: 0.68,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  expiryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: colors.white,
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
  modalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    padding: 20,
  },
  modalSectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 14,
  },
  partnerCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  partnerMuted: {
    opacity: 0.7,
  },
  partnerName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
