// app/(tabs)/recurrings-schedule.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { computeGap } from "../../features/gap/gap.engine";
import { fmtUSD } from "../../lib/currency";
import { useBills } from "../../hooks/useBills";
import { useSettings } from "../../hooks/useSettings";
import type { IncomeItem, Bill } from "../../features/gap/gap.types";

function prettyDay(ymdStr: string) {
  const d = new Date(`${ymdStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymdStr;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function isSameYmd(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(ymdStr: string) {
  const d = new Date(`${ymdStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymdStr;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameYmd(d, today)) return "Today";
  if (isSameYmd(d, tomorrow)) return "Tomorrow";
  return prettyDay(ymdStr);
}

type TimelineItem =
  | { kind: "income"; id: string; date: string; name: string; amount: number; confidence: IncomeItem["confidence"] }
  | { kind: "bill"; id: string; date: string; name: string; amount: number; isEssential: Bill["isEssential"] };

type TimelineRow = TimelineItem & { runningAfter: number; safeAfter: number };

type DaySection = { date: string; label: string; rows: TimelineRow[] };

function RecurringsViewToggle({ value }: { value: "list" | "schedule" }) {
  return (
    <View style={styles.toggleWrap}>
      <Pressable
        onPress={() => router.replace("/(tabs)/recurrings")}
        style={({ pressed }) => [
          styles.toggleBtn,
          value === "list" && styles.toggleBtnOn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.toggleText, value === "list" && styles.toggleTextOn]}>List</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(tabs)/recurrings-schedule")}
        style={({ pressed }) => [
          styles.toggleBtn,
          value === "schedule" && styles.toggleBtnOn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.toggleText, value === "schedule" && styles.toggleTextOn]}>Schedule</Text>
      </Pressable>
    </View>
  );
}

export default function RecurringsScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, bills, income } = useBills();
  const settings = useSettings();

  const { sections, safeToSpendNow, buffer, totalItems } = useMemo(() => {
    const billsForGap = settings.includeNonEssentialBillsInGap ? bills : bills.filter((b) => b.isEssential);

    const result = computeGap({
      mode: "through_end_of_month",
      accounts,
      bills: billsForGap,
      income,
      bufferPercent: settings.bufferPercent,
      rounding: settings.rounding,
    });

    const availableNow = result.breakdown.availableNow;
    const buffer = result.breakdown.buffer;

    const items: TimelineItem[] = [
      ...income.map((i) => ({
        kind: "income" as const,
        id: i.id,
        date: i.expectedDate,
        name: i.name,
        amount: i.amount,
        confidence: i.confidence,
      })),
      ...billsForGap.map((b) => ({
        kind: "bill" as const,
        id: b.id,
        date: b.dueDate,
        name: b.name,
        amount: b.amount,
        isEssential: b.isEssential,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    let running = availableNow;

    const rows: TimelineRow[] = items.map((it) => {
      running += it.kind === "income" ? it.amount : -it.amount;
      const safeAfter = Math.max(0, running - buffer);
      return { ...it, runningAfter: running, safeAfter };
    });

    const byDate = rows.reduce<Record<string, TimelineRow[]>>((acc, r) => {
      (acc[r.date] ||= []).push(r);
      return acc;
    }, {});

    const sectionDates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));

    const sections: DaySection[] = sectionDates.map((date) => ({
      date,
      label: dayLabel(date),
      rows: byDate[date].slice().sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "income" ? -1 : 1)),
    }));

    return {
      sections,
      totalItems: rows.length,
      safeToSpendNow: Math.max(0, availableNow - buffer),
      buffer,
    };
  }, [
    accounts,
    bills,
    income,
    settings.includeNonEssentialBillsInGap,
    settings.bufferPercent,
    settings.rounding,
  ]);

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 18 }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.replace("/(tabs)/recurrings")}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Recurrings</Text>
            <Text style={styles.sub}>What’s due next + what stays safe.</Text>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/bill-edit")}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add a bill"
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Toggle (List / Schedule) */}
        <RecurringsViewToggle value="schedule" />

        {/* Safe to spend now */}
        <Card style={{ gap: 8 }}>
          <Text style={styles.section}>Safe to spend today</Text>
          <Text style={styles.safeValue}>{fmtUSD(safeToSpendNow)}</Text>
          <Text style={styles.muted}>
            This keeps a buffer of {fmtUSD(buffer)} so bills don’t sneak up on you.
          </Text>
        </Card>

        {/* Timeline */}
        <Card style={{ gap: 10 }}>
          <View style={styles.topRow}>
            <Text style={styles.section}>Timeline</Text>
            <Text style={styles.sectionHint}>{totalItems}</Text>
          </View>

          {!sections.length ? (
            <Text style={styles.muted}>No bills or income yet. Add a bill to start building your schedule.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {sections.map((sec) => (
                <View key={sec.date} style={{ gap: 8 }}>
                  <View style={styles.dayHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={styles.dayHeaderText}>{sec.label}</Text>
                      {(sec.label === "Today" || sec.label === "Tomorrow") && (
                        <Text style={styles.dayHeaderSub}>{prettyDay(sec.date)}</Text>
                      )}
                    </View>

                    <View style={styles.dayHeaderPill}>
                      <Text style={styles.dayHeaderPillText}>{sec.rows.length}</Text>
                    </View>
                  </View>

                  <View style={{ gap: 10 }}>
                    {sec.rows.map((it) => {
                      const isBill = it.kind === "bill";

                      const badgeBg = isBill
                        ? it.isEssential
                          ? "rgba(43, 91, 255, 0.14)"
                          : "rgba(255,255,255,0.06)"
                        : "rgba(90,230,170,0.10)";

                      const badgeBorder = isBill
                        ? it.isEssential
                          ? "rgba(43, 91, 255, 0.28)"
                          : "rgba(255,255,255,0.10)"
                        : "rgba(90,230,170,0.22)";

                      const badgeText = isBill ? (it.isEssential ? "Essential" : "Optional") : "Income";
                      const conf = it.kind === "income" ? ` • ${it.confidence}` : "";

                      return (
                        <Pressable
                          key={`${it.kind}_${it.id}`}
                          onPress={() => {
                            if (isBill) router.push({ pathname: "/(tabs)/bill-edit", params: { id: it.id } });
                          }}
                          style={({ pressed }) => [styles.itemRow, pressed && styles.pressedSoft, !isBill && { opacity: 0.98 }]}
                        >
                          <View style={{ flex: 1, gap: 6 }}>
                            <View style={styles.itemTopLine}>
                              <Text style={styles.itemTitle} numberOfLines={1}>{it.name}</Text>

                              <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                                <Text style={styles.badgeText}>{badgeText}</Text>
                              </View>
                            </View>

                            <Text style={styles.itemMeta}>
                              {it.kind === "income" ? `+${fmtUSD(it.amount)}` : `-${fmtUSD(it.amount)}`}
                              {conf}
                            </Text>

                            <Text style={styles.muted}>
                              After this: safe-to-spend ≈ <Text style={styles.bold}>{fmtUSD(it.safeAfter)}</Text>
                            </Text>
                          </View>

                          {isBill ? <Text style={styles.chev}>›</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={() => router.push("/(tabs)/bill-edit")}
            style={({ pressed }) => [styles.addRow, pressed && styles.pressedSoft]}
          >
            <Text style={styles.addRowText}>＋ Add a bill</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  backText: { color: colors.text, fontWeight: "900" },

  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 2 },
    }),
  },

  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 2 },

  // NEW: toggle
  toggleWrap: {
    flexDirection: "row",
    gap: 10,
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  toggleBtnOn: {
    borderColor: "rgba(43, 91, 255, 0.55)",
    backgroundColor: "rgba(43, 91, 255, 0.16)",
  },
  toggleText: { color: "rgba(234,240,255,0.70)", fontWeight: "900" },
  toggleTextOn: { color: colors.text },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  section: { color: colors.text, fontWeight: "900" },
  sectionHint: { color: "rgba(234,240,255,0.55)", fontWeight: "800" },

  safeValue: { fontSize: 28, fontWeight: "900", color: colors.success },

  dayHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 2 },
  dayHeaderText: { color: "rgba(234,240,255,0.88)", fontWeight: "900" },
  dayHeaderSub: { color: "rgba(234,240,255,0.55)", fontWeight: "800", fontSize: 12.5 },

  dayHeaderPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dayHeaderPillText: { color: "rgba(234,240,255,0.70)", fontWeight: "900", fontSize: 12 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.panel2,
  },
  itemTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  itemTitle: { color: colors.text, fontWeight: "900", flex: 1 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { color: "rgba(234,240,255,0.86)", fontSize: 12, fontWeight: "900" },

  itemMeta: { color: colors.muted, fontSize: 12, fontWeight: "700" },

  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  bold: { fontWeight: "900", color: colors.text },

  chev: { color: "rgba(234,240,255,0.55)", fontSize: 22, fontWeight: "900" },

  addRow: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  addRowText: { color: colors.text, fontWeight: "900" },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
