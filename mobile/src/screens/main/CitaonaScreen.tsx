import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import citaonaHero from "../../assets/sections/citaona.jpg";
import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import {
  ensureForegroundLocationPermission,
} from "../../services/citaonaTracking";
import {
  subscribeToCitaonaTracking,
} from "../../services/citaonaTrackerEvents";
import {
  CitaonaReservation,
  CitaonaSeat,
  CitaonaTrackingConfig,
} from "../../types/modules";
import {
  formatDate,
  formatDateTime,
  getTodayISO,
  getTomorrowISO,
  reservationStatusLabel,
  reservationStatusTone,
} from "../../utils/format";
import { colors } from "../../theme/colors";

const durations = [
  { label: "30 min", value: 30 },
  { label: "1h", value: 60 },
  { label: "1h 30min", value: 90 },
  { label: "2h", value: 120 },
  { label: "2h 30min", value: 150 },
  { label: "3h", value: 180 },
  { label: "3h 30min", value: 210 },
  { label: "4h", value: 240 },
  { label: "4h 30min", value: 270 },
  { label: "5h", value: 300 },
];

const defaultTracking: CitaonaTrackingConfig = {
  enabled_by_preference: false,
  address: "2 Cetinjski Put, Podgorica 81000, Crna Gora",
  radius_meters: 120,
  grace_minutes: 60,
  reservation_mode: "standard",
  reservation_window: null,
};

