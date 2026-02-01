// app/(tabs)/recurrings.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { computeGap } from "../../features/gap/gap.engine";
import { fmtUSD } from "../../lib/currency";
import { useBills } from "../../hooks/useBills";
import QuickActionsTinyWins from "../../components/QuickActionsTinyWinsCard";
import { useSettings } from "../../hooks/useSettings";
import type { IncomeItem, Bill } from "../../features/gap/gap.types";

function timeLabel() {
  return new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function prettyDay(ymdStr: string) {
  const d = new Date(`${ymdStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymdStr;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function prettyRange(a: string, b: string) {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return `${a} → ${b}`;
  const left = da.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const right = db.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${left} → ${right}`;
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
  | {
      kind: "income";
      id: string;
      date: string; // YYYY-MM-DD
      name: string;
      amount: number;
      confidence: IncomeItem["confidence"];
    }
  | {
      kind: "bill";
      id: string;
      date: string; // YYYY-MM-DD
      name: string;
      amount: number;
      isEssential: Bill["isEssential"];
    };

type TimelineRow = TimelineItem & {
  runningAfter: number;
  safeAfter: number;
};

type DaySection = {
  date: string; // YYYY-MM-DD
  label: string;
  rows: TimelineRow[];
};

export default function RecurringsScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, bills, income } = useBills();
  const settings = useSettings();

  const [view, setView] = useState<"recurrings" | "schedule">("recurrings");

  const billsForGap = useMemo(() => {
    return settings.includeNonEssentialBillsInGap ? bills : bills.filter((b) => b.isEssential);
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

  const gap = result.breakdown.gap;
  const isGap = gap > 0;

  const essentialsSoon = [...bills].filter((b) => b.isEssential).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const optionalSoon = [...bills].filter((b) => !b.isEssential).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const upcomingAll = [...essentialsSoon, ...optionalSoon].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const expectedIncome = result.breakdown.expectedIncomeInWindow;
  const buffer = result.breakdown.buffer;
  const availableNow = result.breakdown.availableNow;

  const safeToSpend = Math.max(0, availableNow + expectedIncome - result.breakdown.essentialsRemaining - buffer);

  const pillBg = isGap ? "rgba(255,92,92,0.16)" : "rgba(90,230,170,0.12)";
  const pillBorder = isGap ? "rgba(255,92,92,0.35)" : "rgba(90,230,170,0.30)";
  const heroColor = isGap ? colors.danger : colors.success;

  const topDriver = essentialsSoon.slice(0, 2).map((b) => b.name).join(" + ");

  const schedule = useMemo(() => {
    const availableNow2 = result.breakdown.availableNow;
    const buffer2 = result.breakdown.buffer;

    const items: TimelineItem[] = [
      ...income.map(
        (i): TimelineItem => ({
          kind: "income",
          id: i.id,
          date: i.expectedDate,
          name: i.name,
          amount: i.amount,
          confidence: i.confidence,
        })
      ),
      ...billsForGap.map(
        (b): TimelineItem => ({
          kind: "bill",
          id: b.id,
          date: b.dueDate,
          name: b.name,
          amount: b.amount,
          isEssential: b.isEssential,
        })
      ),
    ].sort((a, b) => a.date.localeCompare(b.date));

    let running = availableNow2;

    const rows: TimelineRow[] = items.map((it) => {
      if (it.kind === "income") running += it.amount;
      else running -= it.amount;

      const safeAfter2 = Math.max(0, running - buffer2);
      return { ...it, runningAfter: running, safeAfter: safeAfter2 };
    });

    const byDate = rows.reduce<Record<string, TimelineRow[]>>((acc, r) => {
      (acc[r.date] ||= []).push(r);
      return acc;
    }, {});

    const sectionDates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));

    const sections: DaySection[] = sectionDates.map((date) => ({
      date,
      label: dayLabel(date),
      rows: byDate[date].slice().sort((a, b) => {
        if (a.kind === b.kind) return 0;
        return a.kind === "income" ? -1 : 1;
      }),
    }));

    return {
      sections,
      totalItems: rows.length,
      safeToSpendNow: Math.max(0, availableNow2 - buffer2),
      buffer: buffer2,
    };
  }, [result.breakdown.availableNow, result.breakdown.buffer, income, billsForGap]);

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Recurrings</Text>
            <Text style={styles.sub}>Bills + subscriptions — calm and predictable.</Text>
          </View>

          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>Updated {timeLabel()}</Text>
          </View>
        </View>

        {/* Toggle row */}
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setView("recurrings")}
            style={({ pressed }) => [
              styles.toggleBtn,
              view === "recurrings" && styles.toggleBtnOn,
              pressed && styles.pressedSoft,
            ]}
          >
            <Ionicons
              name="albums-outline"
              size={16}
              color={view === "recurrings" ? colors.text : "rgba(234,240,255,0.70)"}
            />
            <Text style={[styles.toggleText, view === "recurrings" && styles.toggleTextOn]}>Recurrings</Text>
          </Pressable>

          <Pressable
            onPress={() => setView("schedule")}
            style={({ pressed }) => [
              styles.toggleBtn,
              view === "schedule" && styles.toggleBtnOn,
              pressed && styles.pressedSoft,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={view === "schedule" ? colors.text : "rgba(234,240,255,0.70)"}
            />
            <Text style={[styles.toggleText, view === "schedule" && styles.toggleTextOn]}>Schedule</Text>
          </Pressable>
        </View>

        {/* Status card */}
        <Card style={{ gap: 10 }}>
          <View style={styles.topRow}>
            <Text style={styles.section}>{result.window.label}</Text>

            <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={styles.pillText}>{isGap ? "Gap" : "Covered"}</Text>
            </View>
          </View>

          <Text style={styles.muted}>Window: {prettyRange(result.window.startDate, result.window.endDate)}</Text>

          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>{isGap ? "Gap to cover" : "Safe-to-spend"}</Text>
            <Text style={[styles.heroValue, { color: heroColor }]}>{fmtUSD(isGap ? gap : safeToSpend)}</Text>
          </View>

          <Text style={styles.muted}>
            {isGap
              ? `No shame — just a signal. Biggest drivers: ${topDriver || "essentials"}.`
              : "You’re covered for this window, with room to breathe."}
          </Text>

          {/* Actions row (AI removed) */}
          <View style={styles.actionRow}>
            <Link href="/(tabs)/bill-edit" asChild>
              <Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
                <Ionicons name="add-circle-outline" size={18} color="rgba(234,240,255,0.86)" />
                <Text style={styles.actionBtnText}>Add bill</Text>
              </Pressable>
            </Link>
          </View>
        </Card>

        {view === "recurrings" ? (
          <>
            {/* Upcoming list */}
            <Card style={{ gap: 10 }}>
              <View style={styles.topRow}>
                <Text style={styles.section}>Upcoming</Text>
                <Text style={styles.sectionHint}>{upcomingAll.length}</Text>
              </View>

              {!upcomingAll.length ? (
                <Text style={styles.muted}>No bills yet. Add one to start.</Text>
              ) : (
                upcomingAll.slice(0, 10).map((b) => {
                  const badgeBg = b.isEssential ? "rgba(43, 91, 255, 0.14)" : "rgba(255,255,255,0.06)";
                  const badgeBorder = b.isEssential ? "rgba(43, 91, 255, 0.28)" : "rgba(255,255,255,0.10)";
                  const badgeText = b.isEssential ? "Essential" : "Optional";

                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => router.push({ pathname: "/(tabs)/bill-edit", params: { id: b.id } })}
                      style={({ pressed }) => [styles.billRow, pressed && styles.pressedSoft]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.billName} numberOfLines={1}>
                          {b.name}
                        </Text>
                        <Text style={styles.billMeta}>Due {prettyDay(b.dueDate)}</Text>
                      </View>

                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <Text style={styles.billAmt}>{fmtUSD(b.amount)}</Text>
                        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                          <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}

              {upcomingAll.length > 10 && (
                <Pressable
                  onPress={() => setView("schedule")}
                  style={({ pressed }) => [styles.linkRow, pressed && styles.pressedSoft]}
                >
                  <Text style={styles.linkText}>View full schedule →</Text>
                </Pressable>
              )}
            </Card>

            {/* Breakdown */}
            <Card style={{ gap: 10 }}>
              <Text style={styles.section}>Breakdown</Text>

              <View style={styles.row}>
                <Text style={styles.rowTitle}>Available now</Text>
                <Text style={styles.rowValue}>{fmtUSD(result.breakdown.availableNow)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowTitle}>Essentials remaining</Text>
                <Text style={styles.rowValue}>{fmtUSD(result.breakdown.essentialsRemaining)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowTitle}>Expected income</Text>
                <Text style={styles.rowValue}>{fmtUSD(result.breakdown.expectedIncomeInWindow)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowTitle}>Buffer</Text>
                <Text style={styles.rowValue}>{fmtUSD(result.breakdown.buffer)}</Text>
              </View>

              <View style={[styles.row, styles.totalRow]}>
                <Text style={[styles.rowTitle, { fontWeight: "900" }]}>Gap</Text>
                <Text style={[styles.rowValue, { fontWeight: "900", color: heroColor }]}>
                  {fmtUSD(result.breakdown.gap)}
                </Text>
              </View>

              <Text style={styles.muted}>
                {isGap ? "If this shows a gap, it’s not a moral failing. It’s information." : "You’re covered for this window."}
              </Text>
            </Card>

            <QuickActionsTinyWins />
          </>
        ) : (
          <Card style={{ gap: 10 }}>
            <Text style={styles.section}>Schedule</Text>

            <View style={{ gap: 6 }}>
              <Text style={styles.muted}>Safe to spend today</Text>
              <Text style={styles.safeValue}>{fmtUSD(schedule.safeToSpendNow)}</Text>
              <Text style={styles.muted}>
                This keeps a buffer of {fmtUSD(schedule.buffer)} so bills don’t sneak up on you.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.topRow}>
              <Text style={styles.section}>Timeline</Text>
              <Text style={styles.sectionHint}>{schedule.totalItems}</Text>
            </View>

            {!schedule.sections.length ? (
              <Text style={styles.muted}>No bills or income yet. Add a bill to start building your schedule.</Text>
            ) : (
              <View style={{ gap: 12 }}>
                {schedule.sections.map((sec) => (
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
                            style={({ pressed }) => [
                              styles.itemRow,
                              pressed && styles.pressedSoft,
                              !isBill && { opacity: 0.98 },
                            ]}
                          >
                            <View
                              style={[
                                styles.dot,
                                isBill ? (it.isEssential ? styles.dotEssential : styles.dotOptional) : styles.dotIncome,
                              ]}
                            />

                            <View style={{ flex: 1, gap: 6 }}>
                              <View style={styles.itemTopLine}>
                                <Text style={styles.itemTitle} numberOfLines={1}>
                                  {it.name}
                                </Text>

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

            <Pressable onPress={() => router.push("/(tabs)/bill-edit")} style={({ pressed }) => [styles.addRow, pressed && styles.pressedSoft]}>
              <Text style={styles.addRowText}>＋ Add a bill</Text>
            </Pressable>
          </Card>
        )}

        <View style={{ height: 10 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12 },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingBottom: 4,
  },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 2 },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statusChipText: { color: "rgba(234,240,255,0.72)", fontSize: 12, fontWeight: "900" },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  section: { color: colors.text, fontWeight: "900" },
  sectionHint: { color: "rgba(234,240,255,0.55)", fontWeight: "800" },

  toggleRow: {
    flexDirection: "row",
    gap: 10,
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  toggleBtnOn: {
    borderColor: "rgba(43, 91, 255, 0.45)",
    backgroundColor: "rgba(43, 91, 255, 0.18)",
  },
  toggleText: { color: "rgba(234,240,255,0.70)", fontWeight: "900" },
  toggleTextOn: { color: colors.text },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillText: { color: colors.text, fontWeight: "900", fontSize: 12 },

  heroRow: { gap: 4, marginTop: 2 },
  heroLabel: { color: colors.muted, fontSize: 12.5, fontWeight: "800" },
  heroValue: { fontSize: 28, fontWeight: "900" },

  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  safeValue: { fontSize: 28, fontWeight: "900", color: colors.success },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" },
  actionBtn: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  actionBtnAlt: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  actionBtnText: { color: colors.text, fontWeight: "900" },

  billRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  billName: { color: colors.text, fontWeight: "900" },
  billMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  billAmt: { color: colors.text, fontWeight: "900" },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { color: "rgba(234,240,255,0.86)", fontSize: 12, fontWeight: "900" },

  linkRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    marginTop: 2,
  },
  linkText: { color: colors.text, fontWeight: "900" },

  row: { flexDirection: "row", justifyContent: "space-between" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  rowTitle: { color: colors.muted, fontSize: 12 },
  rowValue: { color: colors.text, fontWeight: "800" },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 },

  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 2,
  },
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
    gap: 10,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.panel2,
  },
  itemTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: { color: colors.text, fontWeight: "900", flex: 1 },

  dot: { width: 10, height: 10, borderRadius: 999 },
  dotEssential: { backgroundColor: "rgba(43, 91, 255, 0.90)" },
  dotOptional: { backgroundColor: "rgba(234,240,255,0.45)" },
  dotIncome: { backgroundColor: "rgba(90, 230, 170, 0.85)" },

  itemMeta: { color: colors.muted, fontSize: 12, fontWeight: "700" },
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

  // ✅ Added: Floating AI button style
  fab: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
    }),
  },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
