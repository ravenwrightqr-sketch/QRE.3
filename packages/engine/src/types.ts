export type AccessState = "UNCLAIMED" | "LOCKED" | "UNLOCKED";

export type ScanEventType =
  | "scan"
  | "flow_start"
  | "flow_step"
  | "flow_end"
  | "cta"
  | "redirect"
  | "unlock"
  | "payment"
  | "payment_required";

export type ScanMode =
  | "public"
  | "authenticated"
  | "auth_required";

export type ScanResponse = {
  mode: ScanMode;
  access: AccessState;

  assetId: string;
  sessionId: string;
  flowId: string | null;

  stepIndex: number;

  teaser: any;

  preview: boolean;

  nextAction?: "CHECKOUT" | "RUN_FLOW";
  actionUrl?: string | null;

  timestamp: string;
};