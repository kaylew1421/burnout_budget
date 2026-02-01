// app/(tabs)/transactions.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { SoftButton } from "../../components/SoftButton";
import { useTransactions } from "../../hooks/useTransactions";
import { fmtUSD } from "../../lib/currency";
import type { TxCategory } from "../../types";

type CategoryFilter = "All" | TxCategory;

const CATEGORIES: CategoryFilter[] = [
  "All",
  "Groceries",
  "Dining",
  "Gas",
  "Bills",
  "Shopping",
  "Health",
  "Kids",
  "Subscriptions",
  "Other",
];

/**
 * Change this to match where your detail screen lives:
 * - app/transaction/[id].tsx => "/transaction/[id]"
 * - app/(tabs)/transaction/[id].tsx => "/(tabs)/transaction/[id]"
 */
const TX_DETAIL_PATH = "/transaction/[id]";
const ADD_PATH = "/(tabs)/transaction-add";

function isSameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const store = useTransactions();
  const { transactions } = store;

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<CategoryFilter>("All");

  // tiny toast (optional)
  const toastY = useState(() => new Animated.Value(-16))[0];
  const toastOpacity = useState(() => new Animated.Value(0))[0];
  const [toastText, setToastText] = useState("Saved");

  function showToast(text: string) {
    setToastText(text);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(toastY, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(toastY, { toValue: -16, duration: 180, useNativeDriver: true }),
        ]).start();
      }, 900);
    });
  }

  function openAdd() {
    router.push(ADD_PATH as any);
  }

  function openDetail(id: string) {
    router.push({ pathname: TX_DETAIL_PATH as any, params: { id } } as any);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (transactions?.slice?.() ?? []).slice();

    list.sort((a: any, b: any) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    return list.filter((t: any) => {
      const catOk = activeCat === "All" ? true : t.category === activeCat;

      const qOk = !q
        ? true
        : String(t.merchantName || "").toLowerCase().includes(q) ||
          String(t.category || "").toLowerCase().includes(q) ||
          fmtUSD(Number(t.amount || 0)).toLowerCase().includes(q);

      return catOk && qOk;
    });
  }, [transactions, query, activeCat]);

  const grouped = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const g: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };

    filtered.forEach((t: any) => {
      const d = new Date(t.postedAt);
      if (isSameYMD(d, today)) g.Today.push(t);
      else if (isSameYMD(d, yesterday)) g.Yesterday.push(t);
      else g.Earlier.push(t);
    });

    return g;
  }, [filtered]);

  const monthTotal = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const sum = (transactions ?? []).reduce((acc: number, t: any) => {
      const d = new Date(t.postedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (k !== monthKey) return acc;
      return acc + Number(t.amount || 0);
    }, 0);

    return sum;
  }, [transactions]);

  const empty = filtered.length === 0;

  return (
    <View style={styles.page}>
      <Animated.View
        pointerEvents="none"
        style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}
      >
        <Text style={styles.toastText}>{toastText}</Text>
      </Animated.View>

      {/* Header (moved down) */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.h1}>Transactions</Text>
          <View style={styles.kpiPill}>
            <Text style={styles.kpiLabel}>This month</Text>
            <Text style={styles.kpiValue}>{fmtUSD(monthTotal)}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="rgba(234,240,255,0.55)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search merchant, category, amount…"
            placeholderTextColor="rgba(234,240,255,0.38)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
              <Ionicons name="close" size={16} color="rgba(234,240,255,0.72)" />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {CATEGORIES.map((c) => {
            const active = activeCat === c;
            return (
              <Pressable
                key={String(c)}
                onPress={() => setActiveCat(c)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{String(c)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        {(["Today", "Yesterday", "Earlier"] as const).map((section) => {
          const rows = grouped[section];
          if (!rows.length) return null;

          return (
            <View key={section} style={{ gap: 10 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{section}</Text>
                <Text style={styles.sectionHint}>{rows.length}</Text>
              </View>

              <View style={{ gap: 10 }}>
                {rows.map((t: any) => (
                  <Pressable
                    key={t.id}
                    onPress={() => openDetail(String(t.id))}
                    style={({ pressed }) => [styles.txRow, pressed && styles.txPressed]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txMerchant} numberOfLines={1}>
                        {t.merchantName}
                      </Text>
                      <Text style={styles.txMeta}>
                        {t.category} • {new Date(t.postedAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text style={styles.txAmt}>{fmtUSD(Number(t.amount || 0))}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {empty && (
          <Card style={{ gap: 10 }}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyBody}>Add your first transaction. Start tiny.</Text>
            <SoftButton title="Add transaction" onPress={openAdd} />
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={openAdd}
        style={({ pressed }) => [
          styles.fab,
          { bottom: 18 + 62 + Math.max(insets.bottom, 0) },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },

  toast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 14 : 10,
    alignSelf: "center",
    zIndex: 50,
    backgroundColor: "rgba(18, 24, 38, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  toastText: { color: colors.text, fontWeight: "900" },

  header: { paddingHorizontal: 14, gap: 10 },
  headerTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },

  kpiPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-end",
  },
  kpiLabel: { color: "rgba(234,240,255,0.55)", fontSize: 11.5, fontWeight: "800" },
  kpiValue: { color: colors.text, fontSize: 13.5, fontWeight: "900", marginTop: 2 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: "700", paddingVertical: 0 },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  filtersRow: { paddingVertical: 2, gap: 8, paddingRight: 10 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterChipActive: { borderColor: "rgba(43, 91, 255, 0.35)", backgroundColor: "rgba(43, 91, 255, 0.14)" },
  filterText: { color: "rgba(234,240,255,0.62)", fontWeight: "800", fontSize: 12.5 },
  filterTextActive: { color: "rgba(234,240,255,0.92)" },

  list: { padding: 14, gap: 14 },

  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { color: colors.text, fontWeight: "900", fontSize: 14.5 },
  sectionHint: { color: "rgba(234,240,255,0.55)", fontWeight: "800" },

  txRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  txPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  txMerchant: { color: colors.text, fontWeight: "900", fontSize: 14 },
  txMeta: { color: "rgba(234,240,255,0.55)", fontSize: 12, marginTop: 2, fontWeight: "700" },
  txAmt: { color: colors.text, fontWeight: "900" },

  emptyTitle: { color: colors.text, fontWeight: "900", fontSize: 14.5 },
  emptyBody: { color: "rgba(234,240,255,0.62)", lineHeight: 18, fontWeight: "600" },

  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 8 },
    }),
  },
  fabPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
