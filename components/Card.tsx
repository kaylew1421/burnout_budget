// components/Card.tsx
import React from "react";
import { View, StyleSheet, ViewProps, Platform } from "react-native";
import { colors } from "../theme/colors";

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: (colors as any).border ?? colors.border2, // ✅ fallback
    borderRadius: 16,
    padding: 14,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
    }),
  },
});
