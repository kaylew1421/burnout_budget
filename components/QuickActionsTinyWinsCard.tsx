// components/QuickActionsTinyWinsCard.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { colors } from "../theme/colors";
import { Card } from "./Card";

type Action = {
  title: string;
  body: string;
  cta: string;
  href: string;
};

export default function QuickActionsTinyWins() {
  const actions: Action[] = [
    {
      title: "Log a transaction",
      body: "Track today so the plan stays real.",
      cta: "Open",
      href: "/(tabs)/transactions",
    },
    {
      title: "Talk it out",
      body: "Make a tiny plan with the coach.",
      cta: "Chat",
      href: "/(tabs)/ai-chat",
    },
    {
      title: "See trends",
      body: "Find patterns + triggers.",
      cta: "View",
      href: "/(tabs)/trends",
    },
  ];

  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Text style={styles.sectionHint}>low effort • high impact</Text>
      </View>

      {actions.map((a, idx) => (
        <View key={`${a.title}_${idx}`}>
          <TinyRow title={a.title} body={a.body} cta={a.cta} href={a.href} />
          {idx < actions.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </Card>
  );
}

function TinyRow({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <View style={styles.tinyWinRow}>
      <View style={styles.dot} />

      <View style={{ flex: 1 }}>
        <Text style={styles.tinyWinTitle}>{title}</Text>
        <Text style={styles.tinyWinBody}>{body}</Text>
      </View>

      <Link href={href as any} asChild>
        <Pressable style={({ pressed }) => [styles.miniBtn, pressed && styles.btnPressed]}>
          <Text style={styles.miniBtnText}>{cta}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  sectionHint: {
    color: "rgba(234,240,255,0.55)",
    fontSize: 12.5,
  },

  tinyWinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(43, 91, 255, 0.9)",
  },
  tinyWinTitle: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "900",
  },
  tinyWinBody: {
    color: "rgba(234,240,255,0.70)",
    fontSize: 12.5,
    marginTop: 2,
  },
  miniBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  miniBtnText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 12.5,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 10,
  },

  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
