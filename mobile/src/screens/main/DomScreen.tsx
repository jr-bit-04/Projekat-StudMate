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
import axios from "axios";

import domHero from "../../assets/sections/dom.jpg";
import { api, getApiErrorMessage } from "../../api/client";
import { ActionCtaCard } from "../../components/ActionCtaCard";
import { AppButton } from "../../components/AppButton";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { DomObligation, NoticeItem } from "../../types/modules";
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from "../../utils/format";

const months = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

const DOM_MONTHLY_PRICE = 30;
const initialPaymentForm = {
  months: [] as string[],
  cardNumber: "",
  cvv: "",
  expiryDate: "",
};

type MessageTone = "danger" | "info" | "success" | "warning";

export function DomScreen() {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<DomObligation[]>([]);
  const [obavjestenja, setObavjestenja] = useState<NoticeItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState(DOM_MONTHLY_PRICE);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [showNotices, setShowNotices] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentMessageTone, setPaymentMessageTone] =
    useState<MessageTone>("danger");
  const [isPaying, setIsPaying] = useState(false);

  const loadDom = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<{
        obligations: DomObligation[];
        obavjestenja: NoticeItem[];
        lastUpdated: string | null;
        monthlyPrice?: number;
        currentYear?: number;
      }>("/dom");

      setObligations(response.data.obligations || []);
      setObavjestenja(response.data.obavjestenja || []);
      setLastUpdated(response.data.lastUpdated || null);
      setMonthlyPrice(response.data.monthlyPrice || DOM_MONTHLY_PRICE);
      setCurrentYear(response.data.currentYear || new Date().getFullYear());
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri učitavanju doma."));
    }
  }, []);

  useEffect(() => {
    setRefreshing(true);
    loadDom().finally(() => setRefreshing(false));
  }, [loadDom]);

  const selectedObligation = useMemo(
    () =>
      obligations.find(
        (item) =>
          Number(item.godina) === Number(currentYear) &&
          normalizeMonth(item.mjesec) === normalizeMonth(selectedMonth)
      ),
    [currentYear, obligations, selectedMonth]
  );

  const monthlyObligations = useMemo(
    () =>
      months.reduce<Record<string, DomObligation | null>>((accumulator, month) => {
        const obligation =
          obligations.find(
            (item) =>
              Number(item.godina) === Number(currentYear) &&
              normalizeMonth(item.mjesec) === normalizeMonth(month)
          ) || null;

        accumulator[month] = obligation;
        return accumulator;
      }, {}),
    [currentYear, obligations]
  );

  const totalPaymentAmount = paymentForm.months.length * monthlyPrice;

  function updatePaymentField(
    field: keyof typeof initialPaymentForm,
    value: string | string[]
  ) {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  }

  function openPaymentModal() {
    setPaymentMessage("");
    setPaymentMessageTone("danger");
    setPaymentForm(initialPaymentForm);
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setPaymentMessage("");
    setPaymentMessageTone("danger");
  }

  function togglePaymentMonth(month: string) {
    const obligation = monthlyObligations[month];
    const status = String(obligation?.status || "").toLowerCase();

    if (status === "paid" || status === "inactive") {
      return;
    }

    setPaymentForm((current) => ({
      ...current,
      months: current.months.includes(month)
        ? current.months.filter((item) => item !== month)
        : [...current.months, month],
    }));
  }

  function validatePaymentForm() {
    if (paymentForm.months.length === 0) {
      return "Izaberi bar jedan mjesec za uplatu doma.";
    }

    if (paymentForm.cardNumber.length !== 12) {
      return "Broj kartice mora imati 12 cifara.";
    }

    if (paymentForm.cvv.length !== 3) {
      return "CVV mora imati 3 cifre.";
    }

    if (!isValidExpiryInput(paymentForm.expiryDate)) {
      return "Datum isteka unesi u formatu MM/YY.";
    }

    return "";
  }

  async function payDorm() {
    const validationMessage = validatePaymentForm();

    if (validationMessage) {
      setPaymentMessageTone("danger");
      setPaymentMessage(validationMessage);
      return;
    }

    try {
      setIsPaying(true);
      setPaymentMessage("");

      const response = await api.post<{
        obligations?: DomObligation[];
        lastUpdated?: string | null;
        monthlyPrice?: number;
        currentYear?: number;
        paidMonths?: string[];
      }>("/dom/placanje", {
        months: paymentForm.months,
        cardNumber: paymentForm.cardNumber,
        cvv: paymentForm.cvv,
        expiryDate: paymentForm.expiryDate,
      });

      setObligations(response.data.obligations || []);
      setLastUpdated(response.data.lastUpdated || null);
      setMonthlyPrice(response.data.monthlyPrice || DOM_MONTHLY_PRICE);
      setCurrentYear(response.data.currentYear || new Date().getFullYear());
      setSelectedMonth(response.data.paidMonths?.[0] || selectedMonth);
      closePaymentModal();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | { conflictingMonths?: string[]; message?: string }
          | undefined;

        if (
          error.response?.status === 409 &&
          Array.isArray(responseData?.conflictingMonths)
        ) {
          setPaymentForm((current) => ({
            ...current,
            months: current.months.filter(
              (month) => !responseData.conflictingMonths?.includes(month)
            ),
          }));
          setPaymentMessageTone("warning");
        } else {
          setPaymentMessageTone("danger");
        }
      } else {
        setPaymentMessageTone("danger");
      }

      setPaymentMessage(
        getApiErrorMessage(error, "Greska pri simulaciji placanja doma.")
      );
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <ScreenShell
      eyebrow="Studentski dom"
      highlights={[
        user?.dorm || "Dom nije dodat",
        selectedMonth,
        selectedObligation ? formatStatus(selectedObligation.status) : "Bez obaveze",
      ]}
      image={domHero}
      onRefresh={() => {
        setRefreshing(true);
        loadDom().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle="Mjesečne obaveze i obavještenja doma."
      title="Dom i obaveze"
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}

      <SectionCard subtitle="Tvoj osnovni studentski dom pregled." title="Pregled">
        <View style={styles.infoGrid}>
          <InfoTile label="Dom" value={user?.dorm || "Nije dodijeljen"} />
          <InfoTile
            label="Posljednje ažuriranje"
            value={formatDateTime(lastUpdated, "Nije dostupno")}
          />
        </View>
      </SectionCard>

      {user?.role === "student" ? (
        <SectionCard
          subtitle={`Cijena doma je fiksna i iznosi ${formatMoney(
            monthlyPrice
          )} po mjesecu za ${currentYear}.`}
          title="Placanje doma"
        >
          <ActionCtaCard
            badge="Placanje doma"
            chipLabel={`${formatMoney(monthlyPrice)} po mjesecu`}
            description={`Izaberi jedan ili vise mjeseci za ${currentYear} i odmah otvori formu za karticu.`}
            onPress={openPaymentModal}
            title="Plati dom"
          />
        </SectionCard>
      ) : null}

      <SectionCard
        right={
          <Pressable onPress={() => setShowNotices((value) => !value)}>
            <Text style={styles.linkText}>
              {showNotices ? "Sakrij" : "Prikaži"}
            </Text>
          </Pressable>
        }
        subtitle="Najnovije informacije vezane za dom."
        title="Obavještenja"
      >
        {showNotices ? (
          obavjestenja.length === 0 ? (
            <Text style={styles.emptyText}>Trenutno nema obavještenja za dom.</Text>
          ) : (
            obavjestenja.map((item) => (
              <View key={item.id} style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <InfoBadge value={item.kategorija || "Dom"} />
                  <Text style={styles.mutedText}>{formatDate(item.datum_vrijeme)}</Text>
                </View>
                <Text style={styles.noticeTitle}>{item.naslov}</Text>
                <Text style={styles.noticeBody}>{item.opis}</Text>
              </View>
            ))
          )
        ) : (
          <Text style={styles.emptyText}>
            Dodirni "Prikaži" da otvoriš obavještenja doma.
          </Text>
        )}
      </SectionCard>

      <SectionCard subtitle="Pregled obaveza i statusa po mjesecima." title="Pregled po mjesecima">
        <View style={styles.legendRow}>
          <LegendChip tone="danger" text="Neplaćeno" />
          <LegendChip tone="success" text="Plaćeno" />
          <LegendChip tone="primary" text="Ne boravi" />
        </View>

        <View style={styles.monthGrid}>
          {months.map((month) => {
            const obligation = monthlyObligations[month];
            const status = obligation?.status || "default";
            const active = selectedMonth === month;

            return (
              <Pressable
                key={month}
                onPress={() => setSelectedMonth(month)}
                style={({ pressed }) => [
                  styles.monthCard,
                  monthTone(status),
                  active ? styles.monthActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={styles.monthText}
                >
                  {month}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Detalji obaveze za izabrani mjesec."
        title={`${selectedMonth} ${currentYear}`}
      >
        <DetailRow label="Period" value={getPeriod(selectedObligation)} />
        <DetailRow label="Status" value={formatStatus(selectedObligation?.status)} />
        <DetailRow label="Iznos" value={formatMoney(selectedObligation?.iznos, "Nije dostupno")} />
        <DetailRow label="Uplaćeno" value={formatMoney(selectedObligation?.uplaceno, "Nije dostupno")} />
        <DetailRow
          label="Datum uplate"
          value={formatDateTime(selectedObligation?.paid_at, "Nije plaćeno")}
        />
        <DetailRow
          label="Rok za uplatu"
          value={formatDate(selectedObligation?.due_date, "Nije dostupno")}
        />
        <DetailRow
          label="Posljednje ažurirano"
          value={formatDateTime(selectedObligation?.updated_at, "Nije dostupno")}
        />
      </SectionCard>

      <Modal
        animationType="slide"
        onRequestClose={closePaymentModal}
        transparent
        visible={showPaymentModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalEyebrow}>Online uplata</Text>
                  <Text style={styles.modalTitle}>Placanje doma</Text>
                  <Text style={styles.modalSubtitle}>
                    Izaberi mjesece za {currentYear} i unesi validne podatke kartice.
                  </Text>
                </View>
                <Pressable onPress={closePaymentModal} style={styles.closeButton}>
                  <Text style={styles.closeText}>Zatvori</Text>
                </Pressable>
              </View>

              {paymentMessage ? (
                <StatusBanner text={paymentMessage} tone={paymentMessageTone} />
              ) : null}

              <Text style={styles.modalSectionTitle}>Mjeseci za uplatu</Text>
              <View style={styles.paymentMonthGrid}>
                {months.map((month) => {
                  const obligation = monthlyObligations[month];
                  const status = String(obligation?.status || "").toLowerCase();
                  const selected = paymentForm.months.includes(month);
                  const disabled = status === "paid" || status === "inactive";

                  return (
                    <Pressable
                      key={month}
                      disabled={disabled}
                      onPress={() => togglePaymentMonth(month)}
                      style={({ pressed }) => [
                        styles.paymentMonthCard,
                        selected ? styles.paymentMonthCardSelected : null,
                        disabled ? styles.paymentMonthCardDisabled : null,
                        pressed && !disabled ? styles.pressed : null,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.paymentMonthTitle,
                          selected ? styles.paymentMonthTextSelected : null,
                          disabled ? styles.paymentMonthTextDisabled : null,
                        ]}
                      >
                        {month}
                      </Text>
                      <Text
                        style={[
                          styles.paymentMonthStatus,
                          selected ? styles.paymentMonthTextSelected : null,
                          disabled ? styles.paymentMonthTextDisabled : null,
                        ]}
                      >
                        {status === "paid"
                          ? "Vec placeno"
                          : status === "inactive"
                            ? "Ne boravi"
                            : "Za uplatu"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Ukupno za uplatu</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(totalPaymentAmount, "0.00 EUR")}
                </Text>
              </View>

              <Text style={styles.modalSectionTitle}>Podaci kartice</Text>
              <FieldBlock label="Broj kartice (12 cifara)">
                <TextInput
                  keyboardType="number-pad"
                  maxLength={12}
                  onChangeText={(value) =>
                    updatePaymentField("cardNumber", normalizeDigitInput(value, 12))
                  }
                  placeholder="123456789012"
                  placeholderTextColor={colors.textSoft}
                  style={styles.input}
                  value={paymentForm.cardNumber}
                />
              </FieldBlock>

              <View style={styles.cardMetaRow}>
                <FieldBlock compact label="CVV">
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={3}
                    onChangeText={(value) =>
                      updatePaymentField("cvv", normalizeDigitInput(value, 3))
                    }
                    placeholder="123"
                    placeholderTextColor={colors.textSoft}
                    style={styles.input}
                    value={paymentForm.cvv}
                  />
                </FieldBlock>

                <FieldBlock compact label="Datum isteka">
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={5}
                    onChangeText={(value) =>
                      updatePaymentField("expiryDate", normalizeExpiryInput(value))
                    }
                    placeholder="MM/YY"
                    placeholderTextColor={colors.textSoft}
                    style={styles.input}
                    value={paymentForm.expiryDate}
                  />
                </FieldBlock>
              </View>

              <View style={styles.modalActionRow}>
                <View style={styles.modalAction}>
                  <AppButton
                    label="Odustani"
                    onPress={closePaymentModal}
                    variant="secondary"
                  />
                </View>
                <View style={styles.modalAction}>
                  <AppButton
                    disabled={isPaying}
                    label={isPaying ? "Placanje..." : "Plati dom"}
                    loading={isPaying}
                    onPress={payDorm}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function normalizeMonth(value = "") {
  return String(value).trim().toLowerCase();
}

function formatStatus(status?: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (!status) return "Nije definisano";
  if (normalized === "paid" || normalized === "placeno") return "Plaćeno";
  if (normalized === "unpaid" || normalized === "neplaceno") return "Neplaćeno";
  if (normalized === "inactive") return "Student ne boravi u domu";
  return status;
}

function getPeriod(item?: DomObligation) {
  if (!item) return "Nije dostupno";
  return `${item.mjesec || ""} ${item.godina || ""}`.trim();
}

function monthTone(status = "") {
  const normalized = String(status).toLowerCase();

  if (normalized === "paid" || normalized === "placeno") {
    return styles.monthPaid;
  }

  if (normalized === "inactive" || normalized.includes("ne boravi")) {
    return styles.monthInactive;
  }

  if (normalized === "unpaid" || normalized === "neplaceno") {
    return styles.monthUnpaid;
  }

  return styles.monthDefault;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function LegendChip({
  text,
  tone,
}: {
  text: string;
  tone: "danger" | "primary" | "success";
}) {
  return (
    <View style={styles.legendChip}>
      <InfoBadge tone={tone} value={text} />
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

function normalizeDigitInput(value: string, maxLength: number) {
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
  const expiry = new Date(2000 + Number(year), Number(month), 0, 23, 59, 59, 999);

  return expiry >= new Date();
}

const styles = StyleSheet.create({
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
  detailLabel: {
    color: "#7a8696",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 12,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
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
  infoGrid: {
    gap: 12,
  },
  infoLabel: {
    color: "#7a8696",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoTile: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 6,
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
  legendChip: {
    marginRight: 8,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  monthActive: {
    borderColor: colors.primary,
  },
  monthCard: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 2,
    flexBasis: "30%",
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  monthDefault: {
    backgroundColor: colors.surfaceMuted,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  monthInactive: {
    backgroundColor: colors.primarySoft,
  },
  monthPaid: {
    backgroundColor: colors.successBg,
  },
  monthText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  monthUnpaid: {
    backgroundColor: colors.dangerBg,
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
  noticeHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
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
  modalEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  paymentMonthCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "30%",
    flexGrow: 1,
    minWidth: 96,
    padding: 12,
  },
  paymentMonthCardDisabled: {
    opacity: 0.55,
  },
  paymentMonthCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  paymentMonthStatus: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  paymentMonthTextDisabled: {
    color: colors.textMuted,
  },
  paymentMonthTextSelected: {
    color: colors.white,
  },
  paymentMonthTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  totalCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  totalLabel: {
    color: "#7a8696",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  totalValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
  },
});
