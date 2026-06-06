import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AvatarCircle } from "../../components/AvatarCircle";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAuth } from "../../context/AuthContext";
import {
  getAccessibleAdminModules,
  getAdminModuleMeta,
} from "../../data/adminModules";
import { ADMIN_MENU } from "../../data/mainMenu";
import { AdminStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminHub">;

export function AdminHubScreen({ navigation }: Props) {
  const { logout, user, isSubmitting } = useAuth();
  const modules = getAccessibleAdminModules(user);
  const heroImage = modules.length > 0 ? getAdminModuleMeta(modules[0]).image : undefined;

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
            <Text style={styles.identityLabel}>Administracija</Text>
            <Text numberOfLines={1} style={styles.identityName}>
              {user?.name || "Admin"}
            </Text>
            <Text numberOfLines={1} style={styles.identityMeta}>
              {user?.email || "StudMate nalog"}
            </Text>
          </View>
        </Pressable>
      }
      eyebrow="Administracija"
      highlights={[
        `${modules.length} sektora`,
        "Pregled svih modula",
        "Profil i odjava",
      ]}
      image={heroImage}
      menuItems={ADMIN_MENU}
      subtitle="Izaberi sektor koji želiš da uređuješ."
      title="Admin panel"
    >
      <SectionCard
        subtitle="Svaki sektor otvara poseban administrativni prikaz."
        title="Sektori"
      >
        {modules.length === 0 ? (
          <Text style={styles.emptyText}>
            Za ovaj nalog trenutno nije dodijeljen nijedan administrativni sektor.
          </Text>
        ) : (
          <View style={styles.grid}>
            {modules.map((module) => {
              const item = getAdminModuleMeta(module);

              return (
                <Pressable
                  key={item.key}
                  onPress={() =>
                    navigation.navigate("AdminModule", {
                      module: item.key,
                    })
                  }
                  style={({ pressed }) => [
                    styles.moduleCard,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.moduleTitle}>{item.label}</Text>
                  <Text style={styles.moduleBody}>{item.description}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </SectionCard>

      <SectionCard
        subtitle="Profil ostaje dostupan kao i kod ostalih naloga."
        title="Nalog"
      >
        <View style={styles.buttonColumn}>
          <AppButton
            label="Otvori profil"
            onPress={() => navigation.navigate("Profil")}
          />
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

const styles = StyleSheet.create({
  buttonColumn: {
    gap: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    gap: 12,
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
  moduleBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  moduleCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
