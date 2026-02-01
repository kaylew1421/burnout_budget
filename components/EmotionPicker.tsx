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

export default function EmotionPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>How did it feel?</Text>

      <View style={styles.row}>
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.panel2,
  },
  pillActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(43,91,255,0.14)",
  },
  pillText: { color: colors.muted, fontWeight: "900", fontSize: 12 },
  pillTextActive: { color: colors.text },
});
