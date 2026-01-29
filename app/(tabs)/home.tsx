import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { BurnoutMeter } from "../../components/BurnoutMeter";
import { TransactionPrompt } from "../../components/TransactionPrompt";
import { useTransactions } from "../../hooks/useTransactions";
import { computeBurnout } from "../../features/burnout/burnout.engine";

export default function Home() {
  const { transactions, reflections } = useTransactions();

  const burnout = useMemo(() => {
    return computeBurnout({
      lookbackDays: 30,
      transactions: transactions.map(t => ({ amount: t.amount, postedAt: t.postedAt, category: t.category })),
      reflections: reflections.map(r => ({ createdAt: r.createdAt, stress: r.stress })),
      dailyCheckIns: [],
    });
  }, [transactions, reflections]);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Burnout Budget</Text>
        <Text style={styles.sub}>Money tracking, but human.</Text>

        <Card>
          <BurnoutMeter value={burnout.dims.overall} />
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Today’s gentle check-in</Text>
          <TransactionPrompt text="If you logged a purchase today, want to reflect on how it felt? No judgment." />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.section}>What’s influencing your meter</Text>
          {burnout.explainers.map((e) => (
            <View key={e.title} style={styles.row}>
              <Text style={styles.rowTitle}>{e.title}</Text>
              <Text style={styles.rowDetail}>{e.detail}</Text>
            </View>
          ))}
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
  row: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 },
  rowTitle: { color: colors.text, fontWeight: "800" },
  rowDetail: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
