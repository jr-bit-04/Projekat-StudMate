import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { AvatarCircle } from "../../components/AvatarCircle";
import { InfoBadge } from "../../components/InfoBadge";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { useAuth } from "../../context/AuthContext";
import {
  AdminManagedModule,
  getAccessibleAdminModules,
  getAdminModuleMeta,
} from "../../data/adminModules";
import { AdminStackParamList } from "../../navigation/types";
import { AuthUser } from "../../types/auth";
import { colors } from "../../theme/colors";
import { formatDate, getTodayISO } from "../../utils/format";
import { AdminModuleTasks } from "./AdminModuleTasks";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminModule">;

interface SummaryCard {
  label: string;
  value: string;
}

interface ModuleSummary {
  cards: SummaryCard[];
  note: string;
}

export function AdminModuleScreen({ navigation, route }: Props) {
  const { isSubmitting, logout, user } = useAuth();
  const { module } = route.params;
  const meta = getAdminModuleMeta(module);
  const accessibleModules = useMemo(
    () => getAccessibleAdminModules(user),
    [user]
  );
  const alternativeModules = accessibleModules.filter((item) => item !== module);

  const [summary, setSummary] = useState<ModuleSummary>(() =>
    getFallbackSummary(module, user)
  );
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadSummary = useCallback(async () => {
    try {
      setMessage("");
      const nextSummary = await getModuleSummary(module, user);
      setSummary(nextSummary);
    } catch (error) {
      setSummary(getFallbackSummary(module, user));
      setMessage(
        getApiErrorMessage(
          error,
          "Greska pri ucitavanju administrativnog pregleda."
        )
      );
    }
  }, [module, user]);

  useEffect(() => {
    setRefreshing(true);
    loadSummary().finally(() => setRefreshing(false));
  }, [loadSummary]);

  return (
    <ScreenShell
      action={
        <Pressable
          onPress={() => navigation.navigate("Profil")}
          style={({ pressed }) => [
            styles.identityCard,
            pressed ? styles.pressed : null,
          ]}
        >
          <AvatarCircle
            name={user?.name}
            size={58}
            src={user?.profile_image_url}
          />
          <View style={styles.identityText}>
            <Text style={styles.identityLabel}>Admin sektor</Text>
            <Text numberOfLines={1} style={styles.identityName}>
              {user?.name || "Administracija"}
            </Text>
            <Text numberOfLines={1} style={styles.identityMeta}>
              {meta.label}
            </Text>
          </View>
        </Pressable>
      }
      eyebrow="Administracija"
      highlights={[
        meta.label,
        user?.admin_module === "all" ? "Globalni pristup" : "Sektorski pristup",
        "Profil i odjava",
      ]}
      image={meta.image}
      onRefresh={() => {
        setRefreshing(true);
        setRefreshToken((current) => current + 1);
        loadSummary().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle={meta.subtitle}
      title={meta.label}
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}
      {summary.note ? <StatusBanner text={summary.note} /> : null}

      <SectionCard
        subtitle="Brzi pregled trenutno najvaznijih stvari u ovom sektoru."
        title="Pregled"
      >
        <View style={styles.summaryGrid}>
          {summary.cards.map((item) => (
            <View key={item.label} style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Najvazniji zadaci koje ovaj administrativni sektor pokriva."
      title="Zadaci"
      >
        {meta.tasks.map((task) => (
          <View key={task} style={styles.taskRow}>
            <InfoBadge value={meta.label} />
            <Text style={styles.taskText}>{task}</Text>
          </View>
        ))}
      </SectionCard>

      <AdminModuleTasks
        module={module}
        onChanged={loadSummary}
        refreshToken={refreshToken}
      />

      {alternativeModules.length > 0 ? (
        <SectionCard
          subtitle="Globalni admin moze odmah preci i na druge sektore."
          title="Ostali sektori"
        >
          <View style={styles.switchGrid}>
            {alternativeModules.map((item) => {
              const nextModule = getAdminModuleMeta(item);

              return (
                <Pressable
                  key={item}
                  onPress={() =>
                    navigation.replace("AdminModule", {
                      module: item,
                    })
                  }
                  style={({ pressed }) => [
                    styles.switchCard,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.switchTitle}>{nextModule.label}</Text>
                  <Text style={styles.switchBody}>{nextModule.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard
        subtitle="Profil i odjava ostaju dostupni i za administrativne naloge."
        title="Nalog"
      >
        <View style={styles.buttonColumn}>
          <AppButton
            label="Otvori profil"
            onPress={() => navigation.navigate("Profil")}
          />
          {accessibleModules.length > 1 ? (
          <AppButton
            label="Svi sektori"
            onPress={() => navigation.navigate("AdminHub")}
            variant="secondary"
          />
          ) : null}
          <AppButton
            label="Odjavi se"
            loading={isSubmitting}
            onPress={logout}
            variant="secondary"
          />
        </View>
      </SectionCard>
    </ScreenShell>
  );
}

async function getModuleSummary(
  module: AdminManagedModule,
  user?: AuthUser | null
): Promise<ModuleSummary> {
  const today = getTodayISO();

  if (module === "menza") {
    const response = await api.get<{
      meni: Array<{
        tip_obroka: string;
      }>;
    }>(`/menza/admin/meni?datum=${today}`);
    const meni = response.data.meni || [];

    return {
      cards: [
        { label: "Datum", value: formatDate(today) },
        { label: "Uneseni obroci", value: `${meni.length}/3` },
        {
          label: "Status danas",
          value: meni.length === 3 ? "Spremno" : "Dopuna",
        },
      ],
      note:
        meni.length === 3
          ? "Meni je dodat za sva tri obroka danas."
          : "Za danas jos nijesu uneseni svi obroci.",
    };
  }

  if (module === "citaona") {
    const response = await api.get<{
      rezervacije: Array<{
        status?: string | null;
        tracking_enabled?: boolean;
      }>;
    }>("/citaona/admin/rezervacije");
    const rezervacije = response.data.rezervacije || [];
    const active = rezervacije.filter((item) => item.status === "active").length;
    const pending = rezervacije.filter((item) => item.status === "pending").length;
    const tracked = rezervacije.filter(
      (item) => item.tracking_enabled && item.status !== "cancelled"
    ).length;

    return {
      cards: [
        { label: "Aktivne", value: String(active) },
        { label: "Ceka potvrdu", value: String(pending) },
        { label: "Sa lokacijom", value: String(tracked) },
      ],
      note:
        active > 0
          ? `Trenutno je aktivno ${active} rezervacija u citaonici.`
          : "Trenutno nema aktivnih rezervacija u citaonici.",
    };
  }

  if (module === "popusti") {
    const response = await api.get<{
      popusti: Array<{
        status?: string | null;
      }>;
    }>("/popusti/moderacija");
    const popusti = response.data.popusti || [];
    const pending = popusti.filter((item) => item.status === "pending").length;
    const approved = popusti.filter((item) => item.status === "approved").length;
    const rejected = popusti.filter((item) => item.status === "rejected").length;

    return {
      cards: [
        { label: "Na cekanju", value: String(pending) },
        { label: "Odobreno", value: String(approved) },
        { label: "Odbijeno", value: String(rejected) },
      ],
      note:
        pending > 0
          ? `Trenutno ceka moderaciju ${pending} promocija.`
          : "Trenutno nema promocija koje cekaju moderaciju.",
    };
  }

  if (module === "stipendije") {
    const response = await api.get<{
      konkursi: Array<{
        aktivan?: boolean;
        tip?: string | null;
      }>;
    }>("/stipendije/admin");
    const konkursi = response.data.konkursi || [];
    const aktivni = konkursi.filter((item) => item.aktivan).length;
    const stipendije = konkursi.filter((item) => item.tip === "stipendija").length;
    const krediti = konkursi.filter((item) => item.tip === "kredit").length;

    return {
      cards: [
        { label: "Aktivni konkursi", value: String(aktivni) },
        { label: "Stipendije", value: String(stipendije) },
        { label: "Krediti", value: String(krediti) },
      ],
      note:
        konkursi.length > 0
          ? `Ukupno je evidentirano ${konkursi.length} konkursa.`
          : "Trenutno nema evidentiranih konkursa.",
    };
  }

  return {
    cards: [
      { label: "Dom", value: user?.dorm || "Administracija" },
      { label: "Studenti", value: "Pretraga" },
      { label: "Obaveze", value: "Evidencija" },
    ],
    note: user?.dorm
      ? `Ovaj nalog vodi evidenciju za ${user.dorm}.`
      : "Ovaj sektor pokriva studente, obaveze i obavjestenja doma.",
  };
}

function getFallbackSummary(
  module: AdminManagedModule,
  user?: AuthUser | null
): ModuleSummary {
  if (module === "menza") {
    return {
      cards: [
        { label: "Datum", value: formatDate(getTodayISO()) },
        { label: "Meni", value: "Provjera" },
        { label: "Obavjestenja", value: "U toku" },
      ],
      note: "Pregled menze je spreman za osvjezavanje podataka.",
    };
  }

  if (module === "citaona") {
    return {
      cards: [
        { label: "Rezervacije", value: "Pregled" },
        { label: "Kodovi", value: "Potvrda" },
        { label: "Mjesta", value: "Kontrola" },
      ],
      note: "Pregled citaonice je spreman za administrativni rad.",
    };
  }

  if (module === "popusti") {
    return {
      cards: [
        { label: "Promocije", value: "Moderacija" },
        { label: "Statusi", value: "Pregled" },
        { label: "Partneri", value: "Kontrola" },
      ],
      note: "Ovdje pratis i odobravas partnerske promocije.",
    };
  }

  if (module === "stipendije") {
    return {
      cards: [
        { label: "Konkursi", value: "Pregled" },
        { label: "Rokovi", value: "Azuriranje" },
        { label: "Objave", value: "Kontrola" },
      ],
      note: "Ovdje uredjujes konkurse za stipendije i kredite.",
    };
  }

  return {
    cards: [
      { label: "Dom", value: user?.dorm || "Administracija" },
      { label: "Studenti", value: "Pretraga" },
      { label: "Obaveze", value: "Evidencija" },
    ],
    note: "Ovdje upravljas studentima doma, obavezama i obavjestenjima.",
  };
}

const styles = StyleSheet.create({
  buttonColumn: {
    gap: 10,
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
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
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
    fontSize: 24,
    fontWeight: "800",
  },
  switchBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  switchCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  switchGrid: {
    gap: 12,
  },
  switchTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  taskRow: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  taskText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
