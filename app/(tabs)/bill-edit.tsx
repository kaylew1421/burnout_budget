// app/(tabs)/bill-edit.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  type TextInputProps,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { useBills } from "../../hooks/useBills";
import { ymd } from "../../lib/date";
import type { Cadence, BillType } from "../../features/gap/gap.types";

const TYPE_OPTIONS: BillType[] = ["rent", "utilities", "phone", "loan", "subscription", "other"];
const CADENCE_OPTIONS: Cadence[] = ["monthly", "weekly", "one_time"];

/**
 * Safe back helper:
 * - prevents "GO_BACK not handled"
 * - sends user to a real tab if there is no history
 */
function goBackSafe(router: any, fallback: string = "/(tabs)/recurrings") {
  if (router?.canGoBack?.()) router.back();
  else router.replace(fallback as any);
}

/**
 * Display format: MM/DD/YYYY
 * Stored format (engine): YYYY-MM-DD
 */
function ymdToMdy(ymdStr: string) {
  if (!ymdStr) return "";
  const parts = ymdStr.split("-");
  if (parts.length !== 3) return ymdStr;
  const [y, m, d] = parts;
  return `${m}/${d}/${y}`;
}

function isValidMdy(mdyStr: string) {
  // light validation: MM/DD/YYYY with basic range checks
  const parts = mdyStr.split("/");
  if (parts.length !== 3) return false;
  const [mRaw, dRaw, yRaw] = parts;

  if (yRaw.length !== 4) return false;

  const m = Number(mRaw);
  const d = Number(dRaw);
  const y = Number(yRaw);

  if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(y)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  // validate actual date
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function mdyToYmd(mdyStr: string) {
  if (!mdyStr) return "";
  const parts = mdyStr.split("/");
  if (parts.length !== 3) return mdyStr;

  const [mRaw, dRaw, yRaw] = parts;
  const m = mRaw.padStart(2, "0");
  const d = dRaw.padStart(2, "0");
  const y = yRaw;

  if (y.length !== 4) return mdyStr;
  return `${y}-${m}-${d}`;
}

function cleanAmount(v: string) {
  const stripped = v.replace(/[^0-9.]/g, "");
  const parts = stripped.split(".");
  if (parts.length <= 1) return stripped;
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

export default function BillEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params?.id ? String(params.id) : undefined;

  const { getBillById, addBill, updateBill, deleteBill } = useBills();

  const existing = useMemo(() => {
    return editingId ? getBillById(editingId) : undefined;
  }, [editingId, getBillById]);

  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount != null ? String(existing.amount) : "");
  const [dueDate, setDueDate] = useState(existing ? ymdToMdy(existing.dueDate) : ymdToMdy(ymd()));
  const [type, setType] = useState<BillType>(existing?.type ?? "other");
  const [cadence, setCadence] = useState<Cadence>(existing?.cadence ?? "monthly");
  const [isEssential, setIsEssential] = useState(existing?.isEssential ?? true);

  const canSave =
    name.trim().length >= 2 &&
    Number.isFinite(Number(cleanAmount(amount))) &&
    Number(cleanAmount(amount)) > 0 &&
    isValidMdy(dueDate);

  function onSave() {
    if (!canSave) {
      Alert.alert(
        "Missing info",
        "Please add a name, a valid amount, and a due date like 02/05/2026."
      );
      return;
    }

    const amt = Number(cleanAmount(amount));

    const payload = {
      name: name.trim(),
      amount: amt,
      dueDate: mdyToYmd(dueDate), // store as YYYY-MM-DD
      type,
      cadence,
      isEssential,
    };

    if (existing) updateBill(existing.id, payload);
    else addBill(payload);

    goBackSafe(router, "/(tabs)/recurrings");
  }

  function onDelete() {
    if (!existing) return;

    Alert.alert("Delete bill?", `Delete "${existing.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteBill(existing.id);
          goBackSafe(router, "/(tabs)/recurrings");
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.page, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header row w/ Back */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => goBackSafe(router, "/(tabs)/recurrings")}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressedSoft]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{existing ? "Edit bill" : "Add a bill"}</Text>
            <Text style={styles.sub}>This powers your schedule + safe-to-spend.</Text>
          </View>
        </View>

        <Card style={{ gap: 12 }}>
          <Field
            label="Bill name"
            value={name}
            onChangeText={setName}
            placeholder="Rent, Electric, Phone…"
            returnKeyType="next"
          />

          <Field
            label="Amount"
            value={amount}
            onChangeText={(v) => setAmount(cleanAmount(v))}
            placeholder="0.00"
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          />

          <Field
            label="Due date (MM/DD/YYYY)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="02/05/2026"
            keyboardType="number-pad"
          />

          {!isValidMdy(dueDate) && (
            <Text style={styles.hint}>Due date should look like 02/05/2026.</Text>
          )}

          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {TYPE_OPTIONS.map((t) => {
              const selected = t === type;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipOn,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Cadence</Text>
          <View style={styles.chips}>
            {CADENCE_OPTIONS.map((c) => {
              const selected = c === cadence;
              const label = c === "one_time" ? "one time" : c;

              return (
                <Pressable
                  key={c}
                  onPress={() => setCadence(c)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipOn,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Essential</Text>
              <Text style={styles.switchHint}>
                Essentials are used for the gap math (unless settings include optional bills).
              </Text>
            </View>
            <Switch value={isEssential} onValueChange={setIsEssential} />
          </View>

          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && { opacity: 0.55 },
              pressed && canSave && styles.pressed,
            ]}
          >
            <Text style={styles.saveBtnText}>{existing ? "Save changes" : "Add bill"}</Text>
          </Pressable>

          {existing && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressedSoft]}
            >
              <Text style={styles.deleteBtnText}>Delete bill</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => goBackSafe(router, "/(tabs)/recurrings")}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressedSoft]}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>

          <Text style={styles.muted}>Later we can add “quick add” presets (Rent/Phone/etc).</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  returnKeyType?: TextInputProps["returnKeyType"];
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(234,240,255,0.35)"
        keyboardType={props.keyboardType}
        returnKeyType={props.returnKeyType}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12, paddingBottom: 24 },

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
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

  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 2 },

  label: { color: "rgba(234,240,255,0.70)", fontSize: 12.5, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontWeight: "700",
  },

  hint: { color: "rgba(234,240,255,0.55)", fontSize: 12, lineHeight: 16, marginTop: -4 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chipOn: {
    borderColor: "rgba(43, 91, 255, 0.55)",
    backgroundColor: "rgba(43, 91, 255, 0.18)",
  },
  chipText: { color: "rgba(234,240,255,0.70)", fontWeight: "900", fontSize: 12 },
  chipTextOn: { color: colors.text },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
  },
  switchTitle: { color: colors.text, fontWeight: "900" },
  switchHint: { color: colors.muted, fontSize: 12, marginTop: 2 },

  saveBtn: {
    marginTop: 6,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "900" },

  deleteBtn: {
    backgroundColor: "rgba(255, 92, 92, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(255, 92, 92, 0.35)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteBtnText: { color: "rgba(255, 160, 160, 0.95)", fontWeight: "900" },

  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: colors.text, fontWeight: "900" },

  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
