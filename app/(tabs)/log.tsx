import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { EmotionPicker } from "../../components/EmotionPicker";
import { StressSlider } from "../../components/StressSlider";
import { SoftButton } from "../../components/SoftButton";
import { useTransactions } from "../../hooks/useTransactions";
import { fmtUSD } from "../../lib/currency";

export default function Log() {
  const store: any = useTransactions();
  const { transactions } = store;
  const [selectedId, setSelectedId] = useState<string | null>(transactions[0]?.id ?? null);
  const [emotion, setEmotion] = useState<string | undefined>();
  const [stress, setStress] = useState<number>(2);
  const [note, setNote] = useState("");

  const selected = useMemo(() => transactions.find((t: any) => t.id === selectedId), [transactions, selectedId]);

  function save() {
    if (!selected) return;
    store.addReflection({
      id: `r_${Date.now()}`,
      transactionId: selected.id,
      createdAt: new Date().toISOString(),
      stress: stress >= 4 ? "high_stress" : stress <= 1 ? "low_stress" : "neutral",
      reasonTags: emotion ? [emotion] : [],
      note: note.trim() || undefined,
    });
    setEmotion(undefined);
    setStress(2);
    setNote("");
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Log</Text>
        <Text style={styles.sub}>Pick a transaction and reflect. That’s it.</Text>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Recent transactions</Text>
          {transactions.map((t: any) => {
            const active = t.id === selectedId;
            return (
              <Pressable
                key={t.id}
                onPress={() => setSelectedId(t.id)}
                style={({ pressed }) => [styles.txRow, active && styles.txRowActive, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.txMerchant}>{t.merchantName}</Text>
                  <Text style={styles.txMeta}>{t.category} • {new Date(t.postedAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.txAmt}>{fmtUSD(t.amount)}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={styles.section}>Reflection</Text>
          {selected ? (
            <Text style={styles.selected}>
              You selected: <Text style={{ fontWeight: "900" }}>{selected.merchantName}</Text> ({fmtUSD(selected.amount)})
            </Text>
          ) : (
            <Text style={styles.selected}>Select a transaction above.</Text>
          )}

          <EmotionPicker value={emotion} onChange={setEmotion} />
          <StressSlider value={stress} onChange={setStress} />

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Optional note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Anything you want to remember?"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </View>

          <SoftButton title="Save reflection" onPress={save} disabled={!selected} />
          <Text style={styles.hint}>Saved reflections help the app spot patterns — not judge you.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12 },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: -6 },
  section: { color: colors.text, fontWeight: "800" },
  txRow: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.panel2, alignItems: "center" },
  txRowActive: { borderColor: colors.accent, backgroundColor: "#1b1230" },
  txMerchant: { color: colors.text, fontWeight: "800" },
  txMeta: { color: colors.muted, fontSize: 12 },
  txAmt: { color: colors.text, fontWeight: "900" },
  selected: { color: colors.muted },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  input: { minHeight: 44, maxHeight: 120, backgroundColor: "#0F0F16", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, borderWidth: 1, borderColor: colors.border2, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
