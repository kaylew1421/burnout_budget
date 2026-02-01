// components/BurnoutMeter.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export type BurnoutExplainer = { title: string; detail: string; weight?: number };
type BurnoutLevel = "low" | "medium" | "high";

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}

function level(v: number): BurnoutLevel {
  if (v >= 70) return "high";
  if (v >= 40) return "medium";
  return "low";
}

function levelLabel(l: BurnoutLevel) {
  if (l === "high") return "High weight day";
  if (l === "medium") return "Steady day";
  return "Gentle day";
}

function accents(l: BurnoutLevel) {
  if (l === "high") {
    return {
      fill: "rgba(255, 92, 92, 0.70)",
      pillBg: "rgba(255, 92, 92, 0.16)",
      pillBorder: "rgba(255, 92, 92, 0.32)",
      glow: "rgba(255, 92, 92, 0.18)",
    };
  }
  if (l === "medium") {
    return {
      fill: "rgba(255, 184, 77, 0.70)",
      pillBg: "rgba(255, 184, 77, 0.14)",
      pillBorder: "rgba(255, 184, 77, 0.30)",
      glow: "rgba(255, 184, 77, 0.16)",
    };
  }
  return {
    fill: "rgba(90, 230, 170, 0.65)",
    pillBg: "rgba(90, 230, 170, 0.12)",
    pillBorder: "rgba(90, 230, 170, 0.26)",
    glow: "rgba(90, 230, 170, 0.14)",
  };
}

export function BurnoutMeter({
  value,
  title = "Today’s status",
  helper = "This is a gentle signal, not a grade.",
  explainers,
}: {
  value: number;
  title?: string;
  helper?: string;
  explainers?: BurnoutExplainer[];
}) {
  const v = useMemo(() => clamp(value), [value]);
  const l = useMemo(() => level(v), [v]);
  const a = accents(l);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>

        <View style={[styles.pill, { backgroundColor: a.pillBg, borderColor: a.pillBorder }]}>
          <Text style={styles.pillText}>{levelLabel(l)}</Text>
        </View>
      </View>

      <View
        style={styles.meterWrap}
        accessibilityRole="progressbar"
        accessibilityLabel="Burnout meter"
        accessibilityValue={{ now: v, min: 0, max: 100 }}
      >
        <View style={styles.meterTrack} />
        <View style={[styles.meterFill, { width: `${v}%`, backgroundColor: a.fill, shadowColor: a.glow }]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLeft}>Score</Text>
        <Text style={styles.metaRight}>{v}/100</Text>
      </View>

      {!!helper && <Text style={styles.helper}>{helper}</Text>}

      {!!explainers?.length && (
        <View style={styles.explainerWrap}>
          {explainers.slice(0, 3).map((e, idx) => (
            <View key={`${e.title}_${idx}`} style={styles.explainerRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.explainerTitle}>{e.title}</Text>
                <Text style={styles.explainerBody}>{e.detail}</Text>
              </View>
              {typeof e.weight === "number" && <Text style={styles.weight}>{e.weight}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  title: { color: "rgba(234,240,255,0.88)", fontSize: 13.5, fontWeight: "700" },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: "900" },

  meterWrap: { height: 12, borderRadius: 999, overflow: "hidden", position: "relative" },
  meterTrack: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.08)" },
  meterFill: {
    height: "100%",
    borderRadius: 999,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -2 },
  metaLeft: { color: "rgba(234,240,255,0.60)", fontSize: 12.5 },
  metaRight: { color: "rgba(234,240,255,0.86)", fontSize: 12.5, fontWeight: "900" },

  helper: { color: "rgba(234,240,255,0.60)", fontSize: 12, lineHeight: 16 },

  explainerWrap: { marginTop: 4, gap: 10 },
  explainerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    marginTop: 3,
    backgroundColor: "rgba(43, 91, 255, 0.90)",
  },
  explainerTitle: { color: colors.text, fontWeight: "900", fontSize: 12.5 },
  explainerBody: { color: "rgba(234,240,255,0.65)", fontSize: 12.5, lineHeight: 16, marginTop: 2 },
  weight: { color: "rgba(234,240,255,0.75)", fontWeight: "900" },
});
