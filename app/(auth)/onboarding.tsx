// app/(auth)/onboarding.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { SoftButton } from "../../components/SoftButton";
import { useOnboarding } from "../../hooks/useOnboarding";

type Step = {
  title: string;
  body: string;
  bullets: string[];
};

const STEPS: Step[] = [
  {
    title: "Welcome to Burnout Budget",
    body: "This app is built to feel calm. We track patterns, not “good” or “bad” spending.",
    bullets: ["No shame. Just signals.", "Tiny wins > big resets.", "You control what you track."],
  },
  {
    title: "How it works",
    body: "Log what you can. Reflect when you want. The goal is clarity — not perfection.",
    bullets: ["Track expenses + recurrings", "See safe-to-spend in plain terms", "Add reflections to spot triggers"],
  },
  {
    title: "Ready?",
    body: "Start with a blank slate. Add your first bill or expense when you’re ready.",
    bullets: ["Blank dashboard for new users", "Guest mode is okay too", "You can change settings anytime"],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setHasOnboarded } = useOnboarding();

  const [idx, setIdx] = useState(0);
  const step = STEPS[idx];
  const isFirst = idx === 0;
  const isLast = idx === STEPS.length - 1;

  const progress = useMemo(() => {
    const pct = ((idx + 1) / STEPS.length) * 100;
    return `${pct}%` as const;
  }, [idx]);

  function goBack() {
    if (!isFirst) setIdx((v) => Math.max(0, v - 1));
    else router.back();
  }

  async function finish() {
    await setHasOnboarded(true);
    router.replace("/(tabs)/dashboard");
  }

  async function goNext() {
    if (!isLast) setIdx((v) => Math.min(STEPS.length - 1, v + 1));
    else await finish();
  }

  return (
    <View
      style={[
        styles.page,
        { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>

        <View style={styles.progressWrap} accessibilityRole="progressbar">
          <View style={styles.progressTrack} />
          <View style={[styles.progressFill, { width: progress }]} />
        </View>

        <Text style={styles.stepText}>
          {idx + 1}/{STEPS.length}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.h1}>{step.title}</Text>

        <Card style={{ gap: 12 }}>
          <Text style={styles.body}>{step.body}</Text>

          <View style={{ gap: 10 }}>
            {step.bullets.map((b, i) => (
              <View key={`${b}_${i}`} style={styles.bulletRow}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Bottom actions */}
        <View style={styles.actions}>
          <SoftButton title={isLast ? "Get started" : "Next"} onPress={goNext} style={{ flex: 1 }} />
        </View>

        {/* Skip (optional) */}
        {!isLast ? (
          <Pressable
            onPress={finish}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 14 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  progressWrap: { flex: 1, height: 10, borderRadius: 999, overflow: "hidden", position: "relative" },
  progressTrack: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.08)" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "rgba(43, 91, 255, 0.75)" },

  stepText: { color: "rgba(234,240,255,0.65)", fontWeight: "900", fontSize: 12 },

  content: { gap: 12 },

  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  body: { color: "rgba(234,240,255,0.72)", fontSize: 13, lineHeight: 18, fontWeight: "700" },

  bulletRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "rgba(43, 91, 255, 0.9)" },
  bulletText: { color: "rgba(234,240,255,0.75)", fontSize: 12.5, lineHeight: 17, fontWeight: "700", flex: 1 },

  actions: { marginTop: 8 },

  skip: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 14, marginTop: 6 },
  skipText: { color: "rgba(234,240,255,0.60)", fontWeight: "900" },

  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
