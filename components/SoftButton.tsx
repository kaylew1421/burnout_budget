// components/SoftButton.tsx
import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, Platform } from "react-native";
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
  const ripple =
    variant === "primary"
      ? { color: "rgba(255,255,255,0.18)" }
      : { color: "rgba(255,255,255,0.10)" };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      android_ripple={Platform.OS === "android" ? ripple : undefined}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" ? styles.textPrimary : styles.textGhost,
          disabled ? styles.textDisabled : null,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50, // ✅ prevents "purple strip" / text clipping
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  primary: {
    backgroundColor: colors.accent,
    borderColor: "rgba(255,255,255,0.10)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 3 },
    }),
  },

  ghost: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: colors.border2,
  },

  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  disabled: { opacity: 0.5 },

  text: {
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.2,
    textAlign: "center", // ✅ helps on narrow widths
  },
  textPrimary: { color: "#FFFFFF" },
  textGhost: { color: colors.text },
  textDisabled: { opacity: 0.8 },
});
