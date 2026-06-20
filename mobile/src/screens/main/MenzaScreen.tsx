import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

import menzaHero from "../../assets/sections/menza.jpg";
import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { useAuth } from "../../context/AuthContext";
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

type MealKey = "dorucak" | "rucak" | "vecera";
type MessageTone = "danger" | "info" | "success" | "warning";
type VoucherCounts = {
  dorucak: number;
  rucak: number;
  vecera: number;
};

const meals = [
  { key: "dorucak", label: "Dorucak", time: "08:00-10:00" },
  { key: "rucak", label: "Rucak", time: "11:00-16:00" },
  { key: "vecera", label: "Vecera", time: "17:00-19:00" },
] as const;

const emptyBonovi: MenzaBonovi = {
  dorucak: 0,
  rucak: 0,
  vecera: 0,
  updated_at: null,
};

const initialPurchaseForm = {
  dorucak: "",
  rucak: "",
  vecera: "",
  cardNumber: "",
  cvv: "",
  expiryDate: "",
};

interface MenzaData {
  meni: MenzaMenuItem[];
  bonovi: MenzaBonovi;
  obavjestenja: NoticeItem[];
  prodaja: MenzaVoucherAvailability;
}

interface MenzaVoucherAvailability {
  mjesec?: string | null;
  limit_po_obroku: number;
  prodato: VoucherCounts;
  preostalo: VoucherCounts;
}

interface MenzaDataResponse {
  meni?: MenzaMenuItem[];
  bonovi?: MenzaBonovi;
  obavjestenja?: NoticeItem[];
  prodaja?: MenzaVoucherAvailability;
}

interface PurchaseErrorResponse {
  allowedPurchase?: Partial<VoucherCounts>;
  error?: string;
  message?: string;
  prodaja?: MenzaVoucherAvailability;
}

function getDefaultProdaja(): MenzaVoucherAvailability {
  return {
    mjesec: null,
    limit_po_obroku: 500,
    prodato: {
      dorucak: 0,
      rucak: 0,
      vecera: 0,
    },
    preostalo: {
      dorucak: 500,
      rucak: 500,
      vecera: 500,
    },
  };
}

