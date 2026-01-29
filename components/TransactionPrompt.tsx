import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function TransactionPrompt({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.panel2 },
  text: { color: colors.text, fontSize: 13, lineHeight: 18 },
});
