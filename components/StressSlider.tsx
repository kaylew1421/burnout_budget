import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { colors } from "../theme/colors";

function stressLabel(v: number) {
  if (v <= 1) return "Low";
  if (v <= 3) return "Medium";
  return "High";
}

export function StressSlider({
  value,
  onChange,
  label = "Stress level",
  helper = "Quick gut check — not a test.",
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  helper?: string;
}) {
  const lvl = useMemo(() => stressLabel(value), [value]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.levelPill, levelPillStyle(value)]}>
          <Text style={styles.levelText}>{lvl}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              android_ripple={Platform.OS === "android" ? { color: "rgba(255,255,255,0.10)" } : undefined}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

function levelPillStyle(v: number) {
  if (v <= 1) return { backgroundColor: "rgba(90, 230, 170, 0.12)", borderColor: "rgba(90, 230, 170, 0.28)" };
  if (v <= 3) return { backgroundColor: "rgba(255, 184, 77, 0.14)", borderColor: "rgba(255, 184, 77, 0.28)" };
  return { backgroundColor: "rgba(255, 92, 92, 0.14)", borderColor: "rgba(255, 92, 92, 0.30)" };
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  label: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },

  levelPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelText: { color: "#EAF0FF", fontWeight: "900", fontSize: 12 },

  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  pill: {
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },

  pillActive: {
    borderColor: "rgba(43, 91, 255, 0.70)",
    backgroundColor: "rgba(43, 91, 255, 0.14)",
  },

  pillText: { color: "rgba(234,240,255,0.78)", fontWeight: "900" },
  pillTextActive: { color: "#EAF0FF" },

  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  helper: { color: "rgba(234,240,255,0.55)", fontSize: 12, lineHeight: 16, marginTop: 2 },
});
