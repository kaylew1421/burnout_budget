// app/(tabs)/settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
  Platform,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";

/**
 * Helpers
 */
function pctToString(p: number) {
  const n = Math.round(p * 1000) / 10; // 1 decimal max
  return String(n).replace(/\.0$/, "");
}

function stringToPct(s: string) {
  const cleaned = s.replace(/[^0-9.]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(50, num)) / 100; // clamp 0%..50%
}

/**
 * Design tokens for this page
 */
const stylesVars = {
  bg: "#0E0F13",
  card: "#171923",
  divider: "rgba(255,255,255,0.06)",
  section: "#8A8F98",
  placeholder: "rgba(234,240,255,0.35)",
  chev: "#6B7280",
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const s = useSettings();
  const auth = useAuth();

  const isAuthed = !!auth.user;
  const userEmail = auth.user?.email ?? "";
  const userDisplayName = auth.user?.displayName?.trim() ?? "";

  const derivedFromEmail = useMemo(() => {
    const prefix = userEmail.split("@")[0]?.trim();
    if (!prefix) return "";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }, [userEmail]);

  const displayNameShown = useMemo(() => {
    if (!isAuthed) return "Guest";
    return userDisplayName || s.displayName || derivedFromEmail || "Guest";
  }, [isAuthed, userDisplayName, s.displayName, derivedFromEmail]);

  // local input state so typing doesn't feel weird
  const [nameText, setNameText] = useState(displayNameShown);
  const [bufferText, setBufferText] = useState(pctToString(s.bufferPercent));

  // ✅ FIX: useEffect (not useMemo) to sync inputs when store/auth changes
  useEffect(() => {
    setBufferText(pctToString(s.bufferPercent));
    setNameText(displayNameShown);
  }, [s.bufferPercent, displayNameShown]);

  function commitBuffer() {
    const pct = stringToPct(bufferText);
    if (pct === null) {
      setBufferText(pctToString(s.bufferPercent));
      return;
    }
    s.setSettings({ bufferPercent: pct });
    setBufferText(pctToString(pct));
  }

  function commitName() {
    const next = nameText.trim();

    // Keep local displayName as fallback (Firebase profile update later if you want).
    s.setSettings({ displayName: next || (isAuthed ? displayNameShown : "Guest") });
    setNameText(next || (isAuthed ? displayNameShown : "Guest"));
  }

  function confirmReset() {
    Alert.alert("Reset settings?", "This will restore defaults (your demo data stays).", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => s.reset() },
    ]);
  }

  function handleSignOut() {
    Alert.alert("Sign out?", "You’ll return to the login screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
          } finally {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Settings</Text>
          <Text style={styles.sub}>
            {isAuthed ? "Signed in" : "Guest mode"} • saved on this device
          </Text>
        </View>

        {/* GENERAL */}
        <SettingSection title="General">
          <View style={styles.formBlock}>
            <Text style={styles.formLabel}>Display name</Text>
            <TextInput
              value={nameText}
              onChangeText={setNameText}
              onBlur={commitName}
              placeholder={isAuthed ? "Your name" : "Guest"}
              placeholderTextColor={stylesVars.placeholder}
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="done"
            />
            {!!isAuthed && !!userEmail && <Text style={styles.formHint}>Account: {userEmail}</Text>}
          </View>

          <Divider />

          {/* Login row */}
          {isAuthed ? (
            <SettingRow
              iconName="person-circle-outline"
              iconBg="rgba(120, 150, 255, 0.18)"
              title="Account"
              subtitle={userEmail || "Signed in"}
              right={<Pill label="Active" />}
              disabled
            />
          ) : (
            <Pressable onPress={() => router.push("/(auth)/login")} style={({ pressed }) => [pressed && styles.pressed]}>
              <SettingRow
                iconName="log-in-outline"
                iconBg="rgba(120, 150, 255, 0.18)"
                title="Login"
                subtitle="Sign in to personalize your dashboard"
              />
            </Pressable>
          )}

          {isAuthed ? (
            <>
              <Divider />
              <Pressable onPress={handleSignOut} style={({ pressed }) => [pressed && styles.pressed]}>
                <SettingRow
                  iconName="log-out-outline"
                  iconBg="rgba(255, 120, 120, 0.16)"
                  title="Sign out"
                  subtitle="Return to the login screen"
                />
              </Pressable>
            </>
          ) : null}
        </SettingSection>

        {/* PLAN / GAP */}
        <SettingSection title="Plan preferences">
          <View style={styles.formBlock}>
            <Text style={styles.formLabel}>Buffer</Text>
            <Text style={styles.formHelp}>
              A little padding so “safe-to-spend” doesn’t go razor thin.
            </Text>

            <View style={styles.inlineRow}>
              <TextInput
                value={bufferText}
                onChangeText={setBufferText}
                onBlur={commitBuffer}
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                placeholder="5"
                placeholderTextColor={stylesVars.placeholder}
                style={[styles.input, { flex: 1 }]}
              />
              <View style={styles.suffixBox}>
                <Text style={styles.suffixText}>%</Text>
              </View>
            </View>

            <Text style={styles.formHint}>
              Common: 3–10%. You’re using {pctToString(s.bufferPercent)}%.
            </Text>
          </View>

          <Divider />

          <SettingInlineChips
            iconName="calculator-outline"
            iconBg="rgba(255, 210, 120, 0.18)"
            title="Rounding"
            subtitle="Optional rounding for quick planning."
          >
            <View style={styles.chips}>
              <Chip label="None" selected={s.rounding === "none"} onPress={() => s.setSettings({ rounding: "none" })} />
              <Chip
                label="Nearest $5"
                selected={s.rounding === "nearest_5"}
                onPress={() => s.setSettings({ rounding: "nearest_5" })}
              />
              <Chip
                label="Nearest $10"
                selected={s.rounding === "nearest_10"}
                onPress={() => s.setSettings({ rounding: "nearest_10" })}
              />
            </View>
          </SettingInlineChips>

          <Divider />

          <ToggleRow
            iconName="layers-outline"
            iconBg="rgba(135, 255, 200, 0.16)"
            title="Include non-essential bills in gap"
            subtitle="If ON, subscriptions/optional bills count in the gap math."
            value={s.includeNonEssentialBillsInGap}
            onValueChange={(v) => s.setSettings({ includeNonEssentialBillsInGap: v })}
          />
        </SettingSection>

        {/* EXPERIENCE */}
        <SettingSection title="Experience">
          <ToggleRow
            iconName="phone-portrait-outline"
            iconBg="rgba(255, 120, 190, 0.15)"
            title="Haptics"
            subtitle="Small taps/feedback for buttons (if supported)."
            value={s.haptics}
            onValueChange={(v) => s.setSettings({ haptics: v })}
          />

          <Divider />

          <ToggleRow
            iconName="chatbubble-ellipses-outline"
            iconBg="rgba(160, 160, 255, 0.16)"
            title="Show coach notes"
            subtitle="Keep the soft guidance text visible in Plan."
            value={s.showCoachNotes}
            onValueChange={(v) => s.setSettings({ showCoachNotes: v })}
          />

          <Divider />

          <ToggleRow
            iconName="calendar-outline"
            iconBg="rgba(120, 255, 190, 0.14)"
            title="Weekly summary (beta)"
            subtitle="Placeholder toggle for later notifications/email."
            value={s.weeklySummary}
            onValueChange={(v) => s.setSettings({ weeklySummary: v })}
          />
        </SettingSection>

        {/* QUICK LINKS */}
        <SettingSection title="Quick links">
          <Link href="/(tabs)/gap" asChild>
            <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
              <SettingRow
                iconName="sparkles-outline"
                iconBg="rgba(255, 210, 120, 0.18)"
                title="Plan"
                subtitle="Go to Gap planning"
                right={<Ionicons name="chevron-forward" size={18} color={stylesVars.chev} />}
              />
            </Pressable>
          </Link>

          <Divider />

          <Link href="/(tabs)/trends" asChild>
            <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
              <SettingRow
                iconName="trending-up-outline"
                iconBg="rgba(120, 150, 255, 0.18)"
                title="Trends"
                subtitle="See patterns and progress"
                right={<Ionicons name="chevron-forward" size={18} color={stylesVars.chev} />}
              />
            </Pressable>
          </Link>
        </SettingSection>

        {/* RESET */}
        <SettingSection title="Reset">
          <SettingInlineText
            iconName="warning-outline"
            iconBg="rgba(255, 120, 120, 0.16)"
            title="Local beta storage"
            subtitle="Settings are stored locally for beta. Reset restores defaults."
          />

          <Divider />

          <Pressable onPress={confirmReset} style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}>
            <IconTile name="refresh-outline" bg="rgba(255, 120, 120, 0.16)" />
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>Reset settings</Text>
              <Text style={styles.rowSub}>Does not delete demo transactions/bills yet.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={stylesVars.chev} />
          </Pressable>
        </SettingSection>

        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}

