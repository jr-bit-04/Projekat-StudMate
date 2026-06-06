import {
  NavigationProp,
  ParamListBase,
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MenuItem } from "../data/mainMenu";
import { colors } from "../theme/colors";
import { AppIcon } from "./AppIcon";

interface ModuleMenuProps {
  items: MenuItem[];
}

export function ModuleMenu({ items }: ModuleMenuProps) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const currentRoute = useNavigationState(
    (state) => state.routes[state.index]?.name
  );

  function go(route: string) {
    setOpen(false);
    if (route !== currentRoute) {
      navigation.navigate(route as never);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed ? styles.pressed : null]}
      >
        <AppIcon name="menu" size={20} color={colors.white} />
        <Text style={styles.triggerText}>Meni</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetEyebrow}>StudMate</Text>
                <Text style={styles.sheetTitle}>Moduli</Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppIcon name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const active = item.route === currentRoute;

                return (
                  <Pressable
                    key={item.route}
                    onPress={() => go(item.route)}
                    style={({ pressed }) => [
                      styles.item,
                      active ? styles.itemActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.itemIcon,
                        active ? styles.itemIconActive : null,
                      ]}
                    >
                      <AppIcon
                        name={item.icon}
                        size={22}
                        color={active ? colors.white : colors.primary}
                      />
                    </View>
                    <View style={styles.itemText}>
                      <Text
                        style={[
                          styles.itemLabel,
                          active ? styles.itemLabelActive : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text style={styles.itemDescription}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <AppIcon
                      name="arrow-right"
                      size={18}
                      color={active ? colors.primary : colors.textSoft}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(8,28,64,0.55)",
    flex: 1,
    justifyContent: "flex-start",
    padding: 14,
    paddingTop: 70,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  item: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 10,
    padding: 12,
  },
  itemActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
  },
  itemDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  itemIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  itemIconActive: {
    backgroundColor: colors.primary,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  itemLabelActive: {
    color: colors.primary,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.9,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 26,
    borderWidth: 1,
    maxHeight: "82%",
    padding: 18,
    shadowColor: "#0B3A8F",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  sheetEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  triggerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
