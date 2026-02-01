// app/(tabs)/transaction-add.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import EmotionPicker from "../../components/EmotionPicker";
import { StressSlider } from "../../components/StressSlider";
import { SoftButton } from "../../components/SoftButton";
import { useTransactions } from "../../hooks/useTransactions";
import { fmtUSD } from "../../lib/currency";
import type { Transaction, Reflection, TxCategory } from "../../types";

const CATEGORIES: TxCategory[] = [
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

type TxDraft = {
  amount: string;
  merchantName: string;
  category: TxCategory;
};

function sanitizeMoneyInput(input: string) {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

function parseAmount(input: string) {
  const n = Number(String(input || "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function TransactionAddScreen() {
  const insets = useSafeAreaInsets();
  const store = useTransactions();

  const amountRef = useRef<TextInput | null>(null);

  const [draft, setDraft] = useState<TxDraft>({
    amount: "",
    merchantName: "",
    category: "Dining",
  });

  const [emotion, setEmotion] = useState<string | undefined>();
  const [stress, setStress] = useState<number>(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof TxDraft>(key: K, value: TxDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const amountNumber = useMemo(() => parseAmount(draft.amount || "0"), [draft.amount]);

  const canSave = useMemo(() => {
    return amountNumber > 0 && draft.merchantName.trim().length >= 2;
  }, [amountNumber, draft.merchantName]);

  async function save({ goToDetail }: { goToDetail?: boolean } = {}) {
    if (!canSave || saving) return;
    setSaving(true);

    const base = Date.now();
    const txId = `t_${base}_${Math.random().toString(16).slice(2)}`;
    const now = new Date().toISOString();

    const tx: Transaction = {
      id: txId,
      postedAt: now,
      amount: amountNumber,
      merchantName: draft.merchantName.trim(),
      category: draft.category || "Other",
    };

    try {
      store.addTransaction(tx);

      const didCheckIn = Boolean(emotion) || note.trim().length > 0 || stress !== 2;
      if (didCheckIn) {
        const reflection: Reflection = {
          id: `r_${base}_${Math.random().toString(16).slice(2)}`,
          transactionId: txId,
          createdAt: now,
          stress: stress >= 4 ? "high_stress" : stress <= 1 ? "low_stress" : "neutral",
          reasonTags: emotion ? [emotion] : [],
          note: note.trim() || undefined,
        };
        store.addReflection(reflection);
      }

      if (goToDetail) {
        router.replace({ pathname: "/transaction/[id]" as any, params: { id: txId } } as any);
      } else {
        router.back();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.page}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.topBtn, pressed && styles.pressed]}>
          <Text style={styles.topBtnText}>Close</Text>
        </Pressable>

        <Text style={styles.title}>Add transaction</Text>

        <Pressable
          onPress={() => save({ goToDetail: false })}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.topBtn,
            (!canSave || saving) && styles.topBtnDisabled,
            pressed && canSave && !saving && styles.pressed,
          ]}
        >
          <Text style={styles.topBtnText}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 92 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 14,
            paddingBottom: 120 + Math.max(insets.bottom, 10),
            gap: 12,
          }}
        >
          <Card style={{ gap: 12 }}>
            <Text style={styles.sectionTitleSmall}>Details</Text>

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.moneyRow}>
                <Text style={styles.moneyPrefix}>$</Text>
                <TextInput
                  ref={(r) => { amountRef.current = r; }}
                  value={draft.amount}
                  onChangeText={(v) => setField("amount", sanitizeMoneyInput(v))}
                  placeholder="0.00"
                  placeholderTextColor="rgba(234,240,255,0.38)"
                  style={styles.moneyInput}
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.helper}>
                {draft.amount ? `You entered: ${fmtUSD(amountNumber || 0)}` : "Tip: keep it tiny if you need to."}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Merchant</Text>
              <TextInput
                value={draft.merchantName}
                onChangeText={(v) => setField("merchantName", v)}
                placeholder="HEB, Rent, Target…"
                placeholderTextColor="rgba(234,240,255,0.38)"
                style={styles.input}
                returnKeyType="done"
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map((c) => {
                  const active = draft.category === c;
                  return (
                    <Pressable
                      key={String(c)}
                      onPress={() => setField("category", c)}
                      style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && { opacity: 0.9 },
                      ]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{String(c)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={styles.sectionTitleSmall}>Optional reflection</Text>
            <Text style={styles.mutedLine}>For patterns, not judgment.</Text>

            <EmotionPicker value={emotion} onChange={setEmotion} />
            <StressSlider value={stress} onChange={setStress} />

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Optional note</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Anything you want to remember?"
                placeholderTextColor="rgba(234,240,255,0.38)"
                style={[styles.input, { minHeight: 44, maxHeight: 140 }]}
                multiline
              />
            </View>
          </Card>

          <SoftButton
            title="Save & view details"
            onPress={() => save({ goToDetail: true })}
            disabled={!canSave || saving}
            variant="ghost"
          />

          {!canSave && <Text style={styles.hint}>Add an amount + a merchant (2+ letters).</Text>}
        </ScrollView>

        {/* Bottom bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <SoftButton
            title={saving ? "Saving..." : "Save transaction"}
            onPress={() => save({ goToDetail: false })}
            disabled={!canSave || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: { color: colors.text, fontSize: 16, fontWeight: "900" },

  topBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    minWidth: 72,
    alignItems: "center",
  },
  topBtnDisabled: { opacity: 0.5 },
  topBtnText: { color: colors.text, fontWeight: "900" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  sectionTitleSmall: { color: colors.text, fontWeight: "900" },
  mutedLine: { color: "rgba(234,240,255,0.58)", marginTop: 2, lineHeight: 18, fontWeight: "600" },

  label: { color: "rgba(234,240,255,0.55)", fontSize: 12, fontWeight: "800" },

  input: {
    minHeight: 44,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    fontSize: 14,
  },

  moneyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  moneyPrefix: { color: "rgba(234,240,255,0.55)", fontWeight: "900", fontSize: 14, paddingTop: 1 },
  moneyInput: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    paddingVertical: 10,
  },
  helper: { color: "rgba(234,240,255,0.55)", fontSize: 12, marginTop: -2, fontWeight: "600" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: { borderColor: "rgba(43, 91, 255, 0.35)", backgroundColor: "rgba(43, 91, 255, 0.14)" },
  chipText: { color: "rgba(234,240,255,0.62)", fontWeight: "800", fontSize: 12.5 },
  chipTextActive: { color: "rgba(234,240,255,0.92)" },

  hint: { color: "rgba(234,240,255,0.55)", fontSize: 12, lineHeight: 16, fontWeight: "600", marginTop: 8 },

  bottomBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: "rgba(11,15,20,0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
