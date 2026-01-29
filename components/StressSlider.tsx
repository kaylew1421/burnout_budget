import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Stress level</Text>
      <View style={styles.row}>
        {[0,1,2,3,4,5].map((n) => (
          <Pressable key={n} onPress={() => onChange(n)} style={({ pressed }) => [
            styles.pill,
            value === n && styles.pillActive,
            pressed && { opacity: 0.8 }
          ]}>
            <Text style={[styles.pillText, value === n && styles.pillTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.panel2 },
  pillActive: { borderColor: colors.accent, backgroundColor: "#1b1230" },
  pillText: { color: colors.text, fontWeight: "800" },
  pillTextActive: { color: colors.text },
});
