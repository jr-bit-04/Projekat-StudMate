import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { AvatarCircle } from "../../components/AvatarCircle";
import { InfoBadge } from "../../components/InfoBadge";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { AdminManagedModule } from "../../data/adminModules";
import { colors } from "../../theme/colors";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getTodayISO,
  mealLabel,
  reservationStatusLabel,
} from "../../utils/format";

const MONTH_OPTIONS = [
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
] as const;

const MEAL_OPTIONS = [
  { label: "Dorucak", value: "dorucak" },
  { label: "Rucak", value: "rucak" },
  { label: "Vecera", value: "vecera" },
] as const;

const RESERVATION_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "1 h 30", value: 90 },
  { label: "2 h", value: 120 },
  { label: "3 h", value: 180 },
] as const;

type NoticeModule = "dom" | "menza";
type MealType = (typeof MEAL_OPTIONS)[number]["value"];
type ScholarshipType = "stipendija" | "kredit";
type MonthType = (typeof MONTH_OPTIONS)[number];

interface AdminModuleTasksProps {
  module: AdminManagedModule;
  onChanged?: () => void;
  refreshToken?: number;
}

interface PanelProps {
  onChanged?: () => void;
  refreshToken: number;
}

interface NoticeRecord {
  id: number;
  naslov: string;
  opis: string;
  kategorija?: string | null;
  priority?: number | null;
  pinned?: boolean;
  datum_vrijeme?: string | null;
}

interface NoticeFormState {
  naslov: string;
  opis: string;
  kategorija: string;
  priority: string;
  pinned: boolean;
}

interface MenzaMenuRecord {
  id: number;
  datum: string;
  tip_obroka: MealType;
  aktivan?: boolean;
  dorucak_stavke?: string[];
  glavna_jela?: string[];
  prilozi?: string[];
  salate?: string[];
  dodatno?: string[];
}

interface MenuFormState {
  aktivan: boolean;
  dorucak_stavke: string;
  dodatno: string;
  glavna_jela: string;
  prilozi: string;
  salate: string;
}

interface MenzaStudent {
  id: number;
  name: string;
  email?: string | null;
  faculty?: string | null;
  index_number?: string | null;
  dorm?: string | null;
  profile_image_url?: string | null;
  dorucak?: number;
  rucak?: number;
  vecera?: number;
}

interface BonoviDraft {
  dorucak: string;
  rucak: string;
  vecera: string;
}

interface DomStudent {
  id: number;
  name: string;
  email?: string | null;
  faculty?: string | null;
  index_number?: string | null;
  dorm?: string | null;
  profile_image_url?: string | null;
}

