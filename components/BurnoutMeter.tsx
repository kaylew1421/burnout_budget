import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function BurnoutMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Burnout meter</Text>
        <Text style={styles.value}>{v}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${v}%` }]} />
      </View>
      <Text style={styles.help}>This is a gentle signal, not a score. You’re allowed to have hard days.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" },
  value: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  track: { height: 12, borderRadius: 999, backgroundColor: colors.panel2, overflow: "hidden", borderWidth: 1, borderColor: colors.border2 },
  fill: { height: "100%", backgroundColor: colors.accent },
  help: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
