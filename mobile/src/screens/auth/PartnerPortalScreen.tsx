import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import backgroundArt from "../../assets/background.png";
import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { AppIcon } from "../../components/AppIcon";
import { StatusBanner } from "../../components/StatusBanner";
import { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "PartnerPortal">;

const emptyForm = {
  naziv: "",
  kontakt_email: "",
  website: "",
  logo_url: "",
  naslov: "",
  kategorija: "",
  vrijednost: "",
  kod: "",
  valid_from: "",
  valid_until: "",
  lokacija: "",
  image_url: "",
  opis: "",
};

type FormState = typeof emptyForm;

export function PartnerPortalScreen({ navigation }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"danger" | "info" | "success">("info");
  const [submitting, setSubmitting] = useState(false);

  function setValue(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit() {
    if (!form.naziv.trim() || !form.naslov.trim()) {
      setTone("danger");
      setMessage("Unesi barem naziv ustanove i naslov promocije.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      const response = await api.post("/popusti/partner/submit", form);
      setTone("success");
      setMessage(response.data?.message || "Promocija je poslata na moderaciju.");
      setForm(emptyForm);
    } catch (error) {
      setTone("danger");
      setMessage(getApiErrorMessage(error, "Greška pri slanju promocije."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ImageBackground source={backgroundArt} style={styles.flex} resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
          >
            <AppIcon name="back" size={18} color={colors.white} />
            <Text style={styles.backText}>Nazad</Text>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.badge}>
              <AppIcon name="popusti" size={26} color="#62A8FF" />
            </View>
            <Text style={styles.title}>Partnerski portal</Text>
            <Text style={styles.subtitle}>
              Pošaljite studentsku promociju na moderaciju.
            </Text>

            {message ? <StatusBanner text={message} tone={tone} /> : null}

            <View style={styles.form}>
              <Field
                label="Naziv ustanove"
                onChangeText={(v) => setValue("naziv", v)}
                placeholder="Naziv ustanove"
                value={form.naziv}
              />
              <Field
                autoCapitalize="none"
                keyboardType="email-address"
                label="Kontakt email"
                onChangeText={(v) => setValue("kontakt_email", v)}
                placeholder="partner@email.com"
                value={form.kontakt_email}
              />
              <Field
                autoCapitalize="none"
                label="Website"
                onChangeText={(v) => setValue("website", v)}
                placeholder="https://..."
                value={form.website}
              />
              <Field
                autoCapitalize="none"
                label="Logo URL"
                onChangeText={(v) => setValue("logo_url", v)}
                placeholder="https://..."
                value={form.logo_url}
              />
              <Field
                label="Naslov promocije"
                onChangeText={(v) => setValue("naslov", v)}
                placeholder="Naslov promocije"
                value={form.naslov}
              />
              <Field
                label="Kategorija"
                onChangeText={(v) => setValue("kategorija", v)}
                placeholder="npr. Hrana, Tehnika..."
                value={form.kategorija}
              />
              <Field
                label="Vrijednost popusta"
                onChangeText={(v) => setValue("vrijednost", v)}
                placeholder="npr. 20%"
                value={form.vrijednost}
              />
              <Field
                label="Kod kupona"
                onChangeText={(v) => setValue("kod", v)}
                placeholder="npr. STUD20"
                value={form.kod}
              />
              <Field
                label="Važi od"
                onChangeText={(v) => setValue("valid_from", v)}
                placeholder="YYYY-MM-DD"
                value={form.valid_from}
              />
              <Field
                label="Važi do"
                onChangeText={(v) => setValue("valid_until", v)}
                placeholder="YYYY-MM-DD"
                value={form.valid_until}
              />
              <Field
                label="Lokacija"
                onChangeText={(v) => setValue("lokacija", v)}
                placeholder="Grad / adresa"
                value={form.lokacija}
              />
              <Field
                autoCapitalize="none"
                label="Slika URL"
                onChangeText={(v) => setValue("image_url", v)}
                placeholder="https://..."
                value={form.image_url}
              />
              <Field
                label="Opis i uslovi korišćenja"
                multiline
                onChangeText={(v) => setValue("opis", v)}
                placeholder="Opis ponude i uslovi..."
                value={form.opis}
              />

              <AppButton
                label="Pošalji na moderaciju"
                loading={submitting}
                onPress={submit}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
}

function Field({ label, multiline, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor="#AFC9F4"
        selectionColor="#62A8FF"
        style={[styles.input, multiline ? styles.textArea : null, style]}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  backText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  badge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(63,148,255,0.16)",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    width: 56,
  },
  card: {
    backgroundColor: "rgba(6,39,99,0.74)",
    borderColor: "rgba(76,156,255,0.4)",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    paddingVertical: 28,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: "#E5F0FF",
    fontSize: 13,
    fontWeight: "700",
  },
  flex: {
    flex: 1,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "rgba(4,27,72,0.82)",
    borderColor: "rgba(76,141,221,0.45)",
    borderRadius: 14,
    borderWidth: 1,
    color: colors.white,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,58,143,0.16)",
  },
  pressed: {
    opacity: 0.9,
  },
  subtitle: {
    color: "rgba(219,234,254,0.92)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  textArea: {
    minHeight: 110,
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
});
