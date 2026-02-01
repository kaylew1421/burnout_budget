import type { AIChatRequest, AIChatResponse } from "./ai.types";
import { fmtUSD } from "../../lib/currency";

function lastUser(history?: { role: string; content: string }[]) {
  if (!history?.length) return "";
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") return history[i].content;
  }
  return "";
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function hasAny(msg: string, words: string[]) {
  return words.some((w) => msg.includes(w));
}

// Tiny helper: extract a rough dollar amount like "$42" or "42.18"
function extractAmount(raw: string): number | undefined {
  const m = raw.replace(/,/g, "").match(/(?:\$)?(\d{1,6}(?:\.\d{1,2})?)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

export async function sendAIChatLocal(req: AIChatRequest): Promise<AIChatResponse> {
  const msg = normalize(req.userMessage);
  const prev = normalize(lastUser(req.history));

  const gap = req.snapshot?.gap?.gap ?? 0;
  const gapLine =
    gap > 0
      ? `Right now it looks like there’s a gap of about **${fmtUSD(gap)}** in your current window.`
      : `From what I can see, you may be okay in the current window — we can still reduce pressure though.`;

  // Intent buckets (simple but effective)
  const billsIntent = hasAny(msg, ["rent", "bill", "bills", "overdue", "late", "eviction", "utilities", "phone"]);
  const debtIntent = hasAny(msg, ["debt", "credit", "card", "interest", "collections", "collector"]);
  const spendingIntent = hasAny(msg, ["spent", "spend", "shopping", "amazon", "target", "starbucks", "impulse"]);
  const overwhelmedIntent = hasAny(msg, ["overwhelmed", "panic", "stressed", "anxious", "spiral", "heavy"]);

  // Follow-up handling (uses history)
  // If the assistant previously asked "essentials, extensions, or bridge ideas?"
  if (hasAny(prev, ["essentials, extensions, or bridge ideas"]) && (msg.includes("essentials") || msg.includes("extension") || msg.includes("bridge"))) {
    if (msg.includes("essentials")) {
      return {
        assistantMessage:
          `Okay. Essentials first — calm and concrete.\n\n1) What’s due next (rent, electric, phone, etc.)?\n2) What do you have available right now?\n\nIf you want, open **Gap** and we’ll line it up together.`,
        quickReplies: ["Rent", "Electric", "Phone", "I’m not sure"],
        actions: [{ type: "open", label: "Open Gap", href: "/(tabs)/gap" }],
      };
    }
    if (msg.includes("extension")) {
      return {
        assistantMessage:
          `Extensions are a smart move — not shameful.\n\nPick one bill and we’ll draft a simple ask:\n• name of bill\n• due date\n• what you can pay now (even partial)\n\nWhich bill do you want to call first?`,
        quickReplies: ["Rent", "Electric", "Phone", "Credit card"],
      };
    }
    // bridge
    return {
      assistantMessage:
        `Bridge ideas = “get through the week” options.\n\nA few gentle ones:\n• pause a non-essential for 30 days\n• split a payment\n• ask for a due-date move\n• plan a tiny grocery limit for 7 days\n\nWhat’s your goal: reduce stress today, avoid late fees, or cover rent?`,
      quickReplies: ["Reduce stress", "Avoid late fees", "Cover rent"],
      actions: [{ type: "open", label: "See Gap Snapshot", href: "/(tabs)/gap" }],
    };
  }

  // Bills / Overwhelm
  if (billsIntent || overwhelmedIntent) {
    return {
      assistantMessage:
        `I hear you. Money stress hits your body, not just your spreadsheet.\n\n${gapLine}\n\nIf you want, we can do this in two calm steps:\n1) List essentials due next + what’s available\n2) Pick one small move: pause a non-essential, ask for an extension, or plan a short “bridge”\n\nWhat feels easiest to start with — essentials, extensions, or bridge ideas?`,
      quickReplies: ["Essentials", "Extensions", "Bridge ideas", "I just need to vent"],
      actions: [
        { type: "open", label: "Open Gap", href: "/(tabs)/gap" },
        { type: "open", label: "Log an expense", href: "/(tabs)/expenses?mode=flow" },
      ],
    };
  }

  // Debt
  if (debtIntent) {
    return {
      assistantMessage:
        `Debt stress is real — and you don’t have to solve it all today.\n\nDo you want help with:\n• lowering the payment pressure\n• avoiding late fees\n• understanding the numbers\n\nPick one and we’ll keep it gentle.`,
      quickReplies: ["Lower payment pressure", "Avoid late fees", "Understand the numbers"],
      actions: [{ type: "open", label: "Open Gap", href: "/(tabs)/gap" }],
    };
  }

  // Spending / impulse
  if (spendingIntent) {
    const maybeAmt = extractAmount(req.userMessage);
    return {
      assistantMessage:
        `Okay — thank you for telling me.\n\nNo judgment. Just info + care.\n\nWhen you think about that purchase, what’s the feeling closest to: **relief**, **regret**, **stress**, or **“it was fine”**?\nAnd was it **necessary** or more of a **comfort/treat**?`,
      quickReplies: ["Relief", "Regret", "Stress", "It was fine"],
      actions: [
        { type: "open", label: "Log it in Expenses", href: "/(tabs)/expenses?mode=flow" },
        ...(maybeAmt ? [{ type: "prefillExpense", label: "Prefill amount", amount: maybeAmt } as const] : []),
      ],
    };
  }

  // Default
  return {
    assistantMessage:
      `I’m here with you.\n\nWe can keep this gentle. What’s feeling heavy right now — **spending**, **bills coming up**, or just the **stress of it all**?`,
    quickReplies: ["Spending", "Bills", "Stress"],
    actions: [
      { type: "open", label: "Open Expenses", href: "/(tabs)/expenses?mode=flow" },
      { type: "open", label: "Open Gap", href: "/(tabs)/gap" },
      { type: "open", label: "View Trends", href: "/(tabs)/trends" },
    ],
  };
}
