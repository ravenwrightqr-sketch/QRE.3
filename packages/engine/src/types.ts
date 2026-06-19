export type ActionContext = {
  assetId: string;
  sessionId: string;
};

export type PaymentProvider = "stripe" | "cashapp" | "paypal" | "custom";

export type PaymentAction = {
  type: "payment";
  provider: PaymentProvider;
  destination?: string;
  amount?: number;
};

export type Action =
  | { type: "message"; text: string }
  | { type: "notify_owner"; payload?: any }
  | { type: "timer"; duration: number }
  | { type: "redirect"; url: string }
  | PaymentAction;

export type Flow = {
  actions: Action[];
};

