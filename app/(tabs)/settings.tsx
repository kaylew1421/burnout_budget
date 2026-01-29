import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { SoftButton } from "../../components/SoftButton";
import { subscriptionStore } from "../../store/subscription.store";
import { useSubscription } from "../../hooks/useSubscription";

export default function Settings() {
  const { isPro } = useSubscription();

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.sub}>Simple controls (demo).</Text>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Premium (demo)</Text>
          <Text style={styles.muted}>Pro is currently: <Text style={{ fontWeight: "900", color: colors.text }}>{isPro ? "ON" : "OFF"}</Text></Text>
          <SoftButton title={isPro ? "Turn Pro off" : "Turn Pro on"} onPress={() => subscriptionStore.setState(() => ({ isPro: !isPro }))} />
          <Text style={styles.muted}>RevenueCat integration is stubbed in /integrations for now.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 12 },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: -6 },
  section: { color: colors.text, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
