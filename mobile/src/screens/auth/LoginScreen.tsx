import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { AuthShell } from "../../components/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { error, isSubmitting, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      await login({
        email: email.trim(),
        password,
      });
    } catch {
      return;
    }
  }

  return (
    <AuthShell
      eyebrow="Prijava"
      footer={
        <View style={styles.footerBlock}>
          <Text style={styles.footerText}>
            Nemaš nalog?{" "}
            <Text onPress={() => navigation.navigate("Register")} style={styles.footerLink}>
              Registruj se
            </Text>
          </Text>
        </View>
      }
      subtitle="Unesi podatke za pristup nalogu."
      title="Prijavi se"
    >
      <AppTextField
        autoCapitalize="none"
        autoComplete="email"
        icon="mail"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="email@example.com"
        value={email}
      />
      <AppTextField
        autoCapitalize="none"
        autoComplete="password"
        icon="lock"
        onChangeText={setPassword}
        placeholder="Lozinka"
        secureTextEntry
        value={password}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        label="PRIJAVI SE"
        loading={isSubmitting}
        onPress={handleLogin}
      />

      <Pressable style={styles.linkWrap}>
        <Text style={styles.linkText}>Zaboravljena lozinka?</Text>
      </Pressable>
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
  linkText: {
    color: "#4DA3FF",
    fontSize: 14,
    fontWeight: "700",
  },
  linkWrap: {
    alignItems: "center",
    marginTop: 6,
  },
});