interface DomObligation {
  id: number;
  user_id: number;
  mjesec: MonthType;
  godina: number;
  iznos?: number | null;
  uplaceno?: number | null;
  status?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface DomObligationFormState {
  boravi_u_domu: boolean;
  due_date: string;
  godina: string;
  iznos: string;
  mjesec: MonthType;
  paid_at: string;
  uplaceno: string;
}

interface CitaonaReservation {
  id: number;
  kod?: string | null;
  datum?: string | null;
  vrijeme_od?: string | null;
  vrijeme_do?: string | null;
  status?: string | null;
  admin_note?: string | null;
  created_by_admin?: boolean;
  tracking_enabled?: boolean;
  outside_since?: string | null;
  last_location_at?: string | null;
  last_distance_meters?: number | null;
  auto_cancelled_at?: string | null;
  cancellation_reason?: string | null;
  name?: string | null;
  index_number?: string | null;
  profile_image_url?: string | null;
  broj_mjesta?: number | null;
}

interface CitaonaSeat {
  id: number;
  broj_mjesta: number;
  zauzeto?: boolean;
}

interface PopustRecord {
  id: number;
  naslov: string;
  opis?: string | null;
  kategorija?: string | null;
  vrijednost?: string | null;
  kod?: string | null;
  valid_until?: string | null;
  lokacija?: string | null;
  status?: string | null;
  aktivan?: boolean;
  partner_naziv?: string | null;
  kontakt_email?: string | null;
  tip?: string | null;
}

interface ApiPartnerRecord {
  id: number;
  naziv: string;
  website?: string | null;
  logo_url?: string | null;
  kontakt_email?: string | null;
  api_key?: string | null;
  status?: string | null;
  created_at?: string | null;
}

interface ApiPartnerFormState {
  kontakt_email: string;
  logo_url: string;
  naziv: string;
  website: string;
}

interface ScholarshipRecord {
  id: number;
  naslov: string;
  institucija: string;
  tip: ScholarshipType;
  opis: string;
  iznos?: string | number | null;
  rok: string;
  link?: string | null;
  aktivan?: boolean;
  created_at?: string | null;
}

interface ScholarshipFormState {
  aktivan: boolean;
  institucija: string;
  iznos: string;
  link: string;
  naslov: string;
  opis: string;
  rok: string;
  tip: ScholarshipType;
}

function getDefaultNoticeForm(kategorija: string): NoticeFormState {
  return {
    naslov: "",
    opis: "",
    kategorija,
    priority: "1",
    pinned: false,
  };
}

function getEmptyMenuForm(): MenuFormState {
  return {
    aktivan: true,
    dorucak_stavke: "",
    dodatno: "",
    glavna_jela: "",
    prilozi: "",
    salate: "",
  };
}

function getDefaultObligationForm(): DomObligationFormState {
  return {
    boravi_u_domu: true,
    due_date: getTodayISO(),
    godina: String(new Date().getFullYear()),
    iznos: "",
    mjesec: MONTH_OPTIONS[new Date().getMonth()],
    paid_at: "",
    uplaceno: "",
  };
}

function getDefaultScholarshipForm(): ScholarshipFormState {
  return {
    aktivan: true,
    institucija: "",
    iznos: "",
    link: "",
    naslov: "",
    opis: "",
    rok: getTodayISO(),
    tip: "stipendija",
  };
}

function getDefaultApiPartnerForm(): ApiPartnerFormState {
  return {
    kontakt_email: "",
    logo_url: "",
    naziv: "",
    website: "",
  };
}

export function AdminModuleTasks({
  module,
  onChanged,
  refreshToken = 0,
}: AdminModuleTasksProps) {
  if (module === "menza") {
    return <MenzaAdminPanel onChanged={onChanged} refreshToken={refreshToken} />;
  }

  if (module === "dom") {
    return <DomAdminPanel onChanged={onChanged} refreshToken={refreshToken} />;
  }

  if (module === "citaona") {
    return <CitaonaAdminPanel onChanged={onChanged} refreshToken={refreshToken} />;
  }

  if (module === "popusti") {
    return <PopustiAdminPanel onChanged={onChanged} refreshToken={refreshToken} />;
  }

  return <StipendijeAdminPanel onChanged={onChanged} refreshToken={refreshToken} />;
}

function MenzaAdminPanel({ onChanged, refreshToken }: PanelProps) {
  const [datum, setDatum] = useState(getTodayISO());
  const [tipObroka, setTipObroka] = useState<MealType>("dorucak");
  const [menus, setMenus] = useState<MenzaMenuRecord[]>([]);
  const [menuForm, setMenuForm] = useState<MenuFormState>(getEmptyMenuForm());
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");
  const [menuSuccess, setMenuSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<MenzaStudent[]>([]);
  const [studentDrafts, setStudentDrafts] = useState<Record<number, BonoviDraft>>({});
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentSavingId, setStudentSavingId] = useState<number | null>(null);
  const [studentMessage, setStudentMessage] = useState("");
  const [studentSuccess, setStudentSuccess] = useState("");

  const activeMenu = useMemo(
    () => menus.find((item) => item.tip_obroka === tipObroka),
    [menus, tipObroka]
  );

  const loadMenus = useCallback(async () => {
    try {
      setMenuLoading(true);
      setMenuMessage("");
      const response = await api.get<{ meni: MenzaMenuRecord[] }>("/menza/admin/meni", {
        params: { datum },
      });
      setMenus(response.data.meni || []);
    } catch (error) {
      setMenuMessage(getApiErrorMessage(error, "Greska pri ucitavanju menija."));
    } finally {
      setMenuLoading(false);
    }
  }, [datum]);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus, refreshToken]);

  useEffect(() => {
    if (!activeMenu) {
      setMenuForm(getEmptyMenuForm());
      return;
    }

    setMenuForm({
      aktivan: activeMenu.aktivan !== false,
      dorucak_stavke: joinLines(activeMenu.dorucak_stavke),
      dodatno: joinLines(activeMenu.dodatno),
      glavna_jela: joinLines(activeMenu.glavna_jela),
      prilozi: joinLines(activeMenu.prilozi),
      salate: joinLines(activeMenu.salate),
    });
  }, [activeMenu]);

  const searchStudents = useCallback(async () => {
    try {
      setStudentLoading(true);
      setStudentMessage("");
      const response = await api.get<{ students: MenzaStudent[] }>("/menza/admin/studenti", {
        params: { search },
      });
      const nextStudents = response.data.students || [];
      setStudents(nextStudents);
      setStudentDrafts((current) => {
        const nextDrafts = { ...current };
        nextStudents.forEach((student) => {
          nextDrafts[student.id] = {
            dorucak: String(student.dorucak ?? 0),
            rucak: String(student.rucak ?? 0),
            vecera: String(student.vecera ?? 0),
          };
        });
        return nextDrafts;
      });
    } catch (error) {
      setStudentMessage(
        getApiErrorMessage(error, "Greska pri ucitavanju studentskih bonova.")
      );
    } finally {
      setStudentLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (students.length > 0) {
      void searchStudents();
    }
  }, [refreshToken, searchStudents, students.length]);

  async function saveMenu() {
    try {
      setMenuSaving(true);
      setMenuMessage("");
      setMenuSuccess("");

      const payload = {
        datum,
        tip_obroka: tipObroka,
        dorucak_stavke: splitLines(menuForm.dorucak_stavke),
        dodatno: splitLines(menuForm.dodatno),
        glavna_jela: splitLines(menuForm.glavna_jela),
        prilozi: splitLines(menuForm.prilozi),
        salate: splitLines(menuForm.salate),
        aktivan: menuForm.aktivan,
      };

      if (activeMenu) {
        const response = await api.put(`/menza/admin/meni/${activeMenu.id}`, payload);
        setMenuSuccess(response.data?.message || "Meni je izmijenjen.");
      } else {
        const response = await api.post("/menza/admin/meni", payload);
        setMenuSuccess(response.data?.message || "Meni je dodat.");
      }

      await loadMenus();
      onChanged?.();
    } catch (error) {
      setMenuMessage(getApiErrorMessage(error, "Greska pri cuvanju menija."));
    } finally {
      setMenuSaving(false);
    }
  }

  function confirmDeleteMenu() {
    if (!activeMenu) {
      setMenuMessage("Za izabrani obrok jos nema sacuvanog menija.");
      return;
    }

    Alert.alert("Obrisi meni", "Obrisati meni za izabrani obrok?", [
      { style: "cancel", text: "Nazad" },
      {
        style: "destructive",
        text: "Obrisi",
        onPress: () => void deleteMenu(),
      },
    ]);
  }

  async function deleteMenu() {
    if (!activeMenu) {
      return;
    }

    try {
      setMenuSaving(true);
      setMenuMessage("");
      setMenuSuccess("");
      const response = await api.delete(`/menza/admin/meni/${activeMenu.id}`);
      setMenuSuccess(response.data?.message || "Meni je obrisan.");
      await loadMenus();
      onChanged?.();
    } catch (error) {
      setMenuMessage(getApiErrorMessage(error, "Greska pri brisanju menija."));
    } finally {
      setMenuSaving(false);
    }
  }

  async function saveBonovi(studentId: number) {
    const draft = studentDrafts[studentId];
    if (!draft) {
      return;
    }

    try {
      setStudentSavingId(studentId);
      setStudentMessage("");
      setStudentSuccess("");
      const response = await api.put(`/menza/admin/bonovi/${studentId}`, {
        dorucak: sanitizeWholeNumber(draft.dorucak),
        rucak: sanitizeWholeNumber(draft.rucak),
        vecera: sanitizeWholeNumber(draft.vecera),
      });
      setStudentSuccess(response.data?.message || "Bonovi su sacuvani.");
      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? {
                ...student,
                dorucak: sanitizeWholeNumber(draft.dorucak),
                rucak: sanitizeWholeNumber(draft.rucak),
                vecera: sanitizeWholeNumber(draft.vecera),
              }
            : student
        )
      );
      onChanged?.();
    } catch (error) {
      setStudentMessage(getApiErrorMessage(error, "Greska pri cuvanju bonova."));
    } finally {
      setStudentSavingId(null);
    }
  }

  return (
    <>
      <SectionCard
        right={<InfoBadge value={formatDate(datum)} />}
        subtitle="Dodavanje, izmjena i brisanje menija za svaki obrok."
        title="Meni"
      >
        {menuMessage ? <StatusBanner text={menuMessage} tone="danger" /> : null}
        {menuSuccess ? <StatusBanner text={menuSuccess} tone="success" /> : null}

        <AdminField
          label="Datum"
          onChangeText={setDatum}
          placeholder="YYYY-MM-DD"
          value={datum}
        />

        <ChoiceRow
          label="Obrok"
          options={MEAL_OPTIONS.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          onChange={(value) => setTipObroka(value as MealType)}
          value={tipObroka}
        />

        <View style={styles.inlineWrap}>
          {MEAL_OPTIONS.map((item) => {
            const exists = menus.some((menu) => menu.tip_obroka === item.value);
            return (
              <View key={item.value} style={styles.stateChip}>
                <Text style={styles.stateChipTitle}>{item.label}</Text>
                <Text style={styles.stateChipText}>{exists ? "Sacuvano" : "Prazno"}</Text>
              </View>
            );
          })}
        </View>

        {activeMenu ? (
          <StatusBanner
            text={`Uredjujes sacuvani meni za ${mealLabel(activeMenu.tip_obroka)}.`}
            tone="info"
          />
        ) : (
          <StatusBanner
            text={`Za ${mealLabel(tipObroka)} jos nema unesenog menija. Sacuvaj novi unos.`}
          />
        )}

        <AdminTextArea
          label="Stavke dorucka"
          onChangeText={(value) => setMenuForm((current) => ({ ...current, dorucak_stavke: value }))}
          placeholder="Svaka stavka u novom redu"
          value={menuForm.dorucak_stavke}
        />
        <AdminTextArea
          label="Glavna jela"
          onChangeText={(value) => setMenuForm((current) => ({ ...current, glavna_jela: value }))}
          placeholder="Svako jelo u novom redu"
          value={menuForm.glavna_jela}
        />
        <AdminTextArea
          label="Prilozi"
          onChangeText={(value) => setMenuForm((current) => ({ ...current, prilozi: value }))}
          placeholder="Pomfrit, pirinac, hljeb..."
          value={menuForm.prilozi}
        />
        <AdminTextArea
          label="Salate"
          onChangeText={(value) => setMenuForm((current) => ({ ...current, salate: value }))}
          placeholder="Kupus, mijesana..."
          value={menuForm.salate}
        />
        <AdminTextArea
          label="Dodatno"
          onChangeText={(value) => setMenuForm((current) => ({ ...current, dodatno: value }))}
          placeholder="Supa, kolac, voce..."
          value={menuForm.dodatno}
        />

        <ToggleRow
          description="Ako je iskljuceno, meni ostaje sacuvan ali nije aktivan."
          label="Aktivan meni"
          onValueChange={(value) => setMenuForm((current) => ({ ...current, aktivan: value }))}
          value={menuForm.aktivan}
        />

        {menuLoading ? <LoadingState text="Ucitavanje menija..." /> : null}

        <View style={styles.buttonColumn}>
          <AppButton
            label={menuSaving ? "Cuvanje..." : activeMenu ? "Sacuvaj izmjene" : "Dodaj meni"}
            loading={menuSaving}
            onPress={() => void saveMenu()}
          />
          <AppButton
            label="Obrisi obrok"
            onPress={confirmDeleteMenu}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        right={<InfoBadge value={`${students.length}`} />}
        subtitle="Pretraga studenata i izmjena broja bonova za svaki obrok."
        title="Bonovi"
      >
        {studentMessage ? <StatusBanner text={studentMessage} tone="danger" /> : null}
        {studentSuccess ? <StatusBanner text={studentSuccess} tone="success" /> : null}

        <AdminField
          label="Pretraga studenata"
          onChangeText={setSearch}
          placeholder="Ime, email, fakultet ili indeks"
          value={search}
        />

        <View style={styles.buttonColumn}>
          <AppButton
            label={studentLoading ? "Pretraga..." : "Pretrazi studente"}
            loading={studentLoading}
            onPress={() => void searchStudents()}
          />
        </View>

        {students.length === 0 ? (
          <Text style={styles.emptyText}>
            Pokreni pretragu da otvoris spisak studenata i njihove bonove.
          </Text>
        ) : (
          students.map((student) => {
            const draft = studentDrafts[student.id] || {
              dorucak: "0",
              rucak: "0",
              vecera: "0",
            };

            return (
              <View key={student.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordIdentity}>
                    <AvatarCircle
                      name={student.name}
                      size={52}
                      src={student.profile_image_url}
                    />
                    <View style={styles.recordIdentityText}>
                      <Text style={styles.recordTitle}>{student.name}</Text>
                      <Text style={styles.recordMeta}>
                        {student.index_number || "-"} • {student.faculty || "-"}
                      </Text>
                    </View>
                  </View>
                  <InfoBadge value={student.dorm || "Student"} />
                </View>

                <View style={styles.fieldGrid}>
                  <AdminField
                    compact
                    keyboardType="numeric"
                    label="Dorucak"
                    onChangeText={(value) =>
                      setStudentDrafts((current) => ({
                        ...current,
                        [student.id]: { ...draft, dorucak: value },
                      }))
                    }
                    value={draft.dorucak}
                  />
                  <AdminField
                    compact
                    keyboardType="numeric"
                    label="Rucak"
                    onChangeText={(value) =>
                      setStudentDrafts((current) => ({
                        ...current,
                        [student.id]: { ...draft, rucak: value },
                      }))
                    }
                    value={draft.rucak}
                  />
                  <AdminField
                    compact
                    keyboardType="numeric"
                    label="Vecera"
                    onChangeText={(value) =>
                      setStudentDrafts((current) => ({
                        ...current,
                        [student.id]: { ...draft, vecera: value },
                      }))
                    }
                    value={draft.vecera}
                  />
                </View>

                <AppButton
                  label={studentSavingId === student.id ? "Cuvanje..." : "Sacuvaj bonove"}
                  loading={studentSavingId === student.id}
                  onPress={() => void saveBonovi(student.id)}
                />
              </View>
            );
          })
        )}
      </SectionCard>

      <NoticeManager
        moduleKey="menza"
        moduleLabel="Menza"
        onChanged={onChanged}
        refreshToken={refreshToken}
      />
    </>
  );
}