/* ---------- UI building blocks ---------- */

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function IconTile({ name, bg }: { name: any; bg: string }) {
  return (
    <View style={[styles.iconTile, { backgroundColor: bg }]}>
      <Ionicons name={name} size={18} color={colors.text} />
    </View>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function SettingRow({
  iconName,
  iconBg,
  title,
  subtitle,
  right,
  disabled,
}: {
  iconName: any;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.75 }]}>
      <IconTile name={iconName} bg={iconBg} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function ToggleRow({
  iconName,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  iconName: any;
  iconBg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <IconTile name={iconName} bg={iconBg} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SettingInlineText({
  iconName,
  iconBg,
  title,
  subtitle,
}: {
  iconName: any;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.row}>
      <IconTile name={iconName} bg={iconBg} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function SettingInlineChips({
  iconName,
  iconBg,
  title,
  subtitle,
  children,
}: {
  iconName: any;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <IconTile name={iconName} bg={iconBg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSub}>{subtitle}</Text>
        </View>
      </View>
      <View style={{ height: 10 }} />
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: stylesVars.bg },
  content: { padding: 14, gap: 12 },

  header: { marginBottom: 2 },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 2 },

  sectionTitle: {
    color: "rgba(234,240,255,0.55)",
    fontWeight: "900",
    fontSize: 12.5,
    marginBottom: 8,
    marginLeft: 2,
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: stylesVars.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  divider: { height: 1, backgroundColor: stylesVars.divider, marginLeft: 14 },

  formBlock: { paddingHorizontal: 14, paddingVertical: 14, gap: 8 },
  formLabel: { color: "rgba(234,240,255,0.70)", fontSize: 12.5, fontWeight: "800" },
  formHelp: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  formHint: { color: "rgba(234,240,255,0.50)", fontSize: 11.5, lineHeight: 15 },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontWeight: "800",
  },

  inlineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  suffixBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  suffixText: { color: colors.text, fontWeight: "900" },

  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowTitle: { color: colors.text, fontWeight: "900", fontSize: 13.5 },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },

  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillText: { color: colors.text, fontWeight: "900", fontSize: 12 },

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

  dangerRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  dangerTitle: { color: colors.text, fontWeight: "900", fontSize: 13.5 },

  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
