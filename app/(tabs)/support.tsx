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

type Role = "user" | "assistant";

type ChatMsg = {
  id: string;
  role: Role;
  content: string;
};

function uid(prefix = "m") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function SupportScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [input, setInput] = useState("");

  const initialMessage = useMemo<ChatMsg>(
    () => ({
      id: "a1",
      role: "assistant",
      content:
        "Hey. I’m here with you.\n\nIf money feels heavy today, we can keep this gentle. What’s going on?",
    }),
    []
  );

  const [messages, setMessages] = useState<ChatMsg[]>([initialMessage]);

  function onSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMsg = { id: uid("u"), role: "user", content: text };

    // Simple “supportive” placeholder response for now.
    const assistantMsg: ChatMsg = {
      id: uid("a"),
      role: "assistant",
      content:
        "I hear you. Let’s slow down for a second.\n\nWhat feels most urgent right now: rent/bills, debt, or just not knowing where the money went?",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");

    // scroll after state updates
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={(r) => (scrollRef.current = r)}
        contentContainerStyle={styles.scroll}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type what’s on your mind…"
          placeholderTextColor="#7a7a7a"
          style={styles.input}
          multiline
        />
        <Pressable onPress={onSend} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0d" },
  scroll: { padding: 16, paddingBottom: 24, gap: 10 },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "#1a1a20" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#2b2b36" },
  bubbleText: { color: "#f3f3f3", fontSize: 15, lineHeight: 20 },
  inputRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a32",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#141419",
    color: "#f3f3f3",
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2f6fed",
  },
  sendText: { color: "white", fontWeight: "700" },
});
