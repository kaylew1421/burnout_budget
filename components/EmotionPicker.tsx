import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const OPTIONS = [
  { id: "relieved", label: "Relieved" },
  { id: "regret", label: "Regret" },
  { id: "stressed", label: "Stressed" },
  { id: "okay", label: "Okay" },
  { id: "happy", label: "Happy" },
];

export function EmotionPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>How did it feel?</Text>
      <View style={styles.row}>
        {OPTIONS.map((o) => (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={({ pressed }) => [
            styles.pill,
            value === o.id && styles.pillActive,
            pressed && { opacity: 0.85 }
          ]}>
            <Text style={[styles.pillText, value === o.id && styles.pillTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.panel2 },
  pillActive: { borderColor: colors.accent, backgroundColor: "#1b1230" },
  pillText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  pillTextActive: { color: colors.text },
});
