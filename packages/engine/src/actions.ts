export type ActionContext = {
  assetId: string;
  sessionId: string;
};

/**
 * =========================
 * PAYMENT TYPES (isolated cleanly)
 * =========================
 */
export type PaymentProvider = "stripe" | "cashapp" | "paypal" | "custom";

export type PaymentAction = {
  type: "payment";
  provider: PaymentProvider;
  destination?: string;
  amount?: number;
};

/**
 * =========================
 * CORE ACTION SYSTEM (RUNTIME ISA)
 * =========================
 */
export type Action =
  | { type: "message"; text: string }
  | { type: "notify_owner"; payload?: any }
  | { type: "timer"; duration: number }
  | { type: "loop_message"; messages: string[]; interval: number }
  | { type: "redirect"; url: string }
  | PaymentAction;

/**
 * =========================
 * EXECUTION RESULT TYPES
 * =========================
 */
export type ActionResult =
  | { event: "message"; text: string }
  | { event: "notify_owner"; assetId: string; payload: unknown }
  | { event: "timer_complete" }
  | { event: "loop_start"; messages: string[]; interval: number }
  | { event: "redirect"; url: string }
  | {
      event: "payment_required";
      provider: PaymentProvider;
      amount: number;
      destination: string | null;
      assetId: string;
    };

/**
 * =========================
 * ACTION EXECUTOR
 * =========================
 */
export async function runAction(
  action: Action,
  ctx: ActionContext
): Promise<ActionResult> {
  switch (action.type) {
    case "message":
      return {
        event: "message",
        text: action.text,
      };

    case "notify_owner":
      return {
        event: "notify_owner",
        assetId: ctx.assetId,
        payload: action.payload ?? null,
      };

    case "timer":
      await new Promise((r) => setTimeout(r, action.duration));
      return {
        event: "timer_complete",
      };

    case "loop_message":
      return {
        event: "loop_start",
        messages: action.messages,
        interval: action.interval,
      };

    case "redirect":
      return {
        event: "redirect",
        url: action.url,
      };

    case "payment":
      return {
        event: "payment_required",
        provider: action.provider,
        amount: action.amount ?? 0,
        destination: action.destination ?? null,
        assetId: ctx.assetId,
      };

    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(_exhaustive)}`);
    }
  }
}