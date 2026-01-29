import type { AIChatRequest, AIChatResponse } from "./ai.types";
import { fmtUSD } from "../../lib/currency";

export async function sendAIChatLocal(req: AIChatRequest): Promise<AIChatResponse> {
  const msg = req.userMessage.trim().toLowerCase();
  const gap = req.snapshot?.gap?.gap ?? 0;

  if (msg.includes("rent") || msg.includes("bills") || msg.includes("overwhelmed")) {
    const gapLine = gap > 0 ? `Right now it looks like there’s a gap of about ${fmtUSD(gap)} in your current window.` : `From what I can see, you may be okay on the current window — we can still reduce pressure, though.`;
    return {
      assistantMessage:
        `I hear you. Money stress hits your body, not just your spreadsheet.

${gapLine}

If you want, we can do this in two calm steps:
1) List essentials due next + what’s available
2) Pick one small move: pause a non-essential, ask for an extension, or plan a short “bridge”

What feels easiest to start with — essentials, extensions, or bridge ideas?`
    };
  }

  if (msg.includes("spent") || msg.includes("i just")) {
    return {
      assistantMessage:
        `Okay — thank you for telling me.

No judgment. Just info + care.

When you think about that purchase, what’s the feeling closest to: relief, regret, stress, or “it was fine”? And was it necessary or more of a comfort/treat?`
    };
  }

  return {
    assistantMessage:
      `I’m here with you.

We can keep this gentle. Tell me what’s feeling heavy right now — spending, bills coming up, or just the stress of it all?`
  };
}
