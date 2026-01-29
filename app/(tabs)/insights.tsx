import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { useTransactions } from "../../hooks/useTransactions";
import { useSubscription } from "../../hooks/useSubscription";
import { fmtUSD } from "../../lib/currency";

export default function Insights() {
  const { transactions, reflections } = useTransactions();
  const { isPro } = useSubscription();

  const totals = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const t of transactions) byCat.set(t.category, (byCat.get(t.category) || 0) + Math.abs(t.amount));
    const stressCount = reflections.filter(r => r.stress === "high_stress").length;
    return { byCat: Array.from(byCat.entries()).sort((a,b)=>b[1]-a[1]), stressCount };
  }, [transactions, reflections]);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Insights</Text>
        <Text style={styles.sub}>Patterns over time (premium friendly).</Text>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Category totals (demo)</Text>
          {totals.byCat.map(([cat, amt]) => (
            <View key={cat} style={styles.row}>
              <Text style={styles.rowTitle}>{cat}</Text>
              <Text style={styles.rowValue}>{fmtUSD(amt)}</Text>
            </View>
          ))}
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Stress reflections</Text>
          <Text style={styles.muted}>
            High-stress reflections logged: <Text style={{ fontWeight: "900", color: colors.text }}>{totals.stressCount}</Text>
          </Text>
          {!isPro ? (
            <Text style={styles.muted}>
              Pro unlock idea: trend lines, “trigger” categories, and week-over-week progress.
            </Text>
          ) : (
            <Text style={styles.muted}>Pro is enabled (demo).</Text>
          )}
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
  row: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  rowTitle: { color: colors.text, fontWeight: "700" },
  rowValue: { color: colors.text, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
