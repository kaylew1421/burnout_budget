import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.page}>
      <View style={{ padding: 14, gap: 12 }}>
        <Text style={styles.h1}>Transaction</Text>
        <Card style={{ gap: 8 }}>
          <Text style={styles.muted}>Transaction id:</Text>
          <Text style={styles.value}>{id}</Text>
          <Text style={styles.muted}>Placeholder route for deep links / reflections.</Text>
        </Card>
        <Link href="/(tabs)/log" style={styles.link}>← Back to Log</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 12 },
  value: { color: colors.text, fontWeight: "900" },
  link: { color: colors.accent, fontWeight: "900" },
});
