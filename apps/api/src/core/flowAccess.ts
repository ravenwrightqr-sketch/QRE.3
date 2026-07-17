import type { FlowAction, ActionContext, AccessState } from "@qre/contracts";
type FlowAccessInput = {
  userId?: string;
  asset: {
    ownerId: string | null;
    price?: number | null;
  };
  user?: {
    plan?: "free" | "pro" | "enterprise";
  } | null;
};

export function resolveFlowAccess(input: FlowAccessInput): AccessState {
  const { userId, asset, user } = input;

  /**
   * =========================
   * 1. NOT LOGGED IN
   * =========================
   */
  if (!userId) return "UNCLAIMED";

  /**
   * =========================
   * 2. OWNER ACCESS
   * =========================
   */
  if (asset.ownerId === userId) return "UNLOCKED";

  /**
   * =========================
   * 3. PAID / PREMIUM USERS
   * =========================
   * (kept for your business model flexibility)
   */
  if (user?.plan === "pro" || user?.plan === "enterprise") {
    return "UNLOCKED";
  }

  /**
   * =========================
   * 4. DEFAULT LOCKED STATE
   * =========================
   */
  return "LOCKED";
}