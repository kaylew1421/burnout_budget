import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { computeGap } from "../../features/gap/gap.engine";
import type { AccountBalance, Bill, IncomeItem } from "../../features/gap/gap.types";
import { addDaysYMD, ymd } from "../../lib/date";
import { fmtUSD } from "../../lib/currency";

export default function Gap() {
  const data = useMemo(() => {
    const today = ymd();
    const accounts: AccountBalance[] = [{ id: "a1", name: "Checking", available: 780, includeInGap: true }];
    const bills: Bill[] = [
      { id: "b1", name: "Rent", type: "rent", amount: 1200, dueDate: addDaysYMD(today, 4), cadence: "monthly", isEssential: true },
      { id: "b2", name: "Electric", type: "utilities", amount: 165, dueDate: addDaysYMD(today, 10), cadence: "monthly", isEssential: true },
      { id: "b3", name: "Phone", type: "phone", amount: 80, dueDate: addDaysYMD(today, 12), cadence: "monthly", isEssential: true },
      { id: "b4", name: "Streaming", type: "subscription", amount: 19.99, dueDate: addDaysYMD(today, 7), cadence: "monthly", isEssential: false },
    ];
    const income: IncomeItem[] = [{ id: "i1", name: "Paycheck", amount: 900, expectedDate: addDaysYMD(today, 6), confidence: "medium" }];

    return computeGap({ mode: "through_end_of_month", accounts, bills, income, bufferPercent: 0.05, rounding: "nearest_5" });
  }, []);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Cover the Gap</Text>
        <Text style={styles.sub}>A calm snapshot of what’s needed.</Text>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>{data.window.label}</Text>
          <Text style={styles.muted}>Window: {data.window.startDate} → {data.window.endDate}</Text>
          <View style={styles.row}><Text style={styles.rowTitle}>Available now</Text><Text style={styles.rowValue}>{fmtUSD(data.breakdown.availableNow)}</Text></View>
          <View style={styles.row}><Text style={styles.rowTitle}>Essentials remaining</Text><Text style={styles.rowValue}>{fmtUSD(data.breakdown.essentialsRemaining)}</Text></View>
          <View style={styles.row}><Text style={styles.rowTitle}>Expected income</Text><Text style={styles.rowValue}>{fmtUSD(data.breakdown.expectedIncomeInWindow)}</Text></View>
          <View style={styles.row}><Text style={styles.rowTitle}>Buffer</Text><Text style={styles.rowValue}>{fmtUSD(data.breakdown.buffer)}</Text></View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
            <Text style={[styles.rowTitle, { fontWeight: "900" }]}>Gap</Text>
            <Text style={[styles.rowValue, { fontWeight: "900", color: data.breakdown.gap > 0 ? colors.danger : colors.success }]}>{fmtUSD(data.breakdown.gap)}</Text>
          </View>
          <Text style={styles.muted}>If this shows a gap, it’s not a moral failing. It’s information.</Text>
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
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowTitle: { color: colors.muted, fontSize: 12 },
  rowValue: { color: colors.text, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