export function CitaonaScreen() {
  const [datum, setDatum] = useState(getTodayISO());
  const [vrijemeOd, setVrijemeOd] = useState("07:00");
  const [trajanje, setTrajanje] = useState(60);
  const [mjesta, setMjesta] = useState<CitaonaSeat[]>([]);
  const [rezervacije, setRezervacije] = useState<CitaonaReservation[]>([]);
  const [istorija, setIstorija] = useState<CitaonaReservation[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [vrijemeDo, setVrijemeDo] = useState("");
  const [radi, setRadi] = useState(true);
  const [tracking, setTracking] = useState<CitaonaTrackingConfig>(defaultTracking);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const allowedDates = useMemo(() => [getTodayISO(), getTomorrowISO()], []);
  const isDailyTrackingMode = tracking.enabled_by_preference === true;
  const displayedVrijemeOd = isDailyTrackingMode
    ? tracking.reservation_window?.vrijeme_od || "-"
    : vrijemeOd;
  const displayedVrijemeDo = isDailyTrackingMode
    ? tracking.reservation_window?.vrijeme_do || "-"
    : vrijemeDo || "-";

  const loadCitaona = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<{
        mjesta: CitaonaSeat[];
        rezervacije: CitaonaReservation[];
        istorija: CitaonaReservation[];
        vrijeme_do: string;
        radi: boolean;
        tracking: CitaonaTrackingConfig;
      }>(`/citaona?datum=${datum}&vrijeme_od=${vrijemeOd}&trajanje=${trajanje}`);

      setMjesta(response.data.mjesta || []);
      setRezervacije(response.data.rezervacije || []);
      setIstorija(response.data.istorija || []);
      setVrijemeDo(response.data.vrijeme_do || "");
      setRadi(response.data.radi);
      setTracking(response.data.tracking || defaultTracking);
      setSelectedSeat(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri učitavanju čitaonice."));
    }
  }, [datum, trajanje, vrijemeOd]);

  useEffect(() => {
    setRefreshing(true);
    loadCitaona().finally(() => setRefreshing(false));
  }, [loadCitaona]);

  useEffect(() => {
    const unsubscribe = subscribeToCitaonaTracking((payload) => {
      if (payload.message) {
        setTrackingMessage(payload.message);
      }

      if (payload.reservation?.status === "cancelled") {
        setTrackingMessage(
          "Rezervacija u čitaonici je auto-otkazana jer je korisnik bio van dozvoljenog radijusa duže od dozvoljenog vremena."
        );
      }

      void loadCitaona();
    });

    return unsubscribe;
  }, [loadCitaona]);

  async function reserveSeat() {
    if (!selectedSeat) {
      setMessage("Prvo izaberi slobodno mjesto.");
      return;
    }

    try {
      setMessage("");
      setSuccess("");

      if (isDailyTrackingMode && !tracking.reservation_window) {
        setMessage("Za izabrani dan više nema dostupnog radnog vremena za praćenu dnevnu rezervaciju.");
        return;
      }

      if (isDailyTrackingMode) {
        const granted = await ensureForegroundLocationPermission();
        if (!granted) {
          setMessage("Za dnevnu rezervaciju moraš dozvoliti lokaciju na telefonu.");
          return;
        }
      }

      const response = await api.post("/citaona/rezervacija", {
        datum,
        vrijeme_od: isDailyTrackingMode
          ? tracking.reservation_window?.vrijeme_od
          : vrijemeOd,
        trajanje: isDailyTrackingMode ? undefined : trajanje,
        mjesto_id: selectedSeat,
      });

      setSuccess(
        response.data?.message ||
          `Rezervacija je uspješna. Tvoj kod je ${response.data?.rezervacija?.kod}.`
      );
      await loadCitaona();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri kreiranju rezervacije."));
    }
  }

  function confirmCancel(id: number) {
    Alert.alert("Otkaži rezervaciju", "Da li želiš da otkažeš rezervaciju?", [
      { style: "cancel", text: "Nazad" },
      {
        style: "destructive",
        text: "Otkaži",
        onPress: () => void cancelReservation(id),
      },
    ]);
  }

  async function cancelReservation(id: number) {
    try {
      await api.delete(`/citaona/rezervacija/${id}`);
      setSuccess("Rezervacija je otkazana.");
      await loadCitaona();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri otkazivanju rezervacije."));
    }
  }

  function confirmClearHistory() {
    Alert.alert(
      "Obriši istoriju",
      "Obrisati cijelu istoriju završenih i otkazanih rezervacija?",
      [
        { style: "cancel", text: "Nazad" },
        {
          style: "destructive",
          text: "Obriši",
          onPress: () => void clearHistory(),
        },
      ]
    );
  }

  async function clearHistory() {
    try {
      await api.delete("/citaona/rezervacije/istorija");
      setSuccess("Istorija rezervacija je obrisana.");
      await loadCitaona();
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Greška pri brisanju istorije rezervacija.")
      );
    }
  }

  return (
    <ScreenShell
      eyebrow="Čitaonica"
      highlights={[
        `Radijus ${tracking.radius_meters} m`,
        `Odsustvo ${tracking.grace_minutes} min`,
        isDailyTrackingMode ? "Dnevna rezervacija" : "Standardna rezervacija",
      ]}
      image={citaonaHero}
      onRefresh={() => {
        setRefreshing(true);
        loadCitaona().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle="Rezervacije mjesta, kodovi i lokacija za dnevne rezervacije."
      title="Čitaonica"
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}
      {success ? <StatusBanner text={success} tone="success" /> : null}
      {trackingMessage ? <StatusBanner text={trackingMessage} tone="warning" /> : null}

      <SectionCard subtitle="Radno vrijeme i osnovne informacije o čitaonici." title="Info">
        <View style={styles.infoGrid}>
          <InfoTile label="Kapacitet" value="30 mjesta" />
          <InfoTile label="Radni dani" value="07:00 - 21:00" />
          <InfoTile label="Subota" value="07:00 - 15:00" />
          <InfoTile label="Lokacija" value={tracking.address} />
        </View>
      </SectionCard>

      <SectionCard subtitle="Izaberi dan i termin koji ti odgovara." title="Termin">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dayRow}>
            {allowedDates.map((item) => (
              <Pressable
                key={item}
                onPress={() => setDatum(item)}
                style={({ pressed }) => [
                  styles.dayChip,
                  datum === item ? styles.dayChipActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={[styles.dayChipText, datum === item ? styles.dayChipTextActive : null]}>
                  {formatDate(item)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {isDailyTrackingMode ? (
          <View style={styles.modeCard}>
            <Text style={styles.modeTitle}>Dnevna rezervacija sa lokacijom</Text>
            <Text style={styles.modeText}>
              Cijeli radni dan: {displayedVrijemeOd} - {displayedVrijemeDo}
            </Text>
            <Text style={styles.modeText}>
              Radijus {tracking.radius_meters} m • odsustvo do {tracking.grace_minutes} min
            </Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => setVrijemeOd(time)}
                    style={({ pressed }) => [
                      styles.dayChip,
                      vrijemeOd === time ? styles.dayChipActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        vrijemeOd === time ? styles.dayChipTextActive : null,
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {durations.map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setTrajanje(item.value)}
                    style={({ pressed }) => [
                      styles.durationChip,
                      trajanje === item.value ? styles.durationChipActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        trajanje === item.value ? styles.durationChipTextActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <StatusBanner
          text={`Izabrani termin: ${displayedVrijemeOd} - ${displayedVrijemeDo}`}
        />
        {!radi ? (
          <StatusBanner
            text="Čitaonica ne radi u izabranom terminu."
            tone="danger"
          />
        ) : null}
      </SectionCard>

      <SectionCard subtitle="Slobodna mjesta su odmah rezervabilna." title="Mjesta">
        <View style={styles.seatGrid}>
          {mjesta.map((mjesto) => {
            const isSelected = selectedSeat === mjesto.id;
            const disabled = mjesto.zauzeto;

            return (
              <Pressable
                key={mjesto.id}
                disabled={disabled}
                onPress={() => setSelectedSeat(mjesto.id)}
                style={({ pressed }) => [
                  styles.seatCard,
                  disabled ? styles.seatTaken : null,
                  isSelected ? styles.seatSelected : null,
                  pressed && !disabled ? styles.pressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.seatNumber,
                    isSelected ? styles.seatNumberSelected : null,
                  ]}
                >
                  {mjesto.broj_mjesta}
                </Text>
                <Text
                  style={[
                    styles.seatLabel,
                    isSelected ? styles.seatLabelSelected : null,
                  ]}
                >
                  {disabled ? "Zauzeto" : isSelected ? "Odabrano" : "Slobodno"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          label="Rezerviši mjesto"
          onPress={reserveSeat}
        />
      </SectionCard>

      <SectionCard subtitle="Aktivne i čekajuće rezervacije." title="Moje rezervacije">
        {rezervacije.length === 0 ? (
          <Text style={styles.emptyText}>Trenutno nemaš aktivnih rezervacija.</Text>
        ) : (
          rezervacije.map((item) => (
            <View key={item.id} style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <InfoBadge
                  tone={reservationStatusTone(item.status)}
                  value={reservationStatusLabel(item.status)}
                />
                <Text style={styles.codeText}>{item.kod}</Text>
              </View>
              <Text style={styles.reservationTitle}>
                Mjesto {item.broj_mjesta || "-"} • {formatDate(item.datum)}
              </Text>
              <Text style={styles.reservationBody}>
                {item.vrijeme_od} - {item.vrijeme_do}
              </Text>
              {item.tracking_enabled ? (
                <Text style={styles.helperText}>
                  Rezervacija sa lokacijom
                  {item.remaining_grace_minutes !== null &&
                  item.remaining_grace_minutes !== undefined
                    ? ` • preostalo odsustvo ${item.remaining_grace_minutes} min`
                    : ""}
                </Text>
              ) : null}
              <View style={styles.actionRow}>
                {item.status === "pending" ? (
                  <Pressable
                    onPress={() => confirmCancel(item.id)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Otkaži</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard
        right={
          <Pressable onPress={() => setHistoryOpen((value) => !value)}>
            <Text style={styles.linkText}>
              {historyOpen ? "Sakrij" : "Prikaži"}
            </Text>
          </Pressable>
        }
        subtitle="Istorija završenih, isteklih i otkazanih rezervacija."
        title="Istorija"
      >
        {historyOpen ? (
          <>
            <Pressable onPress={confirmClearHistory} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Obriši završenu istoriju</Text>
            </Pressable>
            {istorija.length === 0 ? (
              <Text style={styles.emptyText}>Istorija je prazna.</Text>
            ) : (
              istorija.map((item) => (
                <View key={`history-${item.id}`} style={styles.historyCard}>
                  <View style={styles.reservationHeader}>
                    <InfoBadge
                      tone={reservationStatusTone(item.status)}
                      value={reservationStatusLabel(item.status)}
                    />
                    <Text style={styles.mutedText}>{item.kod}</Text>
                  </View>
                  <Text style={styles.reservationTitle}>
                    Mjesto {item.broj_mjesta || "-"} • {formatDate(item.datum)}
                  </Text>
                  <Text style={styles.reservationBody}>
                    {item.vrijeme_od} - {item.vrijeme_do}
                  </Text>
                  <Text style={styles.helperText}>
                    Kreirano {formatDateTime(item.created_at)}
                  </Text>
                </View>
              ))
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>
            Dodirni "Prikaži" da otvoriš istoriju rezervacija.
          </Text>
        )}
      </SectionCard>
    </ScreenShell>
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

const styles = StyleSheet.create({
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: colors.dangerBg,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: colors.dangerText,
    fontSize: 14,
    fontWeight: "700",
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 44,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  codeText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  dayChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  dayChipTextActive: {
    color: colors.white,
  },
  dayRow: {
    flexDirection: "row",
    paddingRight: 10,
  },
  durationChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  durationChipTextActive: {
    color: colors.white,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  filterRow: {
    flexDirection: "row",
    paddingRight: 10,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  modeCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  modeText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  modeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  mutedText: {
    color: "#708194",
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  reservationBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  reservationCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  reservationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reservationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  seatCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 90,
    minWidth: "30%",
    padding: 12,
  },
  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  seatLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  seatLabelSelected: {
    color: colors.white,
  },
  seatNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  seatNumberSelected: {
    color: colors.white,
  },
  seatSelected: {
    backgroundColor: colors.primary,
  },
  seatTaken: {
    backgroundColor: "#E7EDF5",
    opacity: 0.6,
  },
});
