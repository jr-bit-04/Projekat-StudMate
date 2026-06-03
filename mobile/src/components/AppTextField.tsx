import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface AppTextFieldProps extends TextInputProps {
  icon?: string;
  label?: string;
}

export function AppTextField({
  icon = "i",
  label,
  style,
  ...props
}: AppTextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <Text style={styles.leftIcon}>{icon}</Text>
        <TextInput
          placeholderTextColor="#AFC9F4"
          selectionColor="#62A8FF"
          style={[styles.input, style]}
          {...props}
        />
        <Text style={styles.rightIcon}>i</Text>
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
    color: "#4DA3FF",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 12,
    textAlign: "center",
    width: 18,
  },
  rightIcon: {
    color: "#4DA3FF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  wrapper: {
    gap: 0,
  },
});
