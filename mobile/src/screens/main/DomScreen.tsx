import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import domHero from "../../assets/sections/dom.jpg";
import { api, getApiErrorMessage } from "../../api/client";
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

export function DomScreen() {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<DomObligation[]>([]);
  const [obavjestenja, setObavjestenja] = useState<NoticeItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [showNotices, setShowNotices] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDom = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<{
        obligations: DomObligation[];
        obavjestenja: NoticeItem[];
        lastUpdated: string | null;
      }>("/dom");

      setObligations(response.data.obligations || []);
      setObavjestenja(response.data.obavjestenja || []);
      setLastUpdated(response.data.lastUpdated || null);
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
        (item) => normalizeMonth(item.mjesec) === normalizeMonth(selectedMonth)
      ),
    [obligations, selectedMonth]
  );

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
            const obligation = obligations.find(
              (item) => normalizeMonth(item.mjesec) === normalizeMonth(month)
            );
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
                <Text style={styles.monthText}>{month}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard subtitle="Detalji obaveze za izabrani mjesec." title={selectedMonth}>
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

const styles = StyleSheet.create({
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
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    flex: 1,
    minWidth: "47%",
    padding: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
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
    borderWidth: 2,
  },
  monthCard: {
    borderRadius: 20,
    minWidth: "31%",
    padding: 16,
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
    fontSize: 15,
    fontWeight: "800",
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
