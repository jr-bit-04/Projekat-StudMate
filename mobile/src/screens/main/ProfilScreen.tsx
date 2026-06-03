import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { api, getApiErrorMessage } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { AvatarCircle } from "../../components/AvatarCircle";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { StatusBanner } from "../../components/StatusBanner";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

const MAX_AVATAR_SIZE_MB = 4;

export function ProfilScreen() {
  const { logout, refreshMe, replaceUser, user, isSubmitting } = useAuth();
  const [message, setMessage] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarData, setAvatarData] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [locationTrackingConsent, setLocationTrackingConsent] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setLocationTrackingConsent(user?.location_tracking_consent === true);
  }, [user?.location_tracking_consent]);

  const rows = useMemo(
    () => [
      { label: "Email adresa", value: user?.email || "-" },
      { label: "Fakultet", value: user?.faculty || "-" },
      { label: "Broj indeksa", value: user?.index_number || "-" },
      { label: "Studentski dom", value: user?.dorm || "-" },
      {
        label: "Tip naloga",
        value: user?.role === "admin" ? "Administracija" : "Student",
      },
    ],
    [user]
  );

  const loadProfile = useCallback(async () => {
    await refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  }, [loadProfile]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setAvatarMessage("Potrebna je dozvola za galeriju da bi odabrala sliku.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      setAvatarMessage("Nije uspjelo ucitavanje slike.");
      return;
    }

    const fileSize = asset.fileSize || 0;
    if (fileSize > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setAvatarMessage("Profilna slika moze imati najvise 4 MB.");
      return;
    }

    const mimeType = asset.mimeType || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;

    setAvatarData(dataUrl);
    setAvatarPreview(asset.uri);
    setAvatarName(asset.fileName || "odabrana-slika");
    setAvatarMessage("");
  }

  async function saveAvatar() {
    if (!avatarData) {
      setAvatarMessage("Odaberi novu profilnu sliku.");
      return;
    }

    try {
      setIsSavingAvatar(true);
      setAvatarMessage("");

      const response = await api.put("/users/me/avatar", {
        image: avatarData,
      });

      await replaceUser(response.data.user);
      setAvatarData("");
      setAvatarPreview("");
      setAvatarName("");
      setAvatarMessage(response.data.message || "Profilna slika je sacuvana.");
    } catch (error) {
      setAvatarMessage(
        getApiErrorMessage(error, "Greska pri cuvanju profilne slike.")
      );
    } finally {
      setIsSavingAvatar(false);
    }
  }

  async function savePreferences() {
    try {
      setIsSavingPreferences(true);
      setPreferenceMessage("");

      const response = await api.put("/users/me/preferences", {
        location_tracking_consent: locationTrackingConsent,
      });

      await replaceUser(response.data.user);
      setPreferenceMessage(response.data.message || "Podesavanje je sacuvano.");
    } catch (error) {
      setPreferenceMessage(
        getApiErrorMessage(error, "Greska pri cuvanju podesavanja.")
      );
    } finally {
      setIsSavingPreferences(false);
    }
  }

  async function changePassword() {
    setMessage("");

    if (!form.currentPassword) {
      setMessage("Unesi trenutnu lozinku.");
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage("Nova lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage("Nova lozinka i potvrda nijesu iste.");
      return;
    }

    try {
      setIsSavingPassword(true);
      const response = await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      if (response.data?.user) {
        await replaceUser(response.data.user);
      }

      setMessage(response.data?.message || "Lozinka je sacuvana.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Greska pri promjeni lozinke."));
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <ScreenShell
      action={
        <View style={styles.heroIdentity}>
          <AvatarCircle
            name={user?.name}
            size={64}
            src={avatarPreview || user?.profile_image_url}
          />
          <View style={styles.heroIdentityText}>
            <Text style={styles.heroIdentityLabel}>StudMate nalog</Text>
            <Text numberOfLines={1} style={styles.heroIdentityName}>
              {user?.name || "Korisnik"}
            </Text>
            <Text numberOfLines={1} style={styles.heroIdentityMeta}>
              {user?.email || "-"}
            </Text>
          </View>
        </View>
      }
      eyebrow="Profil"
      highlights={[
        user?.faculty || "Fakultet nije dodat",
        user?.index_number ? `Indeks ${user.index_number}` : "Indeks nije dodat",
        user?.dorm || "Dom nije dodat",
      ]}
      onRefresh={() => {
        setRefreshing(true);
        loadProfile().finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      subtitle="Pregled osnovnih informacija, promjena profilne slike i lozinke."
      title="Moj profil"
    >
      {message ? <StatusBanner text={message} tone="info" /> : null}

      <SectionCard subtitle="Profilna slika i osnovni identitet naloga." title="Profilna slika">
        <View style={styles.profileHero}>
          <AvatarCircle
            name={user?.name}
            size={92}
            src={avatarPreview || user?.profile_image_url}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.name || "Korisnik"}</Text>
            <Text style={styles.profileEmail}>{user?.email || "-"}</Text>
            <Text style={styles.helperText}>JPG, PNG, WEBP ili GIF do 4 MB.</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={pickImage} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Odaberi sliku</Text>
          </Pressable>
          <Pressable
            disabled={!avatarData || isSavingAvatar}
            onPress={saveAvatar}
            style={[
              styles.primaryButton,
              !avatarData || isSavingAvatar ? styles.disabledButton : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSavingAvatar ? "Cuvanje..." : "Sacuvaj sliku"}
            </Text>
          </Pressable>
        </View>

        {avatarName || avatarMessage ? (
          <StatusBanner
            text={avatarMessage || `Odabrano: ${avatarName}`}
            tone={avatarMessage ? "info" : "success"}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Podaci o nalogu">
        {rows.map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{row.label}</Text>
            <Text style={styles.detailValue}>{row.value}</Text>
          </View>
        ))}
      </SectionCard>

      {user?.role === "student" ? (
        <SectionCard
          subtitle="Dnevna rezervacija citaonice koristi lokaciju da provjeri da li si u dozvoljenom radijusu."
          title="Lokacija za citaonicu"
        >
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>
              Dozvoljavam StudMate aplikaciji da prati moju lokaciju dok imam aktivnu dnevnu rezervaciju u citaonici.
            </Text>
            <Switch
              onValueChange={setLocationTrackingConsent}
              trackColor={{ false: "#d3d6dc", true: colors.primary }}
              value={locationTrackingConsent}
            />
          </View>

          <AppButton
            label={isSavingPreferences ? "Cuvanje..." : "Sacuvaj podesavanje"}
            loading={isSavingPreferences}
            onPress={savePreferences}
          />

          {preferenceMessage ? (
            <StatusBanner text={preferenceMessage} tone="info" />
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard subtitle="Promijeni lozinku i zastiti svoj nalog." title="Promjena lozinke">
        <TextInput
          onChangeText={(value) =>
            setForm((current) => ({ ...current, currentPassword: value }))
          }
          placeholder="Trenutna lozinka"
          placeholderTextColor={colors.textSoft}
          secureTextEntry
          style={styles.input}
          value={form.currentPassword}
        />
        <TextInput
          onChangeText={(value) =>
            setForm((current) => ({ ...current, newPassword: value }))
          }
          placeholder="Nova lozinka"
          placeholderTextColor={colors.textSoft}
          secureTextEntry
          style={styles.input}
          value={form.newPassword}
        />
        <TextInput
          onChangeText={(value) =>
            setForm((current) => ({ ...current, confirmPassword: value }))
          }
          placeholder="Potvrdi novu lozinku"
          placeholderTextColor={colors.textSoft}
          secureTextEntry
          style={styles.input}
          value={form.confirmPassword}
        />

        <AppButton
          label={isSavingPassword ? "Cuvanje..." : "Sacuvaj lozinku"}
          loading={isSavingPassword}
          onPress={changePassword}
        />
      </SectionCard>

      <SectionCard subtitle="Sesija ostaje prijavljena dok sama ne kliknes odjavu." title="Nalog">
        <AppButton
          label="Odjavi se"
          loading={isSubmitting}
          onPress={logout}
          variant="secondary"
        />
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
  disabledButton: {
    opacity: 0.6,
  },
  heroIdentity: {
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
  heroIdentityLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroIdentityMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  heroIdentityName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 2,
  },
  heroIdentityText: {
    flex: 1,
    minWidth: 0,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  preferenceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  preferenceText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 144,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 4,
  },
  profileHero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  profileName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  profileText: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 144,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
