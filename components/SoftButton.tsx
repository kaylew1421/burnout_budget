import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

export function SoftButton({
  title,
  onPress,
  variant = "primary",
  style,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[styles.text, variant === "primary" ? styles.textPrimary : styles.textGhost]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  ghost: { backgroundColor: colors.panel2, borderColor: colors.border2 },
  text: { fontWeight: "800", fontSize: 13 },
  textPrimary: { color: "#fff" },
  textGhost: { color: colors.text },
});
