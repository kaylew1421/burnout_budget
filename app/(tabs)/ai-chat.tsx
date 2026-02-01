// app/(tabs)/ai-chat.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors } from "../../theme/colors";

type Role = "user" | "assistant";

type ChatMsg = {
  id: string;
  role: Role;
  content: string;
  createdAt: string; // ISO
};

function uid(prefix = "m") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** -----------------------------
 *  Bills flow (frontend-only)
 *  ----------------------------- */
type BillType = "rent" | "utilities" | "phone" | "other";
type BillDraft = {
  billType?: BillType;
  billAmount?: number; // due
  availableAmount?: number; // have now
};
type ChatStage = "idle" | "bills_collecting" | "bills_confirmed";

function formatMoney(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  // keep it simple but not overly rounded
  const fixed = Math.round(safe * 100) / 100;
  return `$${fixed.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function computeGap(d: BillDraft) {
  if (typeof d.billAmount !== "number" || typeof d.availableAmount !== "number") return null;
  return Math.max(0, d.billAmount - d.availableAmount);
}

function isBillComplete(d: BillDraft) {
  return !!d.billType && typeof d.billAmount === "number" && typeof d.availableAmount === "number";
}

function detectBillType(text: string): BillType | undefined {
  const t = text.toLowerCase();
  if (/\brent\b/.test(t)) return "rent";
  if (/\b(util|utilities|electric|water|gas)\b/.test(t)) return "utilities";
  if (/\b(phone|cell|verizon|att|t-mobile|tmobile)\b/.test(t)) return "phone";
  if (/\bother\b/.test(t)) return "other";
  return undefined;
}

function extractNumbers(text: string): number[] {
  const matches = text.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!matches) return [];
  return matches.map((m) => Number(m)).filter((n) => Number.isFinite(n));
}

async function extractBillFields(text: string): Promise<Partial<BillDraft>> {
  const billType = detectBillType(text);
  const nums = extractNumbers(text);

  let billAmount: number | undefined;
  let availableAmount: number | undefined;

  if (nums.length >= 2) {
    billAmount = nums[0];
    availableAmount = nums[1];
  } else if (nums.length === 1) {
    const t = text.toLowerCase();
    const n = nums[0];
    if (/(available|have|left|got|in my account|on hand)/.test(t)) availableAmount = n;
    else billAmount = n;
  }

  return { billType, billAmount, availableAmount };
}

/** -----------------------------
 *  General reply builder
 *  ----------------------------- */
function buildSupportReply(userText: string) {
  const t = userText.toLowerCase();

  if (/(rent|bill|bills|electric|phone|overdue|late)/.test(t)) {
    return {
      title: "Bills feel loud. Got it.",
      body:
        "Let’s make it small:\n\n1) What bill is due first?\n2) How much is it?\n3) What do you have available right now?\n\nYou can answer like: “Rent. 750. 500 available.”",
      quick: ["Rent", "Utilities", "Phone", "Other"],
      actions: [],
    };
  }

  if (/(debt|credit|card|interest|collection|collections)/.test(t)) {
    return {
      title: "Debt stress is real.",
      body:
        "We don’t have to solve it all today.\n\nWhat do you want most right now?\n• lower the payment stress\n• stop late fees\n• understand the numbers\n\nPick one and we’ll keep it gentle.",
      quick: ["Lower stress", "Stop late fees", "Understand numbers"],
      actions: ["See trends", "Cover the gap"],
    };
  }

  if (/(impulse|spent|shopping|amazon|target|starbucks|stress)/.test(t)) {
    return {
      title: "Okay — spending + stress combo.",
      body:
        "Quick check-in:\n\nWas it more:\n• soothing\n• urgency\n• “I deserve this”\n• convenience\n\nNo judgment. Just patterns.",
      quick: ["Soothing", "Urgency", "Deserve it", "Convenience"],
      actions: ["Log an expense", "See trends"],
    };
  }

  return {
    title: "I’m here.",
    body:
      "What feels most urgent right now?\n• rent/bills\n• debt\n• or just not knowing where the money went?",
    quick: ["Bills", "Debt", "No clue"],
    actions: ["Log an expense", "See trends"],
  };
}

/**
 * ✅ IMPORTANT FIX:
 * Your current Tabs are: dashboard, transactions, trends, recurrings, ai-chat
 * So these actions must route to EXISTING screens.
 */
function actionToRoute(action: string) {
  switch (action) {
    case "Cover the gap":
      return "/(tabs)/recurrings"; // gap lives inside Recurrings now
    case "Log an expense":
      return "/(tabs)/transactions"; // you log spends here
    case "See trends":
      return "/(tabs)/trends";
    default:
      return null;
  }
}

export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [stage, setStage] = useState<ChatStage>("idle");
  const [billDraft, setBillDraft] = useState<BillDraft>({});

  const initialMessage = useMemo<ChatMsg>(
    () => ({
      id: "a1",
      role: "assistant",
      createdAt: new Date().toISOString(),
      content:
        "Hey. I’m here with you.\n\nIf money feels heavy today, we can keep this gentle. What’s going on?",
    }),
    []
  );

  const [messages, setMessages] = useState<ChatMsg[]>([initialMessage]);
  const [lastQuick, setLastQuick] = useState<string[]>(buildSupportReply("").quick);
  const [lastActions, setLastActions] = useState<string[]>(buildSupportReply("").actions ?? []);

  function scrollToBottom(animated = true) {
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated }), 60);
  }

  function pushMessage(msg: ChatMsg) {
    setMessages((prev) => [...prev, msg]);
  }

  function pushAssistant(content: string) {
    pushMessage({
      id: uid("a"),
      role: "assistant",
      createdAt: new Date().toISOString(),
      content,
    });
  }

  function resetBillsFlow() {
    setBillDraft({});
    setStage("idle");
    const reply = buildSupportReply("");
    setLastQuick(reply.quick);
    setLastActions(reply.actions ?? []);
    pushAssistant("Okay — fresh start. What’s going on?");
    scrollToBottom();
  }

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text) return;

    const now = new Date().toISOString();
    pushMessage({ id: uid("u"), role: "user", createdAt: now, content: text });
    setInput("");
    scrollToBottom();

    // Bills starter trigger (only once)
    if (stage === "idle" && /\b(bills?|rent|electric|utilities|phone)\b/i.test(text)) {
      setIsTyping(true);

      const starter = buildSupportReply("bills");
      setLastQuick(starter.quick);
      setLastActions([]);

      setTimeout(() => {
        setIsTyping(false);
        pushAssistant(`${starter.title}\n\n${starter.body}`);
        setStage("bills_collecting");
        scrollToBottom();
      }, 450);

      return;
    }

    // Bills collecting stage
    if (stage === "bills_collecting") {
      setIsTyping(true);
      const parsed = await extractBillFields(text);

      setBillDraft((prev) => {
        const next: BillDraft = { ...prev, ...parsed };

        const missing: string[] = [];
        if (!next.billType) missing.push("which bill (Rent, Utilities, Phone, Other)");
        if (typeof next.billAmount !== "number") missing.push("how much is due");
        if (typeof next.availableAmount !== "number") missing.push("how much you have available");

        const quick = !next.billType ? ["Rent", "Utilities", "Phone", "Other"] : ["Start over"];
        const actions: string[] = isBillComplete(next) ? ["Cover the gap", "Log an expense"] : [];

        setLastQuick(quick);
        setLastActions(actions);

        setTimeout(() => {
          setIsTyping(false);

          if (isBillComplete(next)) {
            const gap = computeGap(next)!;
            const label = next.billType!.charAt(0).toUpperCase() + next.billType!.slice(1);

            pushAssistant(
              `Got it.\n\n${label} is ${formatMoney(next.billAmount!)}, and you have ${formatMoney(
                next.availableAmount!
              )} available.\nThat leaves a ${formatMoney(gap)} gap.\n\nWhat do you want to do next?`
            );
            setStage("bills_confirmed");
          } else {
            pushAssistant(`Okay — I just need ${missing.join(", ")}.`);
          }

          scrollToBottom();
        }, 450);

        return next;
      });

      return;
    }

    // Bills confirmed stage
    if (stage === "bills_confirmed") {
      const t = text.toLowerCase();

      if (/start over|reset|new bill/.test(t)) {
        resetBillsFlow();
        return;
      }

      if (/(how|what|options|help|don't know|dont know|can i)/.test(t)) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);

          const gap = computeGap(billDraft) ?? 0;

          pushAssistant(
            "You have a few gentle options here:\n\n" +
              `• Pay what you can now and ask about the remaining ${formatMoney(gap)}\n` +
              `• Ask for a short extension on ${formatMoney(gap)}\n` +
              "• See if another bill can be delayed instead\n" +
              "• Tap Cover the gap to see your full schedule\n\n" +
              "Want me to help you pick the least-stress option?"
          );

          scrollToBottom();
        }, 450);

        return;
      }

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        pushAssistant("Want to cover the gap, log an expense, or start over?");
        setLastQuick(["Start over"]);
        setLastActions(["Cover the gap", "Log an expense"]);
        scrollToBottom();
      }, 450);

      return;
    }

    // Non-bills flow
    setIsTyping(true);
    const reply = buildSupportReply(text);
    setLastQuick(reply.quick);
    setLastActions(reply.actions ?? []);

    setTimeout(() => {
      setIsTyping(false);
      pushAssistant(`${reply.title}\n\n${reply.body}`);
      scrollToBottom();
    }, 550);
  }

  function onSend() {
    sendText(input);
  }

  const canSend = input.trim().length > 0;

  const showBillActions = stage === "bills_confirmed";
  const showActionChips = !!lastActions.length && (showBillActions || stage === "idle");

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 10) },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.h1}>AI Chat</Text>
        <Text style={styles.sub}>A calm place to talk it out — no judgment.</Text>
      </View>

      <View style={styles.panel}>
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom(false)}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <View key={m.id} style={[styles.msgWrap, isUser ? styles.msgRight : styles.msgLeft]}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={styles.bubbleText}>{m.content}</Text>
                </View>
                <Text style={[styles.time, isUser ? styles.timeRight : styles.timeLeft]}>
                  {timeLabel(m.createdAt)}
                </Text>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.msgWrap, styles.msgLeft]}>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={[styles.bubbleText, { opacity: 0.75 }]}>Typing…</Text>
              </View>
            </View>
          )}

          {showActionChips && (
            <View style={styles.actionWrap}>
              {lastActions.map((a) => {
                const route = actionToRoute(a);
                return (
                  <Pressable
                    key={a}
                    onPress={() => {
                      if (route) router.push(route as any);
                    }}
                    style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}
                  >
                    <Text style={styles.actionText}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.quickWrap}>
            {lastQuick.map((q) => (
              <Pressable
                key={q}
                onPress={() => {
                  if (q === "Start over") {
                    resetBillsFlow();
                    return;
                  }
                  sendText(q);
                }}
                style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}
              >
                <Text style={styles.quickText}>{q}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 10 }} />
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type what’s on your mind…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            returnKeyType={Platform.OS === "ios" ? "default" : "send"}
            onSubmitEditing={() => {
              if (Platform.OS !== "ios") onSend();
            }}
          />

          <Pressable
            onPress={onSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && { opacity: 0.5 },
              pressed && canSend ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 14 },

  header: { marginBottom: 10 },
  h1: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 2 },

  panel: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border2,
    overflow: "hidden",
  },

  scroll: { padding: 14, paddingBottom: 10, gap: 10 },

  msgWrap: { maxWidth: "92%" },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end", alignItems: "flex-end" },

  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  assistantBubble: {
    backgroundColor: colors.panel2,
    borderColor: colors.border2,
  },
  userBubble: {
    backgroundColor: colors.accent, // ✅ use theme accent instead of hardcoded
    borderColor: "rgba(255,255,255,0.10)",
  },
  bubbleText: { color: colors.text, fontSize: 14.5, lineHeight: 20 },

  time: { fontSize: 11.5, marginTop: 4, fontWeight: "700", opacity: 0.7 },
  timeLeft: { color: colors.muted },
  timeRight: { color: colors.muted },

  actionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
    paddingTop: 2,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(43, 91, 255, 0.25)",
    backgroundColor: "rgba(43, 91, 255, 0.10)",
  },
  actionText: { color: "rgba(234,240,255,0.92)", fontWeight: "900", fontSize: 12.5 },

  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    paddingTop: 4,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  quickText: { color: colors.text, fontWeight: "800", fontSize: 12.5 },

  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border2,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#0F0F16",
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border2,
    fontSize: 14,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  sendText: { color: colors.text, fontWeight: "900" },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
