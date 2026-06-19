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
  CitaonicaRoom,
  CitaonaReservation,
  CitaonaSeat,
  CitaonaTrackingConfig,
  NoticeItem,
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

const standardTimeOptions = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const defaultTracking: CitaonaTrackingConfig = {
  enabled_by_preference: false,
  address: "2 Cetinjski Put, Podgorica 81000, Crna Gora",
  radius_meters: 120,
  grace_minutes: 60,
  reservation_mode: "standard",
  reservation_window: null,
};

type CitaonaNoticeTone = "danger" | "info" | "success" | "warning";

interface CitaonaUiNotice {
  id: string;
  body: string;
  label: string;
  title: string;
  tone: CitaonaNoticeTone;
  meta?: string;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isSameLocalDate(dateValue: string, compareDate = new Date()) {
  const selected = new Date(dateValue);
  selected.setHours(0, 0, 0, 0);

  const current = new Date(compareDate);
  current.setHours(0, 0, 0, 0);

  return selected.getTime() === current.getTime();
}

function isPastStandardSlot(
  dateValue: string,
  timeValue: string,
  nowValue: number
) {
  if (!isSameLocalDate(dateValue, new Date(nowValue))) {
    return false;
  }

  const now = new Date(nowValue);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return timeToMinutes(timeValue) < nowMinutes;
}

function getNoticeBadgeTone(
  tone: CitaonaNoticeTone
): "danger" | "primary" | "success" | "warning" {
  if (tone === "info") {
    return "primary";
  }

  return tone;
}

export function CitaonaScreen() {
  const [datum, setDatum] = useState(getTodayISO());
  const [vrijemeOd, setVrijemeOd] = useState("07:00");
  const [trajanje, setTrajanje] = useState(60);
  const [citaonice, setCitaonice] = useState<CitaonicaRoom[]>([]);
  const [mjesta, setMjesta] = useState<CitaonaSeat[]>([]);
  const [obavjestenja, setObavjestenja] = useState<NoticeItem[]>([]);
  const [rezervacije, setRezervacije] = useState<CitaonaReservation[]>([]);
  const [istorija, setIstorija] = useState<CitaonaReservation[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [vrijemeDo, setVrijemeDo] = useState("");
  const [radi, setRadi] = useState(true);
  const [tracking, setTracking] = useState<CitaonaTrackingConfig>(defaultTracking);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTick(Date.now());
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const todayIso = useMemo(() => getTodayISO(), [nowTick]);
  const allowedDates = useMemo(() => [todayIso, getTomorrowISO()], [nowTick, todayIso]);
  const selectedRoom = useMemo(
    () => citaonice.find((item) => item.id === selectedRoomId) || null,
    [citaonice, selectedRoomId]
  );
  const isDailyTrackingMode = tracking.enabled_by_preference === true;
  const availableTimeOptions = useMemo(
    () =>
      standardTimeOptions.filter(
        (time) => !isPastStandardSlot(datum, time, nowTick)
      ),
    [datum, nowTick]
  );
  const selectedStandardTime = useMemo(() => {
    if (availableTimeOptions.includes(vrijemeOd)) {
      return vrijemeOd;
    }

    return availableTimeOptions[0] || standardTimeOptions[0];
  }, [availableTimeOptions, vrijemeOd]);
  const noSlotsLeftForToday =
    !isDailyTrackingMode &&
    datum === todayIso &&
    availableTimeOptions.length === 0;
  const reservationSelectionUnavailable =
    noSlotsLeftForToday ||
    (isDailyTrackingMode && !tracking.reservation_window);
  const reservationButtonDisabled =
    reservationSelectionUnavailable || !radi || !selectedRoomId;
  const groupedSeats = useMemo(
    () => groupSeatsByCitaonica(mjesta, citaonice),
    [citaonice, mjesta]
  );
  const totalSeats = useMemo(
    () => citaonice.reduce((sum, item) => sum + (item.broj_mjesta || 0), 0),
    [citaonice]
  );
  const availableSeatsCount = useMemo(
    () => mjesta.filter((item) => item.zauzeto !== true).length,
    [mjesta]
  );
  const displayedVrijemeOd = isDailyTrackingMode
    ? tracking.reservation_window?.vrijeme_od || "-"
    : noSlotsLeftForToday
    ? "-"
    : selectedStandardTime;
  const displayedVrijemeDo = isDailyTrackingMode
    ? tracking.reservation_window?.vrijeme_do || "-"
    : noSlotsLeftForToday
    ? "-"
    : vrijemeDo || "-";

  useEffect(() => {
    if (
      !isDailyTrackingMode &&
      availableTimeOptions.length > 0 &&
      !availableTimeOptions.includes(vrijemeOd)
    ) {
      setVrijemeOd(availableTimeOptions[0]);
    }
  }, [availableTimeOptions, isDailyTrackingMode, vrijemeOd]);

  const systemNotices = useMemo(() => {
    const notices: Array<{
      id: string;
      text: string;
      tone: CitaonaNoticeTone;
    }> = [];

    if (message) {
      notices.push({ id: "message", text: message, tone: "danger" });
    }

    if (success) {
      notices.push({ id: "success", text: success, tone: "success" });
    }

    if (trackingMessage) {
      notices.push({
        id: "tracking-message",
        text: trackingMessage,
        tone: "warning",
      });
    }

    if (noSlotsLeftForToday) {
      notices.push({
        id: "no-slots-today",
        text: "Za danas vise nema dostupnih pocetnih termina. Izaberi sjutra za novu rezervaciju.",
        tone: "warning",
      });
    }

    if (isDailyTrackingMode && !tracking.reservation_window) {
      notices.push({
        id: "no-tracking-window",
        text: "Za izabrani dan trenutno nema slobodnog radnog vremena za dnevnu rezervaciju sa lokacijom.",
        tone: "warning",
      });
    }

    return notices;
  }, [
    isDailyTrackingMode,
    message,
    noSlotsLeftForToday,
    success,
    tracking.reservation_window,
    trackingMessage,
  ]);

  const reservationNotices = useMemo<CitaonaUiNotice[]>(() => {
    return rezervacije.map((item) => {
      const roomLabel = item.citaonica_naziv || "Citaonica";
      const baseBody = `${roomLabel} • mjesto ${item.broj_mjesta || "-"} • ${formatDate(
        item.datum
      )} • ${item.vrijeme_od} - ${item.vrijeme_do}`;

      if (item.status === "pending") {
        return {
          id: `reservation-pending-${item.id}`,
          body: baseBody,
          label: "Rezervacija",
          meta: item.expires_at
            ? `Potvrda do ${formatDateTime(item.expires_at)}`
            : undefined,
          title: `Kod ${item.kod} ceka potvrdu dolaska`,
          tone: "warning",
        };
      }

      if (item.tracking_enabled && item.outside_since) {
        return {
          id: `reservation-outside-${item.id}`,
          body: `Van si dozvoljenog radijusa. Vrati se u citaonicu u narednih ${
            item.remaining_grace_minutes ?? tracking.grace_minutes
          } min da rezervacija ne bude otkazana.`,
          label: "Lokacija",
          meta: baseBody,
          title: "Upozorenje za pracenje lokacije",
          tone: "warning",
        };
      }

      if (item.tracking_enabled) {
        return {
          id: `reservation-tracking-${item.id}`,
          body: `${baseBody}. Lokacija je ukljucena za ovu rezervaciju.`,
          label: "Lokacija",
          title: "Pracenje lokacije je aktivno",
          tone: "info",
        };
      }

      return {
        id: `reservation-active-${item.id}`,
        body: baseBody,
        label: "Aktivno",
        title: "Imas aktivnu rezervaciju u citaonici",
        tone: "success",
      };
    });
  }, [rezervacije, tracking.grace_minutes]);

  const loadCitaona = useCallback(async () => {
    try {
      setMessage("");
      const response = await api.get<{
        citaonice: CitaonicaRoom[];
        mjesta: CitaonaSeat[];
        obavjestenja: NoticeItem[];
        rezervacije: CitaonaReservation[];
        istorija: CitaonaReservation[];
        selected_citaonica_id?: number | null;
        vrijeme_do: string;
        radi: boolean;
        tracking: CitaonaTrackingConfig;
      }>("/citaona", {
        params: {
          citaonica_id: selectedRoomId ?? undefined,
          datum,
          trajanje,
          vrijeme_od: selectedStandardTime,
        },
      });

      const nextRooms = response.data.citaonice || [];
      const nextSelectedRoomId =
        response.data.selected_citaonica_id || nextRooms[0]?.id || null;

      setCitaonice(nextRooms);
      setSelectedRoomId((current) => {
        if (current && nextRooms.some((room) => room.id === current)) {
          return current;
        }

        return nextSelectedRoomId;
      });
      setMjesta(response.data.mjesta || []);
      setObavjestenja(response.data.obavjestenja || []);
      setRezervacije(response.data.rezervacije || []);
      setIstorija(response.data.istorija || []);
      setVrijemeDo(response.data.vrijeme_do || "");
      setRadi(response.data.radi);
      setTracking(response.data.tracking || defaultTracking);
      setSelectedSeat(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greška pri učitavanju čitaonice."));
    }
  }, [datum, selectedRoomId, selectedStandardTime, trajanje]);

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
    if (noSlotsLeftForToday) {
      setMessage("Za danas vise ne mozes rezervisati novi termin. Izaberi sjutra.");
      return;
    }

    if (!selectedRoomId) {
      setMessage("Prvo izaberi citaonicu.");
      return;
    }

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
          : selectedStandardTime,
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
        `Radijus ${tracking.radius_meters}m`,
        `Odsustvo ${tracking.grace_minutes}min`,
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
      <SectionCard
        subtitle="Status rezervacija, pracenja lokacije i admin objave za citaonicu."
        title="Obavjestenja"
      >
        {systemNotices.length === 0 &&
        reservationNotices.length === 0 &&
        obavjestenja.length === 0 ? (
          <Text style={styles.emptyText}>
            Trenutno nema novih obavjestenja za citaonicu.
          </Text>
        ) : (
          <>
            {systemNotices.length > 0 ? (
              <View style={styles.noticeGroup}>
                <Text style={styles.noticeGroupLabel}>Sistemske poruke</Text>
                {systemNotices.map((item) => (
                  <StatusBanner key={item.id} text={item.text} tone={item.tone} />
                ))}
              </View>
            ) : null}

            {reservationNotices.length > 0 ? (
              <View style={styles.noticeGroup}>
                <Text style={styles.noticeGroupLabel}>Status rezervacija</Text>
                {reservationNotices.map((item) => (
                  <View key={item.id} style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                      <InfoBadge
                        tone={getNoticeBadgeTone(item.tone)}
                        value={item.label}
                      />
                      {item.meta ? (
                        <Text style={styles.mutedText}>{item.meta}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.noticeTitle}>{item.title}</Text>
                    <Text style={styles.noticeBody}>{item.body}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {obavjestenja.length > 0 ? (
              <View style={styles.noticeGroup}>
                <Text style={styles.noticeGroupLabel}>Admin obavjestenja</Text>
                {obavjestenja.map((item) => (
                  <View key={item.id} style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                      <InfoBadge value={item.kategorija || "Citaonica"} />
                      <Text style={styles.mutedText}>
                        {formatDate(item.datum_vrijeme)}
                      </Text>
                    </View>
                    <Text style={styles.noticeTitle}>{item.naslov}</Text>
                    <Text style={styles.noticeBody}>{item.opis}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </SectionCard>

      <SectionCard subtitle="Radno vrijeme i osnovne informacije o čitaonici." title="Info">
        <View style={styles.infoGrid}>
          <InfoTile label="Čitaonice" value={`${citaonice.length}`} />
          <InfoTile
            label="Odabrana"
            singleLine
            value={selectedRoom?.naziv || "Izaberi citaonicu"}
          />
          <InfoTile
            label="Kapacitet"
            value={`${selectedRoom?.broj_mjesta || totalSeats} mjesta`}
          />
          <InfoTile
            label="Slobodno"
            value={`${selectedRoom?.slobodna_mjesta ?? availableSeatsCount} mjesta`}
          />
          <InfoTile
            label="Radno vrijeme"
            value={"Radni dani 07:00–21:00\nSubota 07:00–15:00\nNedjelja ne radi"}
          />
          <InfoTile
            label="Lokacije"
            value={
              selectedRoom?.lokacija ||
              (citaonice.length === 1
                ? citaonice[0].lokacija
                : `${citaonice.length} lokacije u sistemu`)
            }
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Prvo izaberi citaonicu u koju zelis da ides."
        title="Citaonica"
      >
        {citaonice.length === 0 ? (
          <Text style={styles.emptyText}>
            Trenutno nema aktivnih citaonica za rezervaciju.
          </Text>
        ) : (
          <View style={styles.roomChoiceList}>
            {citaonice.map((room) => {
              const selected = selectedRoomId === room.id;

              return (
                <Pressable
                  key={room.id}
                  onPress={() => setSelectedRoomId(room.id)}
                  style={({ pressed }) => [
                    styles.roomChoiceCard,
                    selected ? styles.roomChoiceCardActive : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      selected ? styles.radioOuterActive : null,
                    ]}
                  >
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>

                  <View style={styles.roomChoiceText}>
                    <Text style={styles.roomChoiceTitle}>{room.naziv}</Text>
                    <Text style={styles.roomChoiceMeta}>{room.lokacija}</Text>
                    <Text style={styles.roomChoiceMeta}>
                      {room.slobodna_mjesta ?? 0} slobodno od {room.broj_mjesta}
                    </Text>
                  </View>

                  <InfoBadge value={`${room.broj_mjesta} mjesta`} />
                </Pressable>
              );
            })}
          </View>
        )}
      </SectionCard>

      <SectionCard
        subtitle="Izaberi dan i termin koji jos nije prosao."
        title="Termin"
      >
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
            {datum === todayIso ? (
              <Text style={styles.inlineHint}>
                Prikazani su samo termini za danas koji jos nijesu prosli.
              </Text>
            ) : null}

            {availableTimeOptions.length === 0 ? (
              <Text style={styles.emptyText}>
                Za danas vise nema slobodnih pocetnih termina. Izaberi sjutra.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {availableTimeOptions.map((time) => (
                    <Pressable
                      key={time}
                      onPress={() => setVrijemeOd(time)}
                      style={({ pressed }) => [
                        styles.dayChip,
                        selectedStandardTime === time ? styles.dayChipActive : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          selectedStandardTime === time
                            ? styles.dayChipTextActive
                            : null,
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

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
          text={
            noSlotsLeftForToday
              ? "Za danas vise nema dostupnih novih termina."
              : `Izabrani termin: ${displayedVrijemeOd} - ${displayedVrijemeDo}`
          }
          tone={noSlotsLeftForToday ? "warning" : "info"}
        />
        {!radi ? (
          <StatusBanner
            text="Čitaonica ne radi u izabranom terminu."
            tone="danger"
          />
        ) : null}
      </SectionCard>

      <SectionCard
        subtitle="Slobodna mjesta su odmah rezervabilna."
        title={selectedRoom ? `Mjesta • ${selectedRoom.naziv}` : "Mjesta"}
      >
        {reservationSelectionUnavailable ? (
          <Text style={styles.emptyText}>
            {noSlotsLeftForToday
              ? "Za danas vise ne mozes rezervisati novi termin. Izaberi sjutra."
              : "Za izabrani dan trenutno nema dostupnog vremena za dnevnu rezervaciju."}
          </Text>
        ) : null}
        {!reservationSelectionUnavailable ? (
          <>
            {groupedSeats.map((group) => (
              <View key={group.id} style={styles.roomBlock}>
                <View style={styles.roomHeader}>
                  <View style={styles.roomHeaderText}>
                    <Text style={styles.roomTitle}>{group.naziv}</Text>
                    <Text style={styles.roomMeta}>
                      {group.lokacija} • {group.slobodna_mjesta} slobodno od {group.broj_mjesta}
                    </Text>
                  </View>
                  <InfoBadge value={`${group.broj_mjesta} mjesta`} />
                </View>

                <View style={styles.seatGrid}>
                  {group.mjesta.map((mjesto) => {
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
              </View>
            ))}

            <AppButton
              disabled={reservationButtonDisabled}
              label="Rezerviši mjesto"
              onPress={reserveSeat}
            />
          </>
        ) : null}
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
                {item.citaonica_naziv || "Citaonica"} • mjesto {item.broj_mjesta || "-"} •{" "}
                {formatDate(item.datum)}
              </Text>
              <Text style={styles.reservationBody}>
                {item.vrijeme_od} - {item.vrijeme_do}
              </Text>
              {item.citaonica_lokacija ? (
                <Text style={styles.helperText}>{item.citaonica_lokacija}</Text>
              ) : null}
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
                    {item.citaonica_naziv || "Citaonica"} • mjesto {item.broj_mjesta || "-"} •{" "}
                    {formatDate(item.datum)}
                  </Text>
                  <Text style={styles.reservationBody}>
                    {item.vrijeme_od} - {item.vrijeme_do}
                  </Text>
                  {item.citaonica_lokacija ? (
                    <Text style={styles.helperText}>{item.citaonica_lokacija}</Text>
                  ) : null}
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

function InfoTile({
  label,
  value,
  singleLine = false,
}: {
  label: string;
  value: string;
  singleLine?: boolean;
}) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        adjustsFontSizeToFit={singleLine}
        minimumFontScale={0.6}
        numberOfLines={singleLine ? 1 : undefined}
        style={styles.infoValue}
      >
        {value}
      </Text>
    </View>
  );
}

function groupSeatsByCitaonica(
  seats: CitaonaSeat[],
  rooms: CitaonicaRoom[]
) {
  const order = new Map<number, number>();
  rooms.forEach((room, index) => {
    order.set(room.id, index);
  });

  const grouped = new Map<
    number,
    {
      id: number;
      naziv: string;
      lokacija: string;
      broj_mjesta: number;
      slobodna_mjesta: number;
      mjesta: CitaonaSeat[];
    }
  >();

  seats.forEach((seat) => {
    const roomId = seat.citaonica_id || 0;
    const current = grouped.get(roomId) || {
      id: roomId,
      naziv: seat.citaonica_naziv || "Citaonica",
      lokacija: seat.citaonica_lokacija || "Lokacija nije unesena",
      broj_mjesta: 0,
      slobodna_mjesta: 0,
      mjesta: [],
    };

    current.broj_mjesta += 1;
    current.slobodna_mjesta += seat.zauzeto ? 0 : 1;
    current.mjesta.push(seat);
    grouped.set(roomId, current);
  });

  return Array.from(grouped.values()).sort((first, second) => {
    const firstOrder = order.get(first.id) ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = order.get(second.id) ?? Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return first.naziv.localeCompare(second.naziv);
  });
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
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 4,
  },
  inlineHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
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
  noticeGroup: {
    gap: 10,
  },
  noticeGroupLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
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
  radioInner: {
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  radioOuter: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginTop: 2,
    width: 20,
  },
  radioOuterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roomBlock: {
    gap: 10,
  },
  roomChoiceCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  roomChoiceCardActive: {
    backgroundColor: "#EEF4FF",
    borderColor: colors.primary,
  },
  roomChoiceList: {
    gap: 10,
  },
  roomChoiceMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  roomChoiceText: {
    flex: 1,
  },
  roomChoiceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  roomHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  roomHeaderText: {
    flex: 1,
  },
  roomMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  roomTitle: {
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
