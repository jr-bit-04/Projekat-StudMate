import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../theme/colors";
import { AppIcon, IconName } from "./AppIcon";

interface Option {
  label: string;
  value: string;
}

interface AuthSelectFieldProps {
  icon: IconName;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  value: string;
}

export function AuthSelectField({
  icon,
  onChange,
  options,
  placeholder,
  value,
}: AuthSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          pressed ? styles.fieldPressed : null,
        ]}
      >
        <AppIcon name={icon} size={19} color="#4DA3FF" style={styles.icon} />
        <Text
          numberOfLines={1}
          style={[styles.value, !selected ? styles.placeholder : null]}
        >
          {selected?.label || placeholder}
        </Text>
        <AppIcon name="chevron-down" size={18} color="#4DA3FF" />
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.closeText}>Zatvori</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active ? styles.optionActive : null,
                      pressed ? styles.fieldPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active ? styles.optionTextActive : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(3, 16, 43, 0.66)",
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  closeText: {
    color: "#4DA3FF",
    fontSize: 15,
    fontWeight: "700",
  },
  field: {
    alignItems: "center",
    backgroundColor: "rgba(4,27,72,0.82)",
    borderColor: "rgba(76,141,221,0.45)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  fieldPressed: {
    opacity: 0.94,
  },
  icon: {
    color: "#4DA3FF",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 12,
    textAlign: "center",
    width: 18,
  },
  indicator: {
    color: "#4DA3FF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalCard: {
    backgroundColor: "#062763",
    borderColor: "rgba(76,156,255,0.4)",
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "78%",
    padding: 18,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  option: {
    backgroundColor: "rgba(4,27,72,0.82)",
    borderColor: "rgba(76,141,221,0.28)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionActive: {
    backgroundColor: "#0B3A8F",
    borderColor: "#62A8FF",
  },
  optionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  optionTextActive: {
    color: "#DDEBFF",
  },
  placeholder: {
    color: "#AFC9F4",
  },
  value: {
    color: colors.white,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});
