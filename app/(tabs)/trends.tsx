import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polyline, Line } from "react-native-svg";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { useTransactions } from "../../hooks/useTransactions";
import { useSubscription } from "../../hooks/useSubscription";
import { fmtUSD } from "../../lib/currency";
import { router } from "expo-router";

type DayTotal = { day: string; total: number };

function ymdFromDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// real field from store
function getTxDate(t: { postedAt: string }): Date {
  return new Date(t.postedAt);
}

function buildDailyTotals(transactions: any[], daysBack = 30): DayTotal[] {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (daysBack - 1));

  const map = new Map<string, number>();

  // seed empty days for continuity
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(ymdFromDate(d), 0);
  }

  for (const t of transactions) {
    const d = getTxDate(t);
    const day = ymdFromDate(d);
    if (!map.has(day)) continue;

    const amt = Math.abs(Number(t.amount ?? 0));
    map.set(day, (map.get(day) || 0) + amt);
  }

  return Array.from(map.entries())
    .map(([day, total]) => ({ day, total }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function sumLastNDays(daily: DayTotal[], n: number) {
  const slice = daily.slice(Math.max(0, daily.length - n));
  return slice.reduce((acc, d) => acc + (Number(d.total) || 0), 0);
}

function LineTrendChart({ data }: { data: DayTotal[] }) {
  const height = 120;
  const width = 320;
  const padX = 10;
  const padY = 10;

  const values = data.map((d) => d.total);
  const max = Math.max(...values, 0);

  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d, idx) => {
    const x = padX + (innerW * idx) / Math.max(1, data.length - 1);
    const norm = max === 0 ? 0 : d.total / max;
    const y = padY + innerH - norm * innerH;
    return `${x},${y}`;
  });

  return (
    <View style={styles.chartFrame}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
        />
        <Polyline
          points={points.join(" ")}
          fill="none"
          stroke="rgba(43, 91, 255, 0.95)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, reflections } = useTransactions();
  const { isPro } = useSubscription();

  const {
    byCat,
    stressCount,
    daily,
    distinctDays,
    total7d,
    avgPerDay7d,
    topCat,
    topCatAmt,
  } = useMemo(() => {
    const byCatMap = new Map<string, number>();

    for (const t of transactions) {
      byCatMap.set(
        t.category,
        (byCatMap.get(t.category) || 0) + Math.abs(Number(t.amount ?? 0))
      );
    }

    const stressCount = reflections.filter((r) => r.stress === "high_stress").length;

    const daily = buildDailyTotals(transactions, 30);
    const distinctDays = daily.filter((d) => d.total > 0.01).length;

    const total7d = sumLastNDays(daily, 7);
    const avgPerDay7d = total7d / 7;

    const byCatArr = Array.from(byCatMap.entries()).sort((a, b) => b[1] - a[1]);
    const top = byCatArr[0];

    return {
      byCat: byCatArr,
      stressCount,
      daily,
      distinctDays,
      total7d,
      avgPerDay7d,
      topCat: top?.[0] ?? "—",
      topCatAmt: top?.[1] ?? 0,
    };
  }, [transactions, reflections]);

  const hasEnoughTrendData = distinctDays >= 7;

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.h1}>Trends</Text>
          <Text style={styles.sub}>Quick insights — no guilt, just clarity.</Text>
        </View>

        {/* Insight strip */}
        <View style={styles.grid}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Spent (7d)</Text>
            <Text style={styles.miniValue}>{fmtUSD(total7d)}</Text>
          </View>

          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Avg / day</Text>
            <Text style={styles.miniValue}>{fmtUSD(avgPerDay7d)}</Text>
          </View>

          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Top category</Text>
            <Text style={styles.miniValue} numberOfLines={1}>
              {topCat}
            </Text>
            <Text style={styles.miniHint}>{topCatAmt ? fmtUSD(topCatAmt) : "—"}</Text>
          </View>
        </View>

        <Card style={{ gap: 10 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.section}>Spending trend</Text>
            <Text style={styles.sectionHint}>Last 30 days</Text>
          </View>

          <LineTrendChart data={daily} />

          {!hasEnoughTrendData ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.muted}>
                Not enough data yet. Once you have about{" "}
                <Text style={styles.count}>7 days</Text> of spending, this gets way more useful.
              </Text>

              <Pressable
                onPress={() => router.push("/(tabs)/transactions?mode=flow")}
                style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
              >
                <Text style={styles.ctaText}>Log a transaction →</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.muted}>Nice — this is enough to start spotting patterns.</Text>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.section}>Category totals</Text>
            <Text style={styles.sectionHint}>All-time</Text>
          </View>

          {byCat.length === 0 ? (
            <Text style={styles.muted}>
              No transactions yet. Add a few and you’ll see patterns show up here.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {byCat.map(([cat, amt], idx) => (
                <View
                  key={cat}
                  style={[styles.row, idx === 0 && { borderTopWidth: 0, paddingTop: 0 }]}
                >
                  <Text style={styles.rowTitle}>{cat}</Text>
                  <Text style={styles.rowValue}>{fmtUSD(amt)}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.section}>Stress reflections</Text>
            <Text style={styles.sectionHint}>Check-ins</Text>
          </View>

          <Text style={styles.muted}>
            High-stress check-ins: <Text style={styles.count}>{stressCount}</Text>
          </Text>

          {!isPro ? (
            <Text style={styles.muted}>
              Pro idea: “trigger” categories + week-over-week changes.
            </Text>
          ) : (
            <Text style={styles.muted}>Pro is enabled (demo).</Text>
          )}
        </Card>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12, paddingBottom: 18 },

  header: { marginBottom: 2 },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 2 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 110,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  miniLabel: { color: "rgba(234,240,255,0.60)", fontSize: 12, fontWeight: "800" },
  miniValue: { color: colors.text, fontWeight: "900", fontSize: 16, marginTop: 6 },
  miniHint: { color: colors.muted, fontSize: 12, marginTop: 4, fontWeight: "700" },

  section: { color: colors.text, fontWeight: "900" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionHint: { color: colors.muted, fontSize: 12.5, fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  rowTitle: { color: colors.text, fontWeight: "800" },
  rowValue: { color: colors.text, fontWeight: "900" },

  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  count: { fontWeight: "900", color: colors.text },

  chartFrame: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.panel2,
    overflow: "hidden",
    paddingVertical: 8,
  },

  cta: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(43, 91, 255, 0.25)",
    backgroundColor: "rgba(43, 91, 255, 0.10)",
  },
  ctaText: { color: "rgba(43, 91, 255, 0.95)", fontWeight: "900" },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
