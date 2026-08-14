import type { ExperienceMoment } from "@qre/contracts";

export type PaymentResult = { url: string };

export function createPaymentLink(action: ExperienceMoment): PaymentResult {
  if (action.type !== "action" || action.action !== "payment") throw new Error("Invalid moment type");
  const url = action.url ?? (typeof action.meta?.url === "string" ? action.meta.url : null);
  if (!url) throw new Error("Missing payment url");
  return { url };
}
