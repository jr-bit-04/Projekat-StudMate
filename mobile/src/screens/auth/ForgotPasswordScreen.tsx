import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { AuthShell } from "../../components/AuthShell";
import { StatusBanner } from "../../components/StatusBanner";
import { useAuth } from "../../context/AuthContext";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { applySession } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"danger" | "info" | "success">("info");
  const [submitting, setSubmitting] = useState(false);

  async function sendCode() {
    if (!email.trim()) {
      setTone("danger");
      setMessage("Unesi email adresu.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setTone("info");
      setMessage(response.data?.message || "Poslali smo ti kod na email.");
      setCodeSent(true);
    } catch (error) {
      setTone("danger");
      setMessage(getApiErrorMessage(error, "Greška pri slanju zahtjeva."));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!code.trim()) {
      setTone("danger");
      setMessage("Unesi kod iz emaila.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      const response = await api.post("/auth/verify-reset-code", {
        email: email.trim(),
        code: code.trim(),
      });

      if (response.data?.token && response.data?.user) {
        await applySession(
          {
            token: response.data.token,
            user: response.data.user,
          },
          { resetMode: true }
        );
        return;
      }

      setTone("danger");
      setMessage("Kod nije validan.");
    } catch (error) {
      setTone("danger");
      setMessage(getApiErrorMessage(error, "Kod nije validan."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Reset"
      footer={
        <View style={styles.footerBlock}>
          <Text
            onPress={() => navigation.navigate("Login")}
            style={styles.footerLink}
          >
            ‹ Nazad na prijavu
          </Text>
        </View>
      }
      subtitle={
        codeSent
          ? "Unesi kod koji smo poslali na email."
          : "Unesi svoju email adresu i poslaćemo ti kod za reset lozinke."
      }
      title="Zaboravljena lozinka"
    >
      {message ? <StatusBanner text={message} tone={tone} /> : null}

      {!codeSent ? (
        <AppTextField
          autoCapitalize="none"
          autoComplete="email"
          icon="mail"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="studentski@email.com"
          value={email}
        />
      ) : (
        <AppTextField
          icon="index"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Unesi 6-cifreni kod"
          value={code}
        />
      )}

      <AppButton
        label={codeSent ? "POTVRDI KOD" : "POŠALJI KOD"}
        loading={submitting}
        onPress={codeSent ? verifyCode : sendCode}
      />

      {codeSent ? (
        <Text onPress={sendCode} style={styles.resendLink}>
          Pošalji kod ponovo
        </Text>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerBlock: {
    alignItems: "center",
  },
  footerLink: {
    color: "#4DA3FF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  resendLink: {
    color: "#4DA3FF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
});
