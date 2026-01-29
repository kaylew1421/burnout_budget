import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { SoftButton } from "../../components/SoftButton";
import { useRouter } from "expo-router";

export default function Onboarding() {
  const router = useRouter();
  return (
    <View style={styles.page}>
      <View style={{ padding: 14, gap: 12 }}>
        <Text style={styles.h1}>Onboarding</Text>
        <Card style={{ gap: 10 }}>
          <Text style={styles.muted}>
            Burnout Budget is built to be gentle.

We track patterns, not “good” or “bad” spending.
          </Text>
          <SoftButton title="Start" onPress={() => router.replace("/(tabs)/home")} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
