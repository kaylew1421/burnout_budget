import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { SoftButton } from "../../components/SoftButton";
import { authStore } from "../../store/auth.store";
import { useRouter } from "expo-router";

export default function Login() {
  const [name, setName] = useState("");
  const router = useRouter();
  return (
    <View style={styles.page}>
      <View style={{ padding: 14, gap: 12 }}>
        <Text style={styles.h1}>Login</Text>
        <Card style={{ gap: 10 }}>
          <Text style={styles.muted}>Demo screen. Enter any name.</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} style={styles.input} />
          <SoftButton title="Continue" onPress={() => { authStore.login(name); router.replace("/(tabs)/home"); }} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  input: { minHeight: 44, backgroundColor: "#0F0F16", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, borderWidth: 1, borderColor: colors.border2, fontSize: 14 },
});