function DomAdminPanel({ onChanged, refreshToken }: PanelProps) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<DomStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<DomStudent | null>(null);
  const [obligations, setObligations] = useState<DomObligation[]>([]);
  const [form, setForm] = useState<DomObligationFormState>(getDefaultObligationForm());
  const [studentLoading, setStudentLoading] = useState(false);
  const [obligationLoading, setObligationLoading] = useState(false);
  const [obligationSaving, setObligationSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const searchStudents = useCallback(async () => {
    try {
      setStudentLoading(true);
      setMessage("");
      const response = await api.get<{ students: DomStudent[] }>("/dom/admin/studenti", {
        params: { search },
      });
      setStudents(response.data.students || []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju studenata doma."));
    } finally {
      setStudentLoading(false);
    }
  }, [search]);

  const loadObligations = useCallback(async (studentId: number) => {
    try {
      setObligationLoading(true);
      setMessage("");
      const response = await api.get<{
        student: DomStudent;
        obligations: DomObligation[];
      }>(`/dom/admin/studenti/${studentId}/obaveze`);
      setSelectedStudent(response.data.student || null);
      setObligations(response.data.obligations || []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju obaveza studenta."));
    } finally {
      setObligationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      void searchStudents();
    }

    if (selectedStudent?.id) {
      void loadObligations(selectedStudent.id);
    }
  }, [loadObligations, refreshToken, searchStudents, selectedStudent?.id, students.length]);

  async function saveObligation() {
    if (!selectedStudent) {
      setMessage("Prvo izaberi studenta doma.");
      return;
    }

    try {
      setObligationSaving(true);
      setMessage("");
      setSuccess("");
      const response = await api.post(`/dom/admin/studenti/${selectedStudent.id}/obaveze`, {
        mjesec: form.mjesec,
        godina: Number(form.godina) || new Date().getFullYear(),
        iznos: sanitizeDecimal(form.iznos),
        uplaceno: sanitizeDecimal(form.uplaceno),
        due_date: form.due_date || null,
        paid_at: form.paid_at || null,
        boravi_u_domu: form.boravi_u_domu,
      });
      setSuccess(response.data?.message || "Obaveza je sacuvana.");
      await loadObligations(selectedStudent.id);
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri cuvanju obaveze."));
    } finally {
      setObligationSaving(false);
    }
  }

  function loadExistingObligation(item: DomObligation) {
    setForm({
      boravi_u_domu: item.status !== "inactive",
      due_date: item.due_date ? String(item.due_date).slice(0, 10) : "",
      godina: String(item.godina),
      iznos: item.iznos !== null && item.iznos !== undefined ? String(item.iznos) : "",
      mjesec: item.mjesec,
      paid_at: item.paid_at ? String(item.paid_at).slice(0, 10) : "",
      uplaceno:
        item.uplaceno !== null && item.uplaceno !== undefined ? String(item.uplaceno) : "",
    });
  }

  function confirmDeleteObligation(id: number) {
    Alert.alert("Obrisi obavezu", "Obrisati izabranu obavezu studenta?", [
      { style: "cancel", text: "Nazad" },
      {
        style: "destructive",
        text: "Obrisi",
        onPress: () => void deleteObligation(id),
      },
    ]);
  }

  async function deleteObligation(id: number) {
    if (!selectedStudent) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage("");
      setSuccess("");
      const response = await api.delete(`/dom/admin/obaveze/${id}`);
      setSuccess(response.data?.message || "Obaveza je obrisana.");
      await loadObligations(selectedStudent.id);
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri brisanju obaveze."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <SectionCard
        right={<InfoBadge value={`${students.length}`} />}
        subtitle="Pretraga studenata doma i otvaranje njihove evidencije obaveza."
        title="Studenti doma"
      >
        {message ? <StatusBanner text={message} tone="danger" /> : null}
        {success ? <StatusBanner text={success} tone="success" /> : null}

        <AdminField
          label="Pretraga studenata"
          onChangeText={setSearch}
          placeholder="Ime, email, fakultet ili indeks"
          value={search}
        />

        <AppButton
          label={studentLoading ? "Pretraga..." : "Pretrazi studente"}
          loading={studentLoading}
          onPress={() => void searchStudents()}
        />

        {students.length === 0 ? (
          <Text style={styles.emptyText}>
            Pokreni pretragu da otvoris studente i njihove mjesecne obaveze.
          </Text>
        ) : (
          students.map((student) => (
            <Pressable
              key={student.id}
              onPress={() => void loadObligations(student.id)}
              style={({ pressed }) => [
                styles.recordCard,
                selectedStudent?.id === student.id ? styles.selectedCard : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.recordHeader}>
                <View style={styles.recordIdentity}>
                  <AvatarCircle
                    name={student.name}
                    size={52}
                    src={student.profile_image_url}
                  />
                  <View style={styles.recordIdentityText}>
                    <Text style={styles.recordTitle}>{student.name}</Text>
                    <Text style={styles.recordMeta}>
                      {student.index_number || "-"} • {student.dorm || "-"}
                    </Text>
                  </View>
                </View>
                <InfoBadge value="Otvori" />
              </View>
            </Pressable>
          ))
        )}
      </SectionCard>

      <SectionCard
        right={
          selectedStudent ? (
            <InfoBadge value={selectedStudent.index_number || "Student"} />
          ) : undefined
        }
        subtitle="Dodavanje i izmjena mjesecnih obaveza izabranog studenta."
        title="Obaveze"
      >
        {!selectedStudent ? (
          <Text style={styles.emptyText}>
            Izaberi studenta iz spiska iznad da otvoris obaveze doma.
          </Text>
        ) : (
          <>
            <View style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordIdentity}>
                  <AvatarCircle
                    name={selectedStudent.name}
                    size={52}
                    src={selectedStudent.profile_image_url}
                  />
                  <View style={styles.recordIdentityText}>
                    <Text style={styles.recordTitle}>{selectedStudent.name}</Text>
                    <Text style={styles.recordMeta}>
                      {selectedStudent.faculty || "-"} • {selectedStudent.email || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <ChoiceRow
              label="Mjesec"
              options={MONTH_OPTIONS.map((item) => ({ label: item, value: item }))}
              onChange={(value) =>
                setForm((current) => ({ ...current, mjesec: value as MonthType }))
              }
              value={form.mjesec}
            />

            <View style={styles.fieldGrid}>
              <AdminField
                compact
                keyboardType="numeric"
                label="Godina"
                onChangeText={(value) => setForm((current) => ({ ...current, godina: value }))}
                value={form.godina}
              />
              <AdminField
                compact
                keyboardType="numeric"
                label="Iznos"
                onChangeText={(value) => setForm((current) => ({ ...current, iznos: value }))}
                placeholder="0"
                value={form.iznos}
              />
              <AdminField
                compact
                keyboardType="numeric"
                label="Uplaceno"
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, uplaceno: value }))
                }
                placeholder="0"
                value={form.uplaceno}
              />
            </View>

            <View style={styles.fieldGrid}>
              <AdminField
                compact
                label="Rok placanja"
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, due_date: value }))
                }
                placeholder="YYYY-MM-DD"
                value={form.due_date}
              />
              <AdminField
                compact
                label="Datum uplate"
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, paid_at: value }))
                }
                placeholder="YYYY-MM-DD"
                value={form.paid_at}
              />
            </View>

            <ToggleRow
              description="Ako je iskljuceno, obaveza ide u neaktivno stanje."
              label="Student boravi u domu"
              onValueChange={(value) =>
                setForm((current) => ({ ...current, boravi_u_domu: value }))
              }
              value={form.boravi_u_domu}
            />

            <View style={styles.buttonColumn}>
              <AppButton
                label={obligationSaving ? "Cuvanje..." : "Sacuvaj obavezu"}
                loading={obligationSaving}
                onPress={() => void saveObligation()}
              />
              <AppButton
                label="Ocisti formu"
                onPress={() => setForm(getDefaultObligationForm())}
                variant="secondary"
              />
            </View>

            {obligationLoading ? <LoadingState text="Ucitavanje obaveza..." /> : null}

            {obligations.length === 0 ? (
              <Text style={styles.emptyText}>Student jos nema evidentiranih obaveza.</Text>
            ) : (
              obligations.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View>
                      <Text style={styles.recordTitle}>
                        {item.mjesec} {item.godina}
                      </Text>
                      <Text style={styles.recordMeta}>
                        {formatMoney(item.iznos)} • uplaceno {formatMoney(item.uplaceno)}
                      </Text>
                    </View>
                    <InfoBadge value={obligationStatusLabel(item.status)} tone={obligationTone(item.status)} />
                  </View>
                  <Text style={styles.recordBody}>
                    Rok: {formatDate(item.due_date)} • Uplata: {formatDate(item.paid_at)}
                  </Text>
                  <View style={styles.inlineActions}>
                    <SmallActionButton
                      label="Ucitaj"
                      onPress={() => loadExistingObligation(item)}
                    />
                    <SmallActionButton
                      danger
                      disabled={deletingId === item.id}
                      label={deletingId === item.id ? "Brisanje..." : "Obrisi"}
                      onPress={() => confirmDeleteObligation(item.id)}
                    />
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </SectionCard>

      <NoticeManager
        moduleKey="dom"
        moduleLabel="Dom"
        onChanged={onChanged}
        refreshToken={refreshToken}
      />
    </>
  );
}

