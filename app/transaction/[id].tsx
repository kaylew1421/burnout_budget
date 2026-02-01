// app/transaction/[id].tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import EmotionPicker from "../../components/EmotionPicker";
import { StressSlider } from "../../components/StressSlider";
import { SoftButton } from "../../components/SoftButton";
import { useTransactions } from "../../hooks/useTransactions";
import { fmtUSD } from "../../lib/currency";

function stressLabel(v: number) {
  if (v >= 4) return "High stress";
  if (v <= 1) return "Low stress";
  return "Neutral";
}

function stressPillStyle(v: number) {
  if (v >= 4)
    return {
      backgroundColor: "rgba(255, 92, 92, 0.14)",
      borderColor: "rgba(255, 92, 92, 0.30)",
    };
  if (v <= 1)
    return {
      backgroundColor: "rgba(90, 230, 170, 0.12)",
      borderColor: "rgba(90, 230, 170, 0.26)",
    };
  return {
    backgroundColor: "rgba(255, 184, 77, 0.10)",
    borderColor: "rgba(255, 184, 77, 0.24)",
  };
}

function niceDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} • ${time}`;
}

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const store: any = useTransactions();

  const tx = useMemo(() => {
    if (!id) return undefined;
    return store.transactions?.find((t: any) => String(t.id) === String(id));
  }, [store.transactions, id]);

  const reflections = useMemo(() => {
    const list = (store.reflections || []).filter((r: any) => String(r.transactionId) === String(id));
    return list.slice().sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [store.reflections, id]);

  const [emotion, setEmotion] = useState<string | undefined>();
  const [stress, setStress] = useState<number>(2);
  const [note, setNote] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const flashTimer = useRef<any>(null);
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const didChange = useMemo(() => {
    return Boolean(emotion) || note.trim().length > 0 || stress !== 2;
  }, [emotion, note, stress]);

  function goBack() {
    try {
      router.back();
    } catch {
      router.replace("/(tabs)/transactions");
    }
  }

  function saveReflection() {
    if (!tx || !didChange) return;

    store.addReflection?.({
      id: `r_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      transactionId: tx.id,
      createdAt: new Date().toISOString(),
      stress: stress >= 4 ? "high_stress" : stress <= 1 ? "low_stress" : "neutral",
      reasonTags: emotion ? [emotion] : [],
      note: note.trim() || undefined,
    });

    setEmotion(undefined);
    setStress(2);
    setNote("");

    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 950);
  }

  // Keep scroll content clear of the sticky footer
  const bottomBarHeight = 92 + Math.max(insets.bottom, 10);

  return (
    <View style={styles.page}>
      {/* Sticky header */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.h1}>Reflection</Text>

          <View style={{ width: 64 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={{ gap: 10 }}>
            {tx ? (
              <>
                <View style={styles.txTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.big}>{tx.merchantName}</Text>
                    <Text style={styles.muted}>
                      {tx.category} • {niceDateTime(tx.postedAt)}
                    </Text>
                  </View>

                  <Text style={styles.amount}>{fmtUSD(tx.amount)}</Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>No shame</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "rgba(43,91,255,0.12)", borderColor: "rgba(43,91,255,0.25)" },
                    ]}
                  >
                    <Text style={styles.badgeText}>Just signals</Text>
                  </View>

                  {savedFlash && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: "rgba(90,230,170,0.12)", borderColor: "rgba(90,230,170,0.28)" },
                      ]}
                    >
                      <Text style={styles.badgeText}>Saved ✅</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.muted}>Couldn’t find that transaction.</Text>
            )}
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={styles.section}>How did it feel?</Text>
            <Text style={styles.muted}>This is for awareness — not guilt. The goal is patterns you can actually use.</Text>

            <EmotionPicker value={emotion} onChange={setEmotion} />
            <StressSlider value={stress} onChange={setStress} />

            <View style={styles.stressHintRow}>
              <Text style={styles.stressHint}>Stress</Text>
              <View style={[styles.stressPill, stressPillStyle(stress)]}>
                <Text style={styles.stressPillText}>{stressLabel(stress)}</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Optional note</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What was going on today?"
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
              />
              <Text style={styles.microHint}>Tip: keep it short — “tired + rushed”, “celebration”, “stress scroll”.</Text>
            </View>

            {!didChange ? (
              <Text style={styles.hint}>Pick an emotion, change stress, or add a note to enable saving.</Text>
            ) : (
              <Text style={styles.hint}>You’re collecting signals — so future you has clarity.</Text>
            )}
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={styles.section}>Past reflections</Text>

            {reflections.length ? (
              reflections.map((r: any) => {
                const v = r.stress === "high_stress" ? 5 : r.stress === "low_stress" ? 0 : 2;

                return (
                  <View key={r.id} style={styles.refRow}>
                    <View style={styles.refTopRow}>
                      <Text style={styles.refTop}>{niceDateTime(r.createdAt)}</Text>
                      <View style={[styles.refPill, stressPillStyle(v)]}>
                        <Text style={styles.refPillText}>
                          {r.stress === "high_stress" ? "High" : r.stress === "low_stress" ? "Low" : "Neutral"}
                        </Text>
                      </View>
                    </View>

                    {!!r.reasonTags?.length && <Text style={styles.refBody}>Emotion: {r.reasonTags.join(", ")}</Text>}
                    {!!r.note && <Text style={styles.refBody}>{r.note}</Text>}
                  </View>
                );
              })
            ) : (
              <Text style={styles.muted}>No reflections yet. Add one tiny note — even “meh day” counts.</Text>
            )}
          </Card>
        </ScrollView>

        {/* Bottom save bar (sticky) */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <SoftButton
            title={savedFlash ? "Saved ✅" : "Save reflection"}
            onPress={saveReflection}
            disabled={!tx || !didChange}
            style={{ width: "100%" }} // ✅ avoids weird flex sizing
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },

  stickyHeader: {
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { color: colors.text, fontSize: 20, fontWeight: "900" },

  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backText: { color: colors.text, fontWeight: "900" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  content: { padding: 14, gap: 12 },

  section: { color: colors.text, fontWeight: "900" },
  big: { color: colors.text, fontSize: 16, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },

  txTopRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  amount: { color: colors.text, fontWeight: "900", fontSize: 16 },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeText: { color: "rgba(234,240,255,0.85)", fontWeight: "900", fontSize: 12 },

  label: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  input: {
    minHeight: 44,
    maxHeight: 160,
    backgroundColor: "#0F0F16",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border2,
    fontSize: 14,
  },
  microHint: { color: "rgba(234,240,255,0.45)", fontSize: 11.5, lineHeight: 15, marginTop: -2 },

  stressHintRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  stressHint: { color: colors.muted, fontSize: 12.5, fontWeight: "800" },
  stressPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  stressPillText: { color: "rgba(234,240,255,0.90)", fontWeight: "900", fontSize: 12 },

  hint: { color: colors.muted, fontSize: 12, lineHeight: 16 },

  refRow: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  refTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  refTop: { color: colors.text, fontWeight: "900", fontSize: 12.5 },
  refPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  refPillText: { color: "rgba(234,240,255,0.90)", fontWeight: "900", fontSize: 12 },
  refBody: { color: colors.muted, fontSize: 12.5, lineHeight: 16 },

  bottomBar: {
    position: "absolute", // ✅ makes it truly sticky
    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: "rgba(11,15,20,0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
