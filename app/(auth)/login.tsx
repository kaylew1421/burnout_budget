// app/(auth)/login.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { colors } from "../../theme/colors";
import { useSettings } from "../../hooks/useSettings";
import { auth as fbAuth } from "../../lib/firebase";

// Expo Go Google Auth
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const ui = {
  bg: "#0B0C10",
  card: "rgba(255,255,255,0.06)",
  card2: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)",
  divider: "rgba(255,255,255,0.08)",
  placeholder: "rgba(234,240,255,0.32)",
  muted: "rgba(234,240,255,0.60)",
  tiny: "rgba(234,240,255,0.45)",
  glow: "rgba(43, 91, 255, 0.22)",
  glow2: "rgba(120, 255, 190, 0.10)",
  danger: "rgba(255, 120, 120, 0.85)",
  chev: "rgba(234,240,255,0.55)",
};

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function friendlyAuthError(err: any) {
  const code = String(err?.code || "").toLowerCase();
  const msg = String(err?.message || "").toLowerCase();
  const s = `${code} ${msg}`;

  if (s.includes("auth/invalid-email")) return "That email doesn’t look right.";
  if (s.includes("auth/user-not-found")) return "No account found for that email.";
  if (s.includes("auth/wrong-password")) return "Wrong password.";
  if (s.includes("auth/email-already-in-use")) return "That email is already in use.";
  if (s.includes("auth/weak-password")) return "Password is too weak (try 6+ chars).";
  if (s.includes("auth/too-many-requests")) return "Too many attempts. Try again in a bit.";
  if (s.includes("auth/operation-not-allowed"))
    return "Email/password login isn’t enabled in Firebase yet.";
  if (s.includes("auth/network-request-failed"))
    return "Network issue. Try again (or restart Expo).";

  // OAuth-ish / Expo-ish
  if (s.includes("redirect_uri_mismatch"))
    return "Google OAuth redirect URI mismatch (we need to add the Expo redirect URL in Google Cloud).";
  if (s.includes("canceled") || s.includes("cancelled"))
    return "Sign-in was cancelled.";

  return "Something went wrong. Try again.";
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  // signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup extra
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI extras
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  /**
   * ✅ Expo Go: use WEB client ID for Expo Go (works with id_token)
   */
  const EXPO_GO_WEB_CLIENT_ID =
    "1011525133589-t2u3psfr7fed6othh4kvioqgug69psrg.apps.googleusercontent.com";

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: EXPO_GO_WEB_CLIENT_ID,
    responseType: "id_token",
    scopes: ["profile", "email"],
  });

  // Handle Google response -> Firebase credential sign-in
  useEffect(() => {
    (async () => {
      if (!response) return;
      if (response.type !== "success") return;

      try {
        setBusy(true);

        const idToken = (response.params as any)?.id_token;
        if (!idToken) {
          Alert.alert("Google sign-in failed", "Missing id_token.");
          return;
        }

        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(fbAuth, credential);

        const u = fbAuth.currentUser;
        const dn = u?.displayName?.trim();
        if (dn) settings.setSettings({ displayName: dn });

        // ✅ FIX: route exists
        router.replace("/(tabs)/dashboard");
      } catch (err: any) {
        console.log("GOOGLE AUTH ERROR:", err?.code, err?.message);
        Alert.alert("Google sign-in failed", `${err?.code ?? ""}\n${friendlyAuthError(err)}`);
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const canContinue = useMemo(() => {
    if (busy) return false;
    if (!isValidEmail(email)) return false;
    if (password.trim().length < 6) return false;

    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) return false;
      if (password !== confirmPassword) return false;
    }
    return true;
  }, [busy, mode, firstName, lastName, email, password, confirmPassword]);

  async function handleContinue() {
    if (!isValidEmail(email)) {
      Alert.alert("Check your email", "That email doesn’t look right.");
      return;
    }
    if (password.trim().length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }

    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Missing info", "Please enter your first and last name.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Passwords don’t match", "Make sure both passwords match.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(fbAuth, email.trim(), password);
        const dn = fbAuth.currentUser?.displayName?.trim();
        if (dn) settings.setSettings({ displayName: dn });
      } else {
        const cred = await createUserWithEmailAndPassword(fbAuth, email.trim(), password);

        const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

        try {
          await updateProfile(cred.user, { displayName });
        } catch (e) {
          console.log("updateProfile failed (non-fatal):", e);
        }

        settings.setSettings({ displayName });
      }

      // ✅ FIX: route exists
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      console.log("AUTH ERROR:", err?.code, err?.message);
      Alert.alert(
        mode === "signin" ? "Login failed" : "Sign up failed",
        `${err?.code ?? ""}\n${friendlyAuthError(err)}`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!isValidEmail(email)) {
      Alert.alert("Enter your email", "Type your email first, then tap reset.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(fbAuth, email.trim());
      Alert.alert("Reset sent", "Check your email for a reset link.");
    } catch (err: any) {
      Alert.alert("Couldn’t send reset", `${err?.code ?? ""}\n${friendlyAuthError(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    if (busy) return;

    if (
      !EXPO_GO_WEB_CLIENT_ID.includes(".apps.googleusercontent.com") ||
      EXPO_GO_WEB_CLIENT_ID.startsWith("PASTE_")
    ) {
      Alert.alert(
        "Missing Google Client ID",
        "Paste your Web client ID into EXPO_GO_WEB_CLIENT_ID in login.tsx."
      );
      return;
    }

    try {
      await promptAsync();
    } catch (err: any) {
      console.log("promptAsync error:", err?.message);
      Alert.alert("Google sign-in failed", "Try again.");
      setBusy(false);
    }
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : undefined}
        keyboardVerticalOffset={insets.top + 12}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              hitSlop={10}
              disabled={busy}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="sparkles" size={18} color={colors.text} />
            </View>
            <Text style={styles.brandName}>Burnout Budget</Text>
            <Text style={styles.brandTag}>Calm money planning • quick wins • fewer surprises</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setMode("signin")}
                disabled={busy}
                style={({ pressed }) => [
                  styles.modeBtn,
                  mode === "signin" && styles.modeBtnOn,
                  pressed && !busy && styles.pressed,
                ]}
              >
                <Text style={[styles.modeText, mode === "signin" && styles.modeTextOn]}>Sign in</Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("signup")}
                disabled={busy}
                style={({ pressed }) => [
                  styles.modeBtn,
                  mode === "signup" && styles.modeBtnOn,
                  pressed && !busy && styles.pressed,
                ]}
              >
                <Text style={[styles.modeText, mode === "signup" && styles.modeTextOn]}>
                  Create account
                </Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.copyBlock}>
              <Text style={styles.h1}>{mode === "signin" ? "Welcome back" : "Let’s get you set up"}</Text>
              <Text style={styles.sub}>
                {mode === "signin"
                  ? "Sign in to pick up where you left off."
                  : "Create an account to personalize your dashboard."}
              </Text>
            </View>

            <View style={styles.googleWrap}>
              <Pressable
                onPress={handleGoogle}
                disabled={!request || busy}
                style={({ pressed }) => [
                  styles.googleBtn,
                  (!request || busy) && styles.googleBtnDisabled,
                  pressed && !busy && styles.pressed,
                ]}
              >
                <Ionicons name="logo-google" size={18} color={colors.text} />
                <Text style={styles.googleText}>
                  {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
                </Text>
              </Pressable>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.orLine} />
              </View>
            </View>

            {mode === "signup" ? (
              <>
                <Field label="First name">
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor={ui.placeholder}
                    style={styles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!busy}
                    returnKeyType="next"
                  />
                </Field>

                <Field label="Last name">
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor={ui.placeholder}
                    style={styles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!busy}
                    returnKeyType="next"
                  />
                </Field>
              </>
            ) : null}

            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={ui.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                style={styles.input}
                returnKeyType="next"
              />
            </Field>

            <Field label="Password" hint="Minimum 6 characters.">
              <View style={styles.pwRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••"
                  placeholderTextColor={ui.placeholder}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  style={[styles.input, { flex: 1 }]}
                  returnKeyType={mode === "signup" ? "next" : "done"}
                  onSubmitEditing={mode === "signin" ? handleContinue : undefined}
                />
                <Pressable
                  onPress={() => setShowPw((v) => !v)}
                  style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
                  disabled={busy}
                >
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={ui.chev}
                  />
                </Pressable>
              </View>
            </Field>

            {mode === "signup" ? (
              <Field
                label="Confirm password"
                error={
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? "Passwords don’t match."
                    : undefined
                }
              >
                <View style={styles.pwRow}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••"
                    placeholderTextColor={ui.placeholder}
                    secureTextEntry={!showConfirmPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    style={[styles.input, { flex: 1 }]}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPw((v) => !v)}
                    style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
                    disabled={busy}
                  >
                    <Ionicons
                      name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={ui.chev}
                    />
                  </Pressable>
                </View>
              </Field>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={handleContinue}
                disabled={!canContinue}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (!canContinue || busy) && styles.primaryBtnDisabled,
                  pressed && canContinue && !busy && styles.pressed,
                ]}
              >
                {busy ? (
                  <ActivityIndicator />
                ) : (
                  <View style={styles.primaryInner}>
                    <Text style={styles.primaryText}>{mode === "signin" ? "Continue" : "Create account"}</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.text} />
                  </View>
                )}
              </Pressable>

              <View style={styles.secondaryRow}>
                <Pressable
                  onPress={handleForgotPassword}
                  disabled={busy}
                  style={({ pressed }) => [styles.ghostBtn, pressed && !busy && styles.pressed]}
                >
                  <Text style={styles.ghostText}>Forgot password</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.replace("/(tabs)/dashboard")}
                  disabled={busy}
                  style={({ pressed }) => [styles.linkBtn, pressed && !busy && styles.pressed]}
                >
                  <Text style={styles.linkText}>Continue as guest</Text>
                </Pressable>
              </View>

              <Text style={styles.legal}>
                By continuing you agree to the <Text style={styles.legalLink}>Terms</Text> and{" "}
                <Text style={styles.legalLink}>Privacy</Text>.
              </Text>
            </View>
          </View>

          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldTop}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: ui.bg, paddingHorizontal: 16 },

  glowA: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: ui.glow,
    opacity: 0.45,
  },
  glowB: {
    position: "absolute",
    bottom: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: ui.glow2,
    opacity: 0.55,
  },

  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ui.card2,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: "center",
    justifyContent: "center",
  },

  brand: { alignItems: "center", marginTop: 6, marginBottom: 14 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: ui.card2,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brandName: { color: colors.text, fontWeight: "900", fontSize: 20 },
  brandTag: { color: ui.tiny, marginTop: 4, fontWeight: "700" },

  card: {
    backgroundColor: ui.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.border,
    overflow: "hidden",
  },

  modeRow: { flexDirection: "row", gap: 10, padding: 14 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.card2,
    alignItems: "center",
  },
  modeBtnOn: {
    borderColor: "rgba(43, 91, 255, 0.55)",
    backgroundColor: "rgba(43, 91, 255, 0.18)",
  },
  modeText: { color: "rgba(234,240,255,0.70)", fontWeight: "900" },
  modeTextOn: { color: colors.text },

  divider: { height: 1, backgroundColor: ui.divider, marginLeft: 14 },

  copyBlock: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 10 },
  h1: { color: colors.text, fontWeight: "900", fontSize: 22 },
  sub: { color: ui.muted, marginTop: 6, lineHeight: 18, fontWeight: "700" },

  googleWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 12,
    borderRadius: 16,
  },
  googleBtnDisabled: { opacity: 0.5 },
  googleText: { color: colors.text, fontWeight: "900" },

  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: ui.divider },
  orText: { color: ui.tiny, fontWeight: "900" },

  field: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  fieldTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  label: { color: "rgba(234,240,255,0.72)", fontSize: 12.5, fontWeight: "900" },
  hint: { color: ui.tiny, fontSize: 11.5, fontWeight: "800" },
  error: { color: ui.danger, fontSize: 11.5, fontWeight: "900" },

  input: {
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontWeight: "800",
  },

  pwRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.card2,
    alignItems: "center",
    justifyContent: "center",
  },

  actions: { padding: 14, gap: 10 },

  primaryBtn: {
    backgroundColor: "rgba(43, 91, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(43, 91, 255, 0.55)",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  primaryText: { color: colors.text, fontWeight: "900", fontSize: 14 },

  secondaryRow: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flex: 1,
    backgroundColor: ui.card2,
    borderWidth: 1,
    borderColor: ui.border,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  ghostText: { color: colors.text, fontWeight: "900" },

  linkBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(120, 255, 190, 0.10)",
  },
  linkText: { color: colors.text, fontWeight: "900" },

  legal: {
    color: ui.tiny,
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },
  legalLink: { color: "rgba(234,240,255,0.72)", fontWeight: "900" },

  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
