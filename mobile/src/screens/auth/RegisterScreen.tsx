import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppIcon } from "../../components/AppIcon";
import { AuthSelectField } from "../../components/AuthSelectField";
import { AppTextField } from "../../components/AppTextField";
import { AuthShell } from "../../components/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const dormOptions = [
  "Novi studentski dom",
  "I faza",
  "II faza",
  "Plavi dvor",
  "Stari studentski dom",
];

const facultyOptions = [
  "Administracija",
  "Arhitektonski fakultet",
  "Biotehnički fakultet",
  "Ekonomski fakultet",
  "Elektrotehnički fakultet",
  "Fakultet političkih nauka",
  "Mašinski fakultet",
  "Medicinski fakultet",
  "Metalurško-tehnološki fakultet",
  "Muzička akademija - Podgorica",
  "Pravni fakultet",
  "Prirodno-matematički fakultet",
];

const adminOptions = [
  { label: "Menza", value: "menza" },
  { label: "Dom", value: "dom" },
  { label: "Čitaona", value: "citaona" },
  { label: "Krediti / Stipendije", value: "stipendije" },
  { label: "Popusti", value: "popusti" },
];

export function RegisterScreen({ navigation }: Props) {
  const { error, isSubmitting, register } = useAuth();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    faculty: "",
    dorm: "",
    index_number: "",
    admin_module: "",
    location_tracking_consent: false,
  });

  const isAdministration = form.faculty === "Administracija";
  const isDomAdmin = isAdministration && form.admin_module === "dom";

  const facultySelectOptions = useMemo(
    () =>
      facultyOptions.map((item) => ({
        label: item,
        value: item,
      })),
    []
  );

  const dormSelectOptions = useMemo(
    () =>
      dormOptions.map((item) => ({
        label: item,
        value: item,
      })),
    []
  );

  function setValue(name: keyof typeof form, value: string | boolean) {
    setMessage("");

    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "faculty" && value !== "Administracija") {
        next.admin_module = "";
      }

      if (name === "faculty" && value === "Administracija") {
        next.dorm = "";
        next.index_number = "";
        next.location_tracking_consent = false;
      }

      if (name === "admin_module" && value !== "dom") {
        next.dorm = "";
      }

      return next;
    });
  }

  async function handleRegister() {
    setMessage("");

    if (!form.name || !form.email || !form.password || !form.faculty) {
      setMessage("Popuni sva obavezna polja.");
      return;
    }

    if (isAdministration && !form.admin_module) {
      setMessage("Izaberi tip administracije.");
      return;
    }

    if (!isAdministration && !form.dorm) {
      setMessage("Izaberi studentski dom.");
      return;
    }

    if (isDomAdmin && !form.dorm) {
      setMessage("Admin doma mora izabrati koji dom vodi.");
      return;
    }

    if (!isAdministration && !form.index_number) {
      setMessage("Unesi broj indeksa.");
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        faculty: form.faculty,
        dorm: isAdministration
          ? isDomAdmin
            ? form.dorm
            : "Administracija"
          : form.dorm,
        index_number: isAdministration
          ? `ADMIN-${form.admin_module.toUpperCase()}`
          : form.index_number.trim(),
        location_tracking_consent: isAdministration
          ? false
          : form.location_tracking_consent,
        role: "student",
        admin_module: isAdministration ? form.admin_module : null,
      });
    } catch {
      return;
    }
  }

  return (
    <AuthShell
      brandCaption="Kreiraj korisnički nalog"
      eyebrow="Registracija"
      footer={
        <View style={styles.footerBlock}>
          <Text style={styles.footerText}>
            Već imaš nalog?{" "}
            <Text onPress={() => navigation.goBack()} style={styles.footerLink}>
              Prijavi se
            </Text>
          </Text>
        </View>
      }
      subtitle="Unesi osnovne podatke i kreiraj korisnički nalog."
      title="Registruj se"
    >
      <AppTextField
        autoCapitalize="words"
        icon="user"
        onChangeText={(value) => setValue("name", value)}
        placeholder="Ime i prezime"
        value={form.name}
      />
      <AppTextField
        autoCapitalize="none"
        autoComplete="email"
        icon="mail"
        keyboardType="email-address"
        onChangeText={(value) => setValue("email", value)}
        placeholder="email@example.com"
        value={form.email}
      />
      <AppTextField
        autoCapitalize="none"
        autoComplete="new-password"
        icon="lock"
        onChangeText={(value) => setValue("password", value)}
        placeholder="Lozinka"
        secureTextEntry
        value={form.password}
      />

      <AuthSelectField
        icon="faculty"
        onChange={(value) => setValue("faculty", value)}
        options={facultySelectOptions}
        placeholder="Izaberi fakultet"
        value={form.faculty}
      />

      {isAdministration ? (
        <AuthSelectField
          icon="admin"
          onChange={(value) => setValue("admin_module", value)}
          options={adminOptions}
          placeholder="Izaberi tip administracije"
          value={form.admin_module}
        />
      ) : null}

      {!isAdministration || isDomAdmin ? (
        <AuthSelectField
          icon="dom"
          onChange={(value) => setValue("dorm", value)}
          options={dormSelectOptions}
          placeholder={
            isDomAdmin ? "Izaberi dom koji administriras" : "Izaberi dom"
          }
          value={form.dorm}
        />
      ) : null}

      {!isAdministration ? (
        <AppTextField
          autoCapitalize="characters"
          icon="index"
          onChangeText={(value) => setValue("index_number", value)}
          placeholder="Broj indeksa (npr. 23/23)"
          value={form.index_number}
        />
      ) : null}

      {!isAdministration ? (
        <View style={styles.switchCard}>
          <View style={styles.switchTextBlock}>
            <Text style={styles.switchTitle}>
              Dozvoljavam praćenje lokacije za dnevnu rezervaciju čitaonice
            </Text>
            <Text style={styles.switchText}>
              Ako uključiš ovu opciju, mjesto važi za cijeli radni dan i
              rezervacija može biti automatski otkazana ako si dugo van dozvoljenog radijusa.
            </Text>
          </View>
          <Switch
            onValueChange={(value) => setValue("location_tracking_consent", value)}
            thumbColor={colors.white}
            trackColor={{ false: "#7C93B7", true: "#1672F6" }}
            value={form.location_tracking_consent}
          />
        </View>
      ) : null}

      <View style={styles.requiredRow}>
        <AppIcon name="info" size={15} color="#4DA3FF" />
        <Text style={styles.requiredText}>Obavezno polje</Text>
      </View>

      {message || error ? (
        <Text style={styles.error}>{message || error}</Text>
      ) : null}

      <AppButton
        label="REGISTRUJ SE"
        loading={isSubmitting}
        onPress={handleRegister}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(248,113,113,0.3)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FECACA",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerBlock: {
    alignItems: "center",
  },
  footerLink: {
    color: "#4DA3FF",
    fontWeight: "700",
  },
  footerText: {
    color: "rgba(219,234,254,0.9)",
    fontSize: 15,
    textAlign: "center",
  },
  requiredIcon: {
    color: "#4DA3FF",
    fontSize: 15,
    fontWeight: "800",
  },
  requiredRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  requiredText: {
    color: "rgba(219,234,254,0.88)",
    fontSize: 13,
    fontWeight: "600",
  },
  switchCard: {
    backgroundColor: "rgba(4,27,72,0.82)",
    borderColor: "rgba(76,141,221,0.45)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  switchText: {
    color: "rgba(191,219,254,0.9)",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
  switchTextBlock: {
    paddingRight: 12,
  },
  switchTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 12,
  },
});
