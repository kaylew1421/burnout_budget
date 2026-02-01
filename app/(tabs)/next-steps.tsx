// app/(tabs)/next-steps.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { fmtUSD } from "../../lib/currency";
import { computeGap } from "../../features/gap/gap.engine";
import { useBills } from "../../hooks/useBills";
import { useTransactions } from "../../hooks/useTransactions";
import { useSettings } from "../../hooks/useSettings";

function prettyDay(ymdStr: string) {
  const d = new Date(`${ymdStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymdStr;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function bullet(text: string) {
  return `• ${text}`;
}

export default function NextStepsScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, bills, income } = useBills();
  const settings = useSettings();
  const txStore: any = useTransactions();

  const billsForGap = useMemo(() => {
    return settings.includeNonEssentialBillsInGap ? bills : bills.filter((b: any) => b.isEssential);
  }, [bills, settings.includeNonEssentialBillsInGap]);

  const result = useMemo(() => {
    return computeGap({
      mode: "through_end_of_month",
      accounts,
      bills: billsForGap,
      income,
      bufferPercent: settings.bufferPercent,
      rounding: settings.rounding,
    });
  }, [accounts, billsForGap, income, settings.bufferPercent, settings.rounding]);

  const breakdown = result.breakdown;

  const safeToSpendNow = Math.max(0, breakdown.availableNow - breakdown.buffer);

  const nextEssential = useMemo(() => {
    return [...bills]
      .filter((b: any) => b.isEssential)
      .sort((a: any, b: any) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  }, [bills]);

  const topCategoryThisWeek = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;

    const recent = (txStore.transactions ?? []).filter((t: any) => {
      const ts = new Date(t.postedAt).getTime();
      return ts >= weekAgo;
    });

    const sums: Record<string, number> = {};
    for (const t of recent) {
      const k = String(t.category || "Other");
      sums[k] = (sums[k] || 0) + Number(t.amount || 0);
    }

    let best = { cat: "Other", amt: 0 };
    for (const k of Object.keys(sums)) {
      if (sums[k] > best.amt) best = { cat: k, amt: sums[k] };
    }
    return best;
  }, [txStore.transactions]);

  const nextDueLabel = nextEssential
    ? `${nextEssential.name} (due ${prettyDay(nextEssential.dueDate)})`
    : "your next essential bill";

  const breakEvenNeeded = Math.max(0, breakdown.gap);

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.h1}>Next Steps</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        {/* Coach Card */}
        <Card style={{ gap: 12 }}>
          <Text style={styles.section}>Coach note</Text>

          <Text style={styles.paragraph}>
            {breakdown.gap > 0
              ? `Right now you're a little short before everything clears. That’s not failure — it just means you need a simple plan until ${nextDueLabel} is handled.`
              : safeToSpendNow <= 25
              ? `You’re covered, but it’s a tight window. The goal today is protecting your buffer until ${nextDueLabel} clears.`
              : `You’re covered and steady. The move now is staying intentional so you don’t create a squeeze later.`}
          </Text>

          <View style={styles.bullets}>
            <Text style={styles.bullet}>{bullet(`Your safe-to-spend today is ${fmtUSD(safeToSpendNow)}.`)}</Text>

            {breakEvenNeeded > 0 ? (
              <Text style={styles.bullet}>
                {bullet(`To break even in this window, you need about ${fmtUSD(breakEvenNeeded)} more.`)}
              </Text>
            ) : (
              <Text style={styles.bullet}>
                {bullet(`You’re break-even or better for this window — protect the buffer.`)}
              </Text>
            )}

            <Text style={styles.bullet}>
              {bullet(`Priority: keep spending calm until ${nextDueLabel} is paid.`)}
            </Text>
          </View>

          <Text style={styles.subhead}>Do this next</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>{bullet(`Log anything you’ve already spent today.`)}</Text>
            <Text style={styles.bullet}>{bullet(`If you’re going to spend, choose one thing and pause the rest.`)}</Text>
            <Text style={styles.bullet}>{bullet(`Check upcoming bills before making new purchases.`)}</Text>
          </View>

          <Text style={styles.subhead}>Based on your last week</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>
              {bullet(
                `Your biggest category recently is ${topCategoryThisWeek.cat} (~${fmtUSD(
                  topCategoryThisWeek.amt
                )}). If you tighten one thing, start there.`
              )}
            </Text>

            <Text style={styles.bullet}>
              {bullet(
                `Be extra careful with ${topCategoryThisWeek.cat} spending until ${nextDueLabel} clears.`
              )}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Quick actions</Text>

          <Pressable
            onPress={() => router.push("/(tabs)/transactions")}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>Log a transaction + reflection</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/recurrings")}
            style={({ pressed }) => [styles.actionBtnAlt, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>Check bills schedule</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12 },

  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backText: { color: colors.text, fontWeight: "900" },
  h1: { color: colors.text, fontSize: 20, fontWeight: "900" },

  section: { color: colors.text, fontWeight: "900" },
  paragraph: { color: "rgba(234,240,255,0.80)", fontSize: 13.5, lineHeight: 20 },

  subhead: { color: colors.text, fontWeight: "900", marginTop: 6 },

  bullets: { gap: 6 },
  bullet: { color: "rgba(234,240,255,0.70)", fontSize: 13, lineHeight: 18 },

  actionBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: colors.accent,
  },
  actionBtnAlt: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  actionText: { color: colors.text, fontWeight: "900" },

  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
