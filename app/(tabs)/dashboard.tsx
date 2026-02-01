// app/(tabs)/dashboard.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";

type BurnoutLevel = "low" | "medium" | "high";
type SnapshotKey = "safe" | "recurrings" | "spent" | "next";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getLevel(score: number): BurnoutLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function niceDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dailyEncouragement() {
  const lines = [
    "Let’s take today one step at a time.",
    "Small steps still count.",
    "No shame — just information.",
    "Progress > perfection.",
    "Keep it gentle today.",
  ];
  return lines[new Date().getDay() % lines.length];
}

function dailyQuote() {
  const quotes = [
    "You’re not behind. You’re building a system.",
    "Small awareness beats big regret.",
    "No shame. Just signals.",
    "You don’t have to fix everything today.",
    "Progress feels boring before it feels powerful.",
    "Breathe. Look. Decide calmly.",
    "Stable > perfect. Every time.",
  ];
  return quotes[new Date().getDate() % quotes.length];
}

function levelLabel(level: BurnoutLevel) {
  if (level === "high") return "High weight day";
  if (level === "medium") return "Steady day";
  return "Gentle day";
}

function levelNudge(level: BurnoutLevel) {
  if (level === "high") return "Keep it small today. Protect essentials and pause extras.";
  if (level === "medium") return "You’re steady. One mindful choice keeps you aligned.";
  return "Light day energy. Small choices still count.";
}

function levelAccent(level: BurnoutLevel) {
  switch (level) {
    case "high":
      return {
        fill: "rgba(255, 92, 92, 0.70)",
        pillBg: "rgba(255, 92, 92, 0.16)",
        pillBorder: "rgba(255, 92, 92, 0.35)",
        glow: "rgba(255, 92, 92, 0.20)",
      };
    case "medium":
      return {
        fill: "rgba(255, 184, 77, 0.70)",
        pillBg: "rgba(255, 184, 77, 0.14)",
        pillBorder: "rgba(255, 184, 77, 0.32)",
        glow: "rgba(255, 184, 77, 0.18)",
      };
    default:
      return {
        fill: "rgba(90, 230, 170, 0.62)",
        pillBg: "rgba(90, 230, 170, 0.12)",
        pillBorder: "rgba(90, 230, 170, 0.28)",
        glow: "rgba(90, 230, 170, 0.14)",
      };
  }
}