function CitaonaAdminPanel({ onChanged, refreshToken }: PanelProps) {
  const [kod, setKod] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reservations, setReservations] = useState<CitaonaReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [datum, setDatum] = useState(getTodayISO());
  const [vrijemeOd, setVrijemeOd] = useState("07:00");
  const [trajanje, setTrajanje] = useState("60");
  const [adminNote, setAdminNote] = useState("");
  const [seats, setSeats] = useState<CitaonaSeat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [radi, setRadi] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSeat = useMemo(
    () => seats.find((seat) => seat.id === selectedSeatId) || null,
    [seats, selectedSeatId]
  );

  const loadReservations = useCallback(async () => {
    try {
      setLoadingReservations(true);
      setMessage("");
      const response = await api.get<{ rezervacije: CitaonaReservation[] }>(
        "/citaona/admin/rezervacije"
      );
      setReservations(response.data.rezervacije || []);
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Greska pri ucitavanju rezervacija citaonice.")
      );
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  const loadSeats = useCallback(async () => {
    try {
      setLoadingSeats(true);
      setMessage("");
      const response = await api.get<{
        mjesta: CitaonaSeat[];
        radi: boolean;
      }>("/citaona", {
        params: {
          datum,
          vrijeme_od: vrijemeOd,
          trajanje: Number(trajanje) || 60,
        },
      });
      setSeats(response.data.mjesta || []);
      setRadi(response.data.radi !== false);
      setSelectedSeatId(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju mjesta."));
    } finally {
      setLoadingSeats(false);
    }
  }, [datum, trajanje, vrijemeOd]);

  useEffect(() => {
    void loadReservations();
    void loadSeats();
  }, [loadReservations, loadSeats, refreshToken]);

  async function confirmCode() {
    if (!kod.trim()) {
      setMessage("Unesi kod rezervacije.");
      return;
    }

    try {
      setConfirming(true);
      setMessage("");
      setSuccess("");
      const response = await api.post("/citaona/admin/potvrdi", {
        kod: kod.trim().toUpperCase(),
      });
      setSuccess(response.data?.message || "Rezervacija je potvrdjena.");
      setKod("");
      await loadReservations();
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri potvrdi rezervacije."));
    } finally {
      setConfirming(false);
    }
  }

  async function createAdminReservation() {
    if (!selectedSeatId) {
      setMessage("Prvo izaberi slobodno mjesto.");
      return;
    }

    try {
      setSavingReservation(true);
      setMessage("");
      setSuccess("");
      const response = await api.post("/citaona/admin/rezervacija", {
        datum,
        vrijeme_od: vrijemeOd,
        trajanje: Number(trajanje) || 60,
        mjesto_id: selectedSeatId,
        admin_note: adminNote.trim() || null,
      });
      setSuccess(response.data?.message || "Mjesto je zauzeto.");
      setAdminNote("");
      await Promise.all([loadReservations(), loadSeats()]);
      onChanged?.();
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Greska pri kreiranju admin rezervacije.")
      );
    } finally {
      setSavingReservation(false);
    }
  }

  return (
    <>
      <SectionCard
        subtitle="Potvrda dolaska studenta preko koda sa rezervacije."
        title="Potvrda koda"
      >
        {message ? <StatusBanner text={message} tone="danger" /> : null}
        {success ? <StatusBanner text={success} tone="success" /> : null}

        <AdminField
          autoCapitalize="characters"
          label="Kod rezervacije"
          onChangeText={setKod}
          placeholder="Na primjer MGOZDZ"
          value={kod}
        />

        <AppButton
          label={confirming ? "Potvrdjujem..." : "Potvrdi dolazak"}
          loading={confirming}
          onPress={() => void confirmCode()}
        />
      </SectionCard>

      <SectionCard
        right={
          <InfoBadge
            value={selectedSeat ? `Mjesto ${selectedSeat.broj_mjesta}` : "Slobodno"}
          />
        }
        subtitle="Brzo zauzimanje mjesta iz admin aplikacije."
        title="Admin rezervacija"
      >
        <View style={styles.fieldGrid}>
          <AdminField
            compact
            label="Datum"
            onChangeText={setDatum}
            placeholder="YYYY-MM-DD"
            value={datum}
          />
          <AdminField
            compact
            label="Pocetak"
            onChangeText={setVrijemeOd}
            placeholder="07:00"
            value={vrijemeOd}
          />
        </View>

        <ChoiceRow
          label="Trajanje"
          options={RESERVATION_DURATIONS.map((item) => ({
            label: item.label,
            value: String(item.value),
          }))}
          onChange={(value) => setTrajanje(value)}
          value={trajanje}
        />

        <AdminTextArea
          label="Admin napomena"
          onChangeText={setAdminNote}
          placeholder="Napomena za ovu rezervaciju"
          value={adminNote}
        />

        {!radi ? (
          <StatusBanner
            text="Citaonica ne radi u izabranom terminu."
            tone="warning"
          />
        ) : null}

        <View style={styles.buttonColumn}>
          <AppButton
            label={loadingSeats ? "Ucitavanje mjesta..." : "Osvjezi mjesta"}
            loading={loadingSeats}
            onPress={() => void loadSeats()}
            variant="secondary"
          />
        </View>

        <View style={styles.seatGrid}>
          {seats.map((seat) => {
            const disabled = seat.zauzeto;
            const selected = selectedSeatId === seat.id;
            return (
              <Pressable
                key={seat.id}
                disabled={disabled}
                onPress={() => setSelectedSeatId(seat.id)}
                style={({ pressed }) => [
                  styles.seatCard,
                  disabled ? styles.seatCardDisabled : null,
                  selected ? styles.seatCardSelected : null,
                  pressed && !disabled ? styles.pressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.seatCardNumber,
                    selected ? styles.seatCardNumberSelected : null,
                  ]}
                >
                  {seat.broj_mjesta}
                </Text>
                <Text
                  style={[
                    styles.seatCardMeta,
                    selected ? styles.seatCardMetaSelected : null,
                  ]}
                >
                  {disabled ? "Zauzeto" : selected ? "Odabrano" : "Slobodno"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          label={savingReservation ? "Cuvanje..." : "Zauzmi mjesto"}
          loading={savingReservation}
          onPress={() => void createAdminReservation()}
        />
      </SectionCard>

      <SectionCard
        right={<InfoBadge value={`${reservations.length}`} />}
        subtitle="Aktivne, cekajuce, otkazane i zavrsene rezervacije."
        title="Sve rezervacije"
      >
        {loadingReservations ? <LoadingState text="Ucitavanje rezervacija..." /> : null}
        {reservations.length === 0 ? (
          <Text style={styles.emptyText}>Trenutno nema rezervacija za prikaz.</Text>
        ) : (
          reservations.slice(0, 20).map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordIdentity}>
                  <AvatarCircle
                    name={item.name}
                    size={50}
                    src={item.profile_image_url}
                  />
                  <View style={styles.recordIdentityText}>
                    <Text style={styles.recordTitle}>{item.name || "Student"}</Text>
                    <Text style={styles.recordMeta}>
                      {item.index_number || "-"} • mjesto {item.broj_mjesta || "-"}
                    </Text>
                  </View>
                </View>
                <InfoBadge
                  tone={citaonaTone(item.status)}
                  value={reservationStatusLabel(item.status)}
                />
              </View>

              <Text style={styles.recordBody}>
                {formatDate(item.datum)} • {item.vrijeme_od || "-"} - {item.vrijeme_do || "-"}
              </Text>

              <Text style={styles.recordSubtle}>
                Kod: {item.kod || "-"} • Lokacija:{" "}
                {item.last_distance_meters !== null && item.last_distance_meters !== undefined
                  ? `${Math.round(item.last_distance_meters)} m`
                  : "nema pinga"}
              </Text>

              {item.admin_note ? (
                <Text style={styles.recordSubtle}>Napomena: {item.admin_note}</Text>
              ) : null}
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

function PopustiAdminPanel({ onChanged, refreshToken }: PanelProps) {
  const [discounts, setDiscounts] = useState<PopustRecord[]>([]);
  const [partners, setPartners] = useState<ApiPartnerRecord[]>([]);
  const [partnerForm, setPartnerForm] = useState<ApiPartnerFormState>(
    getDefaultApiPartnerForm()
  );
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [partnerSaving, setPartnerSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const [discountResponse, partnerResponse] = await Promise.all([
        api.get<{ popusti: PopustRecord[] }>("/popusti/moderacija"),
        api.get<{ partneri: ApiPartnerRecord[] }>("/popusti/moderacija/api-partner"),
      ]);
      setDiscounts(discountResponse.data.popusti || []);
      setPartners(partnerResponse.data.partneri || []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju popusta."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshToken]);

  async function moderateDiscount(id: number, action: "approve" | "reject") {
    try {
      setSavingId(id);
      setMessage("");
      setSuccess("");
      const response = await api.put(`/popusti/moderacija/${id}/${action}`);
      setSuccess(
        response.data?.message ||
          (action === "approve" ? "Popust je odobren." : "Popust je odbijen.")
      );
      await loadData();
      onChanged?.();
    } catch (error) {
      setMessage(
        getApiErrorMessage(error, "Greska pri izmjeni statusa promocije.")
      );
    } finally {
      setSavingId(null);
    }
  }

  async function createPartner() {
    if (!partnerForm.naziv.trim()) {
      setMessage("Unesi naziv API partnera.");
      return;
    }

    try {
      setPartnerSaving(true);
      setMessage("");
      setSuccess("");
      const response = await api.post("/popusti/moderacija/api-partner", {
        naziv: partnerForm.naziv.trim(),
        website: partnerForm.website.trim() || null,
        logo_url: partnerForm.logo_url.trim() || null,
        kontakt_email: partnerForm.kontakt_email.trim() || null,
      });
      setSuccess(response.data?.message || "API partner je dodat.");
      setPartnerForm(getDefaultApiPartnerForm());
      await loadData();
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri dodavanju API partnera."));
    } finally {
      setPartnerSaving(false);
    }
  }

  return (
    <>
      <SectionCard
        right={<InfoBadge value={`${discounts.length}`} />}
        subtitle="Odobravanje ili odbijanje partnerskih promocija."
        title="Moderacija popusta"
      >
        {message ? <StatusBanner text={message} tone="danger" /> : null}
        {success ? <StatusBanner text={success} tone="success" /> : null}
        {loading ? <LoadingState text="Ucitavanje promocija..." /> : null}

        {discounts.length === 0 ? (
          <Text style={styles.emptyText}>Trenutno nema promocija na moderaciji.</Text>
        ) : (
          discounts.map((discount) => (
            <View key={discount.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordIdentityText}>
                  <Text style={styles.recordTitle}>{discount.naslov}</Text>
                  <Text style={styles.recordMeta}>
                    {discount.partner_naziv || "Partner"} • {discount.kategorija || "-"}
                  </Text>
                </View>
                <InfoBadge tone={discountTone(discount.status)} value={discount.status || "-"} />
              </View>

              <Text style={styles.recordBody}>{discount.opis || "Bez opisa."}</Text>
              <Text style={styles.recordSubtle}>
                Vrijednost: {discount.vrijednost || "-"} • Kod: {discount.kod || "-"}
              </Text>
              <Text style={styles.recordSubtle}>
                Vazi do: {formatDate(discount.valid_until)} • Lokacija:{" "}
                {discount.lokacija || "-"}
              </Text>

              <View style={styles.inlineActions}>
                <SmallActionButton
                  disabled={savingId === discount.id}
                  label={savingId === discount.id ? "Obrada..." : "Odobri"}
                  onPress={() => void moderateDiscount(discount.id, "approve")}
                />
                <SmallActionButton
                  danger
                  disabled={savingId === discount.id}
                  label={savingId === discount.id ? "Obrada..." : "Odbij"}
                  onPress={() => void moderateDiscount(discount.id, "reject")}
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard
        right={<InfoBadge value={`${partners.length}`} />}
        subtitle="Dodavanje i pregled API partnera koji salju promocije."
        title="API partneri"
      >
        <AdminField
          label="Naziv partnera"
          onChangeText={(value) => setPartnerForm((current) => ({ ...current, naziv: value }))}
          placeholder="Naziv partnera"
          value={partnerForm.naziv}
        />
        <AdminField
          label="Website"
          onChangeText={(value) => setPartnerForm((current) => ({ ...current, website: value }))}
          placeholder="https://..."
          value={partnerForm.website}
        />
        <AdminField
          label="Logo URL"
          onChangeText={(value) => setPartnerForm((current) => ({ ...current, logo_url: value }))}
          placeholder="https://..."
          value={partnerForm.logo_url}
        />
        <AdminField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Kontakt email"
          onChangeText={(value) =>
            setPartnerForm((current) => ({ ...current, kontakt_email: value }))
          }
          placeholder="partner@email.com"
          value={partnerForm.kontakt_email}
        />

        <View style={styles.buttonColumn}>
          <AppButton
            label={partnerSaving ? "Cuvanje..." : "Dodaj API partnera"}
            loading={partnerSaving}
            onPress={() => void createPartner()}
          />
          <AppButton
            label={loading ? "Osvjezavanje..." : "Osvjezi partnere"}
            loading={loading}
            onPress={() => void loadData()}
            variant="secondary"
          />
        </View>

        {partners.length === 0 ? (
          <Text style={styles.emptyText}>Jos nema dodatih API partnera.</Text>
        ) : (
          partners.map((partner) => (
            <View key={partner.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordIdentityText}>
                  <Text style={styles.recordTitle}>{partner.naziv}</Text>
                  <Text style={styles.recordMeta}>
                    {partner.kontakt_email || "Bez email adrese"}
                  </Text>
                </View>
                <InfoBadge value={partner.status || "active"} />
              </View>
              <Text style={styles.recordSubtle}>Sajt: {partner.website || "-"}</Text>
              <Text style={styles.recordSubtle}>API key: {partner.api_key || "-"}</Text>
              <Text style={styles.recordSubtle}>
                Kreirano: {formatDateTime(partner.created_at)}
              </Text>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

function StipendijeAdminPanel({ onChanged, refreshToken }: PanelProps) {
  const [items, setItems] = useState<ScholarshipRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ScholarshipFormState>(getDefaultScholarshipForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await api.get<{ konkursi: ScholarshipRecord[] }>("/stipendije/admin");
      setItems(response.data.konkursi || []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju konkursa."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshToken]);

  function loadExisting(item: ScholarshipRecord) {
    setEditingId(item.id);
    setForm({
      aktivan: item.aktivan !== false,
      institucija: item.institucija || "",
      iznos: item.iznos !== null && item.iznos !== undefined ? String(item.iznos) : "",
      link: item.link || "",
      naslov: item.naslov || "",
      opis: item.opis || "",
      rok: item.rok ? String(item.rok).slice(0, 10) : getTodayISO(),
      tip: item.tip || "stipendija",
    });
  }

  async function saveItem() {
    try {
      setSaving(true);
      setMessage("");
      setSuccess("");
      const payload = {
        naslov: form.naslov.trim(),
        institucija: form.institucija.trim(),
        tip: form.tip,
        opis: form.opis.trim(),
        iznos: form.iznos.trim() || null,
        rok: form.rok,
        link: form.link.trim() || null,
        aktivan: form.aktivan,
      };

      if (editingId) {
        const response = await api.put(`/stipendije/admin/${editingId}`, payload);
        setSuccess(response.data?.message || "Konkurs je izmijenjen.");
      } else {
        const response = await api.post("/stipendije/admin", payload);
        setSuccess(response.data?.message || "Konkurs je dodat.");
      }

      setForm(getDefaultScholarshipForm());
      setEditingId(null);
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri cuvanju konkursa."));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: number) {
    Alert.alert("Obrisi konkurs", "Obrisati izabrani konkurs?", [
      { style: "cancel", text: "Nazad" },
      {
        style: "destructive",
        text: "Obrisi",
        onPress: () => void deleteItem(id),
      },
    ]);
  }

  async function deleteItem(id: number) {
    try {
      setDeletingId(id);
      setMessage("");
      setSuccess("");
      const response = await api.delete(`/stipendije/admin/${id}`);
      setSuccess(response.data?.message || "Konkurs je obrisan.");
      if (editingId === id) {
        setEditingId(null);
        setForm(getDefaultScholarshipForm());
      }
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri brisanju konkursa."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <SectionCard
        subtitle="Dodavanje i izmjena konkursa za stipendije i kredite."
        title="Konkurs"
      >
        {message ? <StatusBanner text={message} tone="danger" /> : null}
        {success ? <StatusBanner text={success} tone="success" /> : null}

        <AdminField
          label="Naslov"
          onChangeText={(value) => setForm((current) => ({ ...current, naslov: value }))}
          placeholder="Naziv konkursa"
          value={form.naslov}
        />
        <AdminField
          label="Institucija"
          onChangeText={(value) =>
            setForm((current) => ({ ...current, institucija: value }))
          }
          placeholder="Institucija ili fond"
          value={form.institucija}
        />

        <ChoiceRow
          label="Tip"
          options={[
            { label: "Stipendija", value: "stipendija" },
            { label: "Kredit", value: "kredit" },
          ]}
          onChange={(value) =>
            setForm((current) => ({ ...current, tip: value as ScholarshipType }))
          }
          value={form.tip}
        />

        <AdminTextArea
          label="Opis"
          onChangeText={(value) => setForm((current) => ({ ...current, opis: value }))}
          placeholder="Uslovi, dokumentacija, napomene..."
          value={form.opis}
        />

        <View style={styles.fieldGrid}>
          <AdminField
            compact
            keyboardType="numeric"
            label="Iznos"
            onChangeText={(value) => setForm((current) => ({ ...current, iznos: value }))}
            placeholder="0"
            value={form.iznos}
          />
          <AdminField
            compact
            label="Rok"
            onChangeText={(value) => setForm((current) => ({ ...current, rok: value }))}
            placeholder="YYYY-MM-DD"
            value={form.rok}
          />
        </View>

        <AdminField
          label="Link"
          onChangeText={(value) => setForm((current) => ({ ...current, link: value }))}
          placeholder="https://..."
          value={form.link}
        />

        <ToggleRow
          description="Aktivni konkurs se odmah prikazuje studentima."
          label="Aktivan konkurs"
          onValueChange={(value) => setForm((current) => ({ ...current, aktivan: value }))}
          value={form.aktivan}
        />

        <View style={styles.buttonColumn}>
          <AppButton
            label={saving ? "Cuvanje..." : editingId ? "Sacuvaj izmjene" : "Dodaj konkurs"}
            loading={saving}
            onPress={() => void saveItem()}
          />
          <AppButton
            label="Ocisti formu"
            onPress={() => {
              setEditingId(null);
              setForm(getDefaultScholarshipForm());
            }}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        right={<InfoBadge value={`${items.length}`} />}
        subtitle="Pregled svih unesenih konkursa."
        title="Svi konkursi"
      >
        {loading ? <LoadingState text="Ucitavanje konkursa..." /> : null}
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Trenutno nema evidentiranih konkursa.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordIdentityText}>
                  <Text style={styles.recordTitle}>{item.naslov}</Text>
                  <Text style={styles.recordMeta}>
                    {item.institucija} • {item.tip}
                  </Text>
                </View>
                <InfoBadge
                  tone={item.aktivan ? "success" : "warning"}
                  value={item.aktivan ? "Aktivan" : "Neaktivan"}
                />
              </View>
              <Text style={styles.recordBody}>{item.opis}</Text>
              <Text style={styles.recordSubtle}>
                Iznos: {formatMoney(item.iznos)} • Rok: {formatDate(item.rok)}
              </Text>
              {item.link ? (
                <Text style={styles.recordSubtle}>Link: {item.link}</Text>
              ) : null}
              <View style={styles.inlineActions}>
                <SmallActionButton label="Uredi" onPress={() => loadExisting(item)} />
                <SmallActionButton
                  danger
                  disabled={deletingId === item.id}
                  label={deletingId === item.id ? "Brisanje..." : "Obrisi"}
                  onPress={() => confirmDelete(item.id)}
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

function NoticeManager({
  moduleKey,
  moduleLabel,
  onChanged,
  refreshToken,
}: {
  moduleKey: NoticeModule;
  moduleLabel: string;
  onChanged?: () => void;
  refreshToken: number;
}) {
  const [items, setItems] = useState<NoticeRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NoticeFormState>(getDefaultNoticeForm(moduleLabel));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const basePath = `/${moduleKey}/admin/obavjestenja`;

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await api.get<{ obavjestenja: NoticeRecord[] }>(basePath);
      setItems(response.data.obavjestenja || []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri ucitavanju obavjestenja."));
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshToken]);

  function loadExisting(item: NoticeRecord) {
    setEditingId(item.id);
    setForm({
      naslov: item.naslov || "",
      opis: item.opis || "",
      kategorija: item.kategorija || moduleLabel,
      priority:
        item.priority !== null && item.priority !== undefined
          ? String(item.priority)
          : "1",
      pinned: item.pinned === true,
    });
  }

  async function saveNotice() {
    if (!form.naslov.trim() || !form.opis.trim()) {
      setMessage("Naslov i opis su obavezni.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");
      const payload = {
        naslov: form.naslov.trim(),
        opis: form.opis.trim(),
        kategorija: form.kategorija.trim() || moduleLabel,
        priority: sanitizeWholeNumber(form.priority) || 1,
        pinned: form.pinned,
      };

      if (editingId) {
        const response = await api.put(`${basePath}/${editingId}`, payload);
        setSuccess(response.data?.message || "Obavjestenje je izmijenjeno.");
      } else {
        const response = await api.post(basePath, payload);
        setSuccess(response.data?.message || "Obavjestenje je dodato.");
      }

      setEditingId(null);
      setForm(getDefaultNoticeForm(moduleLabel));
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri cuvanju obavjestenja."));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: number) {
    Alert.alert("Obrisi obavjestenje", "Obrisati izabrano obavjestenje?", [
      { style: "cancel", text: "Nazad" },
      {
        style: "destructive",
        text: "Obrisi",
        onPress: () => void deleteNotice(id),
      },
    ]);
  }

  async function deleteNotice(id: number) {
    try {
      setDeletingId(id);
      setMessage("");
      setSuccess("");
      const response = await api.delete(`${basePath}/${id}`);
      setSuccess(response.data?.message || "Obavjestenje je obrisano.");
      if (editingId === id) {
        setEditingId(null);
        setForm(getDefaultNoticeForm(moduleLabel));
      }
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri brisanju obavjestenja."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SectionCard
      right={<InfoBadge value={`${items.length}`} />}
      subtitle={`Objava i uredjivanje obavjestenja za sektor ${moduleLabel.toLowerCase()}.`}
      title="Obavjestenja"
    >
      {message ? <StatusBanner text={message} tone="danger" /> : null}
      {success ? <StatusBanner text={success} tone="success" /> : null}

      <AdminField
        label="Naslov"
        onChangeText={(value) => setForm((current) => ({ ...current, naslov: value }))}
        placeholder="Naslov obavjestenja"
        value={form.naslov}
      />
      <AdminField
        label="Kategorija"
        onChangeText={(value) =>
          setForm((current) => ({ ...current, kategorija: value }))
        }
        placeholder={moduleLabel}
        value={form.kategorija}
      />
      <AdminField
        keyboardType="numeric"
        label="Prioritet"
        onChangeText={(value) => setForm((current) => ({ ...current, priority: value }))}
        placeholder="1"
        value={form.priority}
      />
      <AdminTextArea
        label="Opis"
        onChangeText={(value) => setForm((current) => ({ ...current, opis: value }))}
        placeholder="Tekst obavjestenja"
        value={form.opis}
      />
      <ToggleRow
        description="Pinovano obavjestenje se izdvoji na vrhu liste."
        label="Pinovano"
        onValueChange={(value) => setForm((current) => ({ ...current, pinned: value }))}
        value={form.pinned}
      />

      <View style={styles.buttonColumn}>
        <AppButton
          label={saving ? "Cuvanje..." : editingId ? "Sacuvaj izmjene" : "Dodaj obavjestenje"}
          loading={saving}
          onPress={() => void saveNotice()}
        />
        <AppButton
          label="Ocisti formu"
          onPress={() => {
            setEditingId(null);
            setForm(getDefaultNoticeForm(moduleLabel));
          }}
          variant="secondary"
        />
      </View>

      {loading ? <LoadingState text="Ucitavanje obavjestenja..." /> : null}

      {items.length === 0 ? (
        <Text style={styles.emptyText}>Jos nema dodatih obavjestenja.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordIdentityText}>
                <Text style={styles.recordTitle}>{item.naslov}</Text>
                <Text style={styles.recordMeta}>
                  {item.kategorija || moduleLabel} • prioritet {item.priority || 1}
                </Text>
              </View>
              <InfoBadge
                tone={item.pinned ? "success" : "primary"}
                value={item.pinned ? "Pin" : "Objava"}
              />
            </View>
            <Text style={styles.recordBody}>{item.opis}</Text>
            <Text style={styles.recordSubtle}>
              Posljednja izmjena: {formatDateTime(item.datum_vrijeme)}
            </Text>
            <View style={styles.inlineActions}>
              <SmallActionButton label="Uredi" onPress={() => loadExisting(item)} />
              <SmallActionButton
                danger
                disabled={deletingId === item.id}
                label={deletingId === item.id ? "Brisanje..." : "Obrisi"}
                onPress={() => confirmDelete(item.id)}
              />
            </View>
          </View>
        ))
      )}
    </SectionCard>
  );
}

function AdminField({
  compact = false,
  label,
  ...props
}: {
  compact?: boolean;
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={compact ? styles.compactField : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSoft}
        selectionColor={colors.primary}
        style={[styles.input, compact ? styles.inputCompact : null]}
        {...props}
      />
    </View>
  );
}

function AdminTextArea({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline
        placeholderTextColor={colors.textSoft}
        selectionColor={colors.primary}
        style={[styles.input, styles.textArea]}
        textAlignVertical="top"
        {...props}
      />
    </View>
  );
}

function ChoiceRow({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceWrap}>
        {options.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => [
              styles.choiceChip,
              value === item.value ? styles.choiceChipActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.choiceChipText,
                value === item.value ? styles.choiceChipTextActive : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ToggleRow({
  description,
  label,
  onValueChange,
  value,
}: {
  description: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextWrap}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        trackColor={{ false: "#c8d7eb", true: colors.primary }}
        value={value}
      />
    </View>
  );
}

function SmallActionButton({
  danger = false,
  disabled = false,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallButton,
        danger ? styles.smallButtonDanger : styles.smallButtonPrimary,
        disabled ? styles.smallButtonDisabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.smallButtonText,
          danger ? styles.smallButtonTextDanger : styles.smallButtonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

function joinLines(value?: string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeWholeNumber(value: string) {
  return Math.max(0, Number.parseInt(String(value || "0"), 10) || 0);
}

function sanitizeDecimal(value: string) {
  return Math.max(0, Number(String(value || "0").replace(",", ".")) || 0);
}

function obligationStatusLabel(status?: string | null) {
  if (status === "paid") return "Placeno";
  if (status === "unpaid") return "Neplaceno";
  if (status === "inactive") return "Neaktivan";
  return status || "-";
}

function obligationTone(status?: string | null): "danger" | "primary" | "success" | "warning" {
  if (status === "paid") return "success";
  if (status === "unpaid") return "danger";
  if (status === "inactive") return "warning";
  return "primary";
}

function citaonaTone(status?: string | null): "danger" | "primary" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "expired" || status === "cancelled") return "danger";
  return "primary";
}

function discountTone(status?: string | null): "danger" | "primary" | "success" | "warning" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending") return "warning";
  return "primary";
}

const styles = StyleSheet.create({
  buttonColumn: {
    gap: 10,
  },
  choiceChip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: colors.white,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  compactField: {
    flex: 1,
    minWidth: "30%",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  field: {
    gap: 6,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  inlineWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputCompact: {
    minHeight: 48,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  recordBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  recordCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  recordHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  recordIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  recordIdentityText: {
    flex: 1,
    minWidth: 0,
  },
  recordMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  recordSubtle: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  recordTitle: {
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
    minHeight: 86,
    minWidth: "30%",
    padding: 12,
  },
  seatCardDisabled: {
    backgroundColor: "#E8EEF7",
    opacity: 0.65,
  },
  seatCardMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  seatCardMetaSelected: {
    color: colors.white,
  },
  seatCardNumber: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  seatCardNumberSelected: {
    color: colors.white,
  },
  seatCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  smallButton: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14,
  },
  smallButtonDanger: {
    backgroundColor: colors.dangerBg,
  },
  smallButtonDisabled: {
    opacity: 0.6,
  },
  smallButtonPrimary: {
    backgroundColor: colors.surfaceAlt,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  smallButtonTextDanger: {
    color: colors.dangerText,
  },
  smallButtonTextPrimary: {
    color: colors.primary,
  },
  stateChip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stateChipText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  stateChipTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  textArea: {
    minHeight: 114,
  },
  toggleDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  toggleTextWrap: {
    flex: 1,
  },
});
