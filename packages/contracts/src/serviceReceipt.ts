export type ServiceReceipt = {
  id: string;
  assetId: string;
  sessionId: string;

  type: "service" | "purchase";

  title: string;

  summary: string;

  completedAt: string;

  location?: {
    lat?: number;
    lng?: number;
    label?: string;
  };

  lineItems?: {
    label: string;
    price?: number;
  }[];

  total?: number;

  metadata?: Record<string, unknown>;
};