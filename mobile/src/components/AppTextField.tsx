import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { AppIcon, IconName } from "./AppIcon";

interface AppTextFieldProps extends TextInputProps {
  icon?: IconName;
  label?: string;
}

export function AppTextField({
  icon = "info",
  label,
  style,
  ...props
}: AppTextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <AppIcon name={icon} size={19} color="#4DA3FF" style={styles.leftIcon} />
        <TextInput
          placeholderTextColor="#AFC9F4"
          selectionColor="#62A8FF"
          style={[styles.input, style]}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingLeft: 2,
    paddingRight: 10,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "rgba(4,27,72,0.82)",
    borderColor: "rgba(76,141,221,0.45)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  label: {
    color: "#E5F0FF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  leftIcon: {
    marginRight: 12,
  },
  wrapper: {
    gap: 0,
  },
});