export function MenzaScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<MenzaData>({
    meni: [],
    bonovi: emptyBonovi,
    obavjestenja: [],
    prodaja: getDefaultProdaja(),
  });
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedMeal, setSelectedMeal] = useState<MealKey>("dorucak");
  const [showNotices, setShowNotices] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("danger");
  const [refreshing, setRefreshing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [purchaseMessageTone, setPurchaseMessageTone] =
    useState<MessageTone>("danger");
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const weekStart = useMemo(() => getMondayISO(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(), []);

  const loadMenza = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<MenzaDataResponse>(`/menza?od=${weekStart}`);
      setData({
        meni: response.data.meni || [],
        bonovi: response.data.bonovi || emptyBonovi,
        obavjestenja: response.data.obavjestenja || [],
        prodaja: response.data.prodaja || getDefaultProdaja(),
      });
    } catch (error) {
      setMessageTone("danger");
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju menze."));
    }
  }, [weekStart]);

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      loadMenza().finally(() => setRefreshing(false));
    }, [loadMenza])
  );

  const selectedMenu = data.meni.find(
    (item) =>
      item.datum?.slice(0, 10) === selectedDate && item.tip_obroka === selectedMeal
  );

  const breakfastItems = normalizeBreakfastItems(selectedMenu?.dorucak_stavke);

  function updatePurchaseField(
    field: keyof typeof initialPurchaseForm,
    value: string
  ) {
    setPurchaseForm((current) => ({ ...current, [field]: value }));
  }

  function closePurchaseModal() {
    setShowPurchaseModal(false);
    setPurchaseMessage("");
    setPurchaseMessageTone("danger");
  }

  function validatePurchaseForm() {
    const dorucak = parseVoucherValue(purchaseForm.dorucak);
    const rucak = parseVoucherValue(purchaseForm.rucak);
    const vecera = parseVoucherValue(purchaseForm.vecera);

    if (
      dorucak === null ||
      rucak === null ||
      vecera === null
    ) {
      return "Broj bonova mora biti cio broj jednak ili veci od nule.";
    }

    if (dorucak + rucak + vecera === 0) {
      return "Unesi broj bonova za bar jedan obrok.";
    }

    if (purchaseForm.cardNumber.length !== 12) {
      return "Broj kartice mora imati 12 cifara.";
    }

    if (purchaseForm.cvv.length !== 3) {
      return "CVV mora imati 3 cifre.";
    }

    if (!isValidExpiryInput(purchaseForm.expiryDate)) {
      return "Datum isteka unesi u formatu MM/YY.";
    }

    return "";
  }

  function applyAllowedPurchase(allowedPurchase?: Partial<VoucherCounts>) {
    setPurchaseForm((current) => ({
      ...current,
      dorucak: stringifySuggestedCount(allowedPurchase?.dorucak),
      rucak: stringifySuggestedCount(allowedPurchase?.rucak),
      vecera: stringifySuggestedCount(allowedPurchase?.vecera),
    }));
  }

  function openPurchaseModal() {
    setPurchaseMessage("");
    setPurchaseMessageTone("danger");
    setShowPurchaseModal(true);
  }

  async function purchaseBonovi() {
    const validationMessage = validatePurchaseForm();

    if (validationMessage) {
      setPurchaseMessageTone("danger");
      setPurchaseMessage(validationMessage);
      return;
    }

    try {
      setIsPurchasing(true);
      setPurchaseMessage("");

      const response = await api.post<{
        bonovi?: MenzaBonovi;
        message?: string;
        prodaja?: MenzaVoucherAvailability;
      }>(
        "/menza/bonovi/kupovina",
        {
          dorucak: Number(purchaseForm.dorucak || 0),
          rucak: Number(purchaseForm.rucak || 0),
          vecera: Number(purchaseForm.vecera || 0),
          cardNumber: purchaseForm.cardNumber,
          cvv: purchaseForm.cvv,
          expiryDate: purchaseForm.expiryDate,
        }
      );

      setData((current) => ({
        ...current,
        bonovi: response.data.bonovi || current.bonovi,
        prodaja: response.data.prodaja || current.prodaja,
      }));
      setPurchaseForm(initialPurchaseForm);
      setMessage("");
      closePurchaseModal();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | PurchaseErrorResponse
          | undefined;

        if (error.response?.status === 409 && responseData?.allowedPurchase) {
          applyAllowedPurchase(responseData.allowedPurchase);
          setPurchaseMessageTone("warning");
        } else {
          setPurchaseMessageTone("danger");
        }

        if (responseData?.prodaja) {
          setData((current) => ({
            ...current,
            prodaja: responseData.prodaja || current.prodaja,
          }));
        }
      } else {
        setPurchaseMessageTone("danger");
      }

      setPurchaseMessage(
        getApiErrorMessage(error, "Greska pri simulaciji kupovine bonova.")
      );
    } finally {
      setIsPurchasing(false);
    }
  }

  return (
    <>
      <ScreenShell
        eyebrow="Menza"
        image={menzaHero}
        onRefresh={() => {
          setRefreshing(true);
          loadMenza().finally(() => setRefreshing(false));
        }}
        refreshing={refreshing}
        subtitle="Meni, bonovi i obavjestenja studentske menze."
        title="Menza i bonovi"
      >
        {message ? <StatusBanner text={message} tone={messageTone} /> : null}

        <SectionCard
          subtitle="Pregled bonova po obroku i simulirana kupovina."
          title="Bonovi"
        >
          <View style={styles.ticketRow}>
            {meals.map((meal) => (
              <View key={meal.key} style={styles.ticketCard}>
                <Text style={styles.ticketTitle}>{meal.label}</Text>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={styles.ticketTime}
                >
                  {meal.time}
                </Text>
                <Text style={styles.ticketCount}>
                  {String(data.bonovi?.[meal.key] ?? 0)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.helperText}>
            Bonovi isticu 10-og u mjesecu. Posljednje azurirano:{" "}
            {formatDateTime(data.bonovi?.updated_at, "nije dostupno")}
          </Text>

          {user?.role === "student" ? (
            <Pressable
              onPress={openPurchaseModal}
              style={({ pressed }) => [
                styles.purchaseCta,
                pressed ? styles.purchaseCtaPressed : null,
              ]}
            >
              <View style={styles.purchaseCtaBadge}>
                <Text style={styles.purchaseCtaBadgeText}>Kupovina bonova</Text>
              </View>
              <Text style={styles.purchaseCtaTitle}>Kupi bonove</Text>
              <Text style={styles.purchaseCtaText}>
                Otvori formu za dorucak, rucak i veceru i odmah dopuni stanje
                svog naloga.
              </Text>
              <View style={styles.purchaseCtaFooter}>
                <View style={styles.purchaseCtaChip}>
                  <Text style={styles.purchaseCtaChipText}>Otvori uplatu</Text>
                </View>
              </View>
            </Pressable>
          ) : null}
        </SectionCard>

        <SectionCard
          right={
            <Pressable onPress={() => setShowNotices((value) => !value)}>
              <Text style={styles.linkText}>
                {showNotices ? "Sakrij" : "Prikazi"}
              </Text>
            </Pressable>
          }
          subtitle="Obavjestenja sa menza modula."
          title="Obavjestenja"
        >
          {showNotices ? (
            data.obavjestenja.length === 0 ? (
              <Text style={styles.emptyText}>Trenutno nema obavjestenja za menzu.</Text>
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
              Dodirni "Prikazi" da otvoris obavjestenja.
            </Text>
          )}
        </SectionCard>

        <SectionCard subtitle="Izaberi dan u sedmici." title="Sedmicni pregled">
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
              {breakfastItems.length === 0 ? (
                <Text style={styles.emptyText}>Nema unosa za dorucak.</Text>
              ) : (
                breakfastItems.map((item, index) => (
                  <View key={`${item.naziv}-${index}`} style={styles.breakfastCard}>
                    <Text style={styles.noticeTitle}>{item.naziv}</Text>
                    <Text style={styles.cardMeta}>
                      {item.bonovi || 1} bon | {item.cijena || "1.20 EUR"}
                    </Text>
                  </View>
                ))
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

      <Modal
        animationType="slide"
        onRequestClose={closePurchaseModal}
        transparent
        visible={showPurchaseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Simulacija kupovine bonova</Text>
                  <Text style={styles.modalSubtitle}>
                    Unesi broj bonova po obroku i validne podatke kartice.
                  </Text>
                </View>
                <Pressable onPress={closePurchaseModal} style={styles.closeButton}>
                  <Text style={styles.closeText}>Zatvori</Text>
                </Pressable>
              </View>

              {purchaseMessage ? (
                <StatusBanner text={purchaseMessage} tone={purchaseMessageTone} />
              ) : null}

              <Text style={styles.modalSectionTitle}>Bonovi za uplatu</Text>
              <View style={styles.voucherGrid}>
                <VoucherField
                  label="Dorucak"
                  onChangeText={(value) =>
                    updatePurchaseField("dorucak", normalizeCountInput(value))
                  }
                  value={purchaseForm.dorucak}
                />
                <VoucherField
                  label="Rucak"
                  onChangeText={(value) =>
                    updatePurchaseField("rucak", normalizeCountInput(value))
                  }
                  value={purchaseForm.rucak}
                />
                <VoucherField
                  label="Vecera"
                  onChangeText={(value) =>
                    updatePurchaseField("vecera", normalizeCountInput(value))
                  }
                  value={purchaseForm.vecera}
                />
              </View>

              <Text style={styles.modalSectionTitle}>Podaci kartice</Text>
              <FieldBlock label="Broj kartice (12 cifara)">
                <TextInput
                  keyboardType="number-pad"
                  maxLength={12}
                  onChangeText={(value) =>
                    updatePurchaseField("cardNumber", normalizeCardNumberInput(value))
                  }
                  placeholder="123456789012"
                  placeholderTextColor={colors.textSoft}
                  style={styles.input}
                  value={purchaseForm.cardNumber}
                />
              </FieldBlock>

              <View style={styles.cardMetaRow}>
                <FieldBlock compact label="CVV">
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={3}
                    onChangeText={(value) =>
                      updatePurchaseField("cvv", normalizeCardNumberInput(value, 3))
                    }
                    placeholder="123"
                    placeholderTextColor={colors.textSoft}
                    style={styles.input}
                    value={purchaseForm.cvv}
                  />
                </FieldBlock>

                <FieldBlock compact label="Datum isteka">
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={5}
                    onChangeText={(value) =>
                      updatePurchaseField("expiryDate", normalizeExpiryInput(value))
                    }
                    placeholder="MM/YY"
                    placeholderTextColor={colors.textSoft}
                    style={styles.input}
                    value={purchaseForm.expiryDate}
                  />
                </FieldBlock>
              </View>

              <Text style={styles.modalHelperText}>
                Ovo je simulacija placanja. Kartica se ne cuva, vec samo sluzi za validaciju forme.
              </Text>

              <View style={styles.modalActionRow}>
                <View style={styles.modalAction}>
                  <AppButton
                    label="Odustani"
                    onPress={closePurchaseModal}
                    variant="secondary"
                  />
                </View>
                <View style={styles.modalAction}>
                  <AppButton
                    disabled={isPurchasing}
                    label={isPurchasing ? "Kupovina..." : "Kupi"}
                    loading={isPurchasing}
                    onPress={purchaseBonovi}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function normalizeBreakfastItems(items?: MenzaMenuItem["dorucak_stavke"]) {
  return (items || []).map((item) =>
    typeof item === "string"
      ? { naziv: item, bonovi: 1, cijena: "1.20 EUR" }
      : item
  );
}

function normalizeCountInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

function parseVoucherValue(value: string) {
  const normalized = value === "" ? 0 : Number(value);

  if (!Number.isInteger(normalized) || normalized < 0) {
    return null;
  }

  return normalized;
}

function stringifySuggestedCount(value?: number) {
  if (typeof value !== "number") {
    return "";
  }

  return String(value);
}

function normalizeCardNumberInput(value: string, maxLength = 12) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeExpiryInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidExpiryInput(value: string) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
    return false;
  }

  const [month, year] = value.split("/");
  const expiry = new Date(
    2000 + Number(year),
    Number(month),
    0,
    23,
    59,
    59,
    999
  );

  return expiry >= new Date();
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

function VoucherField({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.voucherField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType="number-pad"
        maxLength={3}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={colors.textSoft}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function FieldBlock({
  children,
  compact = false,
  label,
}: {
  children: ReactNode;
  compact?: boolean;
  label: string;
}) {
  return (
    <View style={compact ? styles.compactFieldBlock : styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
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
  cardMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  closeButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  closeText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  compactFieldBlock: {
    flex: 1,
    gap: 6,
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
  fieldBlock: {
    gap: 6,
    marginBottom: 12,
  },
  fieldLabel: {
    color: "#7A8696",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
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
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
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
  modalAction: {
    flex: 1,
    minWidth: 140,
  },
  modalActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
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
    maxHeight: "88%",
    padding: 20,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalHelperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  modalSectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 8,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
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
  purchaseHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  purchaseCta: {
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
  purchaseCtaBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  purchaseCtaBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  purchaseCtaChip: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  purchaseCtaChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  purchaseCtaFooter: {
    alignItems: "flex-start",
    marginTop: 16,
  },
  purchaseCtaPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  purchaseCtaText: {
    color: "rgba(255, 255, 255, 0.84)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  purchaseCtaTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
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
    fontSize: 11,
    marginTop: 6,
  },
  ticketTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  voucherField: {
    flex: 1,
    gap: 6,
    minWidth: 92,
  },
  voucherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
});



