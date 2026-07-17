export type PaymentProvider =
  | "stripe"
  | "cashapp"
  | "paypal"
  | "custom";

export type ActionContext = {
assetId: string;
sessionId: string;
};


export type FlowAction =
  | {
      type: "message";
      text: string;
    }
  | {
      type: "delay";
      ms: number;
    }
  | {
      type: "redirect";
      url: string;
    }
  | {
      type: "unlock";
    }
  | {
      type: "cta";
      text: string;
      url: string; // 🔥 FIX: ALWAYS REQUIRED (no undefined hell)
    }
  | {
      type: "payment";
      provider: PaymentProvider;
      amount: number;
    };



export type AccessState = "UNCLAIMED" | "LOCKED" | "UNLOCKED";