function formatUpdatedTime() {
  return new Date().toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function snapIcon(key: SnapshotKey) {
  switch (key) {
    case "safe":
      return "shield-checkmark-outline";
    case "recurrings":
      return "calendar-outline";
    case "spent":
      return "receipt-outline";
    case "next":
      return "navigate-outline";
  }
}

function snapAccent(key: SnapshotKey) {
  switch (key) {
    case "safe":
      return {
        strip: "rgba(90, 230, 170, 0.55)",
        iconBg: "rgba(90, 230, 170, 0.14)",
        iconBorder: "rgba(90, 230, 170, 0.28)",
      };
    case "recurrings":
      return {
        strip: "rgba(255, 184, 77, 0.65)",
        iconBg: "rgba(255, 184, 77, 0.14)",
        iconBorder: "rgba(255, 184, 77, 0.28)",
      };
    case "spent":
      return {
        strip: "rgba(43, 91, 255, 0.65)",
        iconBg: "rgba(43, 91, 255, 0.14)",
        iconBorder: "rgba(43, 91, 255, 0.28)",
      };
    case "next":
      return {
        strip: "rgba(183, 92, 255, 0.60)",
        iconBg: "rgba(183, 92, 255, 0.14)",
        iconBorder: "rgba(183, 92, 255, 0.28)",
      };
  }
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  const userName: string | null = null;

  // TODO: replace with real data store later
  const spentToday = 96.75;
  const recurringsSoon = 480.0;
  const safeToSpend = 40.25;
  const reflections = 4;

  const burnoutScore = 78;
  const score = clamp(burnoutScore, 0, 100);
  const level = getLevel(score);
  const meterWidth = `${score}%` as const;
  const accents = levelAccent(level);

  const focusLine = useMemo(() => {
    if (safeToSpend <= 0) return "Today’s focus: pause extras and protect essentials.";
    if (safeToSpend <= 25) return "Today’s focus: keep spending tight until bills clear.";
    return "Today’s focus: stay consistent — small choices keep you stable.";
  }, [safeToSpend]);

  const intentions = useMemo(() => {
    // Simple, reflective bullet-like prompts (MVP)
    if (safeToSpend <= 0) {
      return [
        "Avoid non-essentials until bills clear.",
        "If you spend, keep it needs-only.",
        "Log 1 transaction so future you has clarity.",
      ];
    }
    if (safeToSpend <= 25) {
      return [
        "Keep spending intentional (food, gas, needs).",
        "Delay “wants” until after the next bill is paid.",
        "Log 1 transaction + a quick reflection.",
      ];
    }
    return [
      "Stay steady — don’t drift into random spending.",
      "If you treat yourself, pick one thing (not five).",
      "Log 1 transaction to keep the streak alive.",
    ];
  }, [safeToSpend]);

  const snapshotCards = useMemo(
    () =>
      [
        {
          key: "safe" as const,
          title: "Safe-to-spend",
          value: formatMoney(safeToSpend),
          sub: safeToSpend <= 25 ? "Tight day" : "Covered",
          href: "/(tabs)/gap",
        },
        {
          key: "recurrings" as const,
          title: "Bills soon",
          value: formatMoney(recurringsSoon),
          sub: "Next 7 days",
          href: "/(tabs)/recurrings",
        },
        {
          key: "spent" as const,
          title: "Spent today",
          value: formatMoney(spentToday),
          sub: "Review",
          href: "/(tabs)/transactions",
        },
        {
          key: "next" as const,
          title: "Next steps",
          value: "Plan",
          sub: `${reflections} reflections`,
          href: "/(tabs)/next-steps",
        },
      ] as Array<{ key: SnapshotKey; title: string; value: string; sub: string; href: string }>,
    [safeToSpend, recurringsSoon, spentToday, reflections]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 26 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.kicker}>
              {greeting()} • {niceDate()}
            </Text>

            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>Updated {formatUpdatedTime()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{userName ? `Hello, ${userName} 👋` : "Hello 👋"}</Text>
          <Text style={styles.subtitle}>{dailyEncouragement()}</Text>
        </View>

        {/* ✅ Motivational status + reflective intent (no action buttons) */}
        <View style={[styles.card, styles.cardElevated]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Today’s status</Text>

            <View style={[styles.pill, { backgroundColor: accents.pillBg, borderColor: accents.pillBorder }]}>
              <Text style={styles.pillText}>{levelLabel(level)}</Text>
            </View>
          </View>

          <View
            style={styles.meterWrap}
            accessibilityRole="progressbar"
            accessibilityLabel="Burnout meter"
            accessibilityValue={{ now: score, min: 0, max: 100 }}
          >
            <View style={styles.meterTrack} />
            <View style={[styles.meterFill, { width: meterWidth, backgroundColor: accents.fill, shadowColor: accents.glow }]} />
          </View>

          <View style={styles.meterMetaRow}>
            <Text style={styles.meterMetaLeft}>Score</Text>
            <Text style={styles.meterMetaRight}>{score}/100</Text>
          </View>

          <Text style={styles.cardBody}>{levelNudge(level)}</Text>

          {/* Quote block */}
          <View style={styles.quoteBlock}>
            <Text style={styles.quoteText}>{dailyQuote()}</Text>
            <Text style={styles.quoteSub}>{focusLine}</Text>
          </View>

          {/* Intentions (bullet style) */}
          <View style={styles.intentWrap}>
            <Text style={styles.intentTitle}>Keep it simple:</Text>

            <View style={{ gap: 8, marginTop: 10 }}>
              {intentions.map((line, idx) => (
                <View key={`${idx}_${line}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.microRow}>
            <Text style={styles.microText}>No judgment • Just patterns • You’re in control</Text>
          </View>
        </View>

        {/* Snapshot (4 blocks like your example) */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Snapshot</Text>
            <Text style={styles.sectionHint}>today at a glance</Text>
          </View>

          <View style={styles.snapshotGrid}>
            {snapshotCards.map((c) => {
              const a = snapAccent(c.key);
              return (
                <Pressable
                  key={c.key}
                  onPress={() => router.push(c.href as any)}
                  style={({ pressed }) => [styles.snapBlock, pressed && styles.itemPressed]}
                >
                  <View style={[styles.snapStrip, { backgroundColor: a.strip }]} />

                  <View style={[styles.snapIcon, { backgroundColor: a.iconBg, borderColor: a.iconBorder }]}>
                    <Ionicons name={snapIcon(c.key) as any} size={18} color="rgba(234,240,255,0.92)" />
                  </View>

                  <Text style={styles.snapTitle}>{c.title}</Text>
                  <Text style={styles.snapValue}>{c.value}</Text>
                  <Text style={styles.snapSub}>{c.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tiny wins */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tiny wins</Text>
            <Text style={styles.sectionHint}>low effort • high impact</Text>
          </View>

          <TinyWin title="Quick check-in" body="Take 30 seconds and name the feeling." cta="Open" href="/(tabs)/ai-chat" />
          <View style={styles.divider} />
          <TinyWin title="See patterns" body="Spot triggers and build one safe plan." cta="View" href="/(tabs)/trends" />
          <View style={styles.divider} />
          <TinyWin title="Upcoming bills" body="See what’s coming so you can breathe." cta="View" href="/(tabs)/recurrings" />
        </View>
      </ScrollView>
    </View>
  );
}

function TinyWin({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <View style={styles.tinyWinRow}>
      <View style={styles.dot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tinyWinTitle}>{title}</Text>
        <Text style={styles.tinyWinBody}>{body}</Text>
      </View>

      <Link href={href as any} asChild>
        <Pressable style={({ pressed }) => [styles.miniBtn, pressed && styles.btnPressed]}>
          <Text style={styles.miniBtnText}>{cta}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },

  header: { marginBottom: 12 },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  kicker: { color: "rgba(234,240,255,0.62)", fontSize: 12.5, fontWeight: "700" },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statusChipText: { color: "rgba(234,240,255,0.70)", fontSize: 12, fontWeight: "800" },

  title: { color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: 0.2 },
  subtitle: { color: "rgba(234,240,255,0.72)", marginTop: 4, fontSize: 13.5, fontWeight: "600" },

  card: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardElevated: {
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 6 },
    }),
  },

  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { color: "rgba(234,240,255,0.88)", fontSize: 13.5, fontWeight: "800" },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: "900" },

  meterWrap: { height: 12, borderRadius: 999, marginTop: 12, overflow: "hidden", position: "relative" },
  meterTrack: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.08)" },
  meterFill: { height: "100%", borderRadius: 999, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },

  meterMetaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  meterMetaLeft: { color: "rgba(234,240,255,0.60)", fontSize: 12.5, fontWeight: "700" },
  meterMetaRight: { color: "rgba(234,240,255,0.92)", fontSize: 12.5, fontWeight: "900" },

  cardBody: { color: "rgba(234,240,255,0.72)", marginTop: 10, fontSize: 13.5, lineHeight: 19, fontWeight: "600" },

  quoteBlock: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quoteText: { color: colors.text, fontWeight: "900", fontSize: 15, lineHeight: 20 },
  quoteSub: { color: "rgba(234,240,255,0.72)", marginTop: 8, fontWeight: "700", lineHeight: 18 },

  intentWrap: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  intentTitle: { color: "rgba(234,240,255,0.85)", fontWeight: "900" },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: "rgba(43, 91, 255, 0.9)", marginTop: 6 },
  bulletText: { flex: 1, color: "rgba(234,240,255,0.72)", fontWeight: "700", lineHeight: 18 },

  btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  microRow: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  microText: { color: "rgba(234,240,255,0.55)", fontSize: 12.5, fontWeight: "700" },

  sectionHeaderRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
  sectionHint: { color: "rgba(234,240,255,0.55)", fontSize: 12.5, fontWeight: "700" },

  snapshotGrid: { marginTop: 2, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  snapBlock: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 18,
    padding: 12,
    paddingTop: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 120,
    overflow: "hidden",
  },
  snapStrip: { position: "absolute", left: 0, top: 0, bottom: 0, width: 10, opacity: 0.9 },
  snapIcon: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  snapTitle: { color: "rgba(234,240,255,0.68)", fontWeight: "900", fontSize: 12.5, marginTop: 6 },
  snapValue: { color: colors.text, fontWeight: "900", fontSize: 18, marginTop: 8 },
  snapSub: { color: "rgba(234,240,255,0.52)", fontWeight: "700", fontSize: 12, marginTop: 6 },

  itemPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  tinyWinRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "rgba(43, 91, 255, 0.9)" },
  tinyWinTitle: { color: colors.text, fontSize: 13.5, fontWeight: "900" },
  tinyWinBody: { color: "rgba(234,240,255,0.70)", fontSize: 12.5, marginTop: 2, fontWeight: "600" },

  miniBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  miniBtnText: { color: colors.text, fontWeight: "900", fontSize: 12.5 },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 10 },
});
