export type ServiceReceipt = {
  id: string;
  assetId: string;
  sessionId: string;

  /** The canonical product is a service-created experience, not a financial receipt. */
  kind?: "service_experience" | "transaction";
  type: "service" | "purchase";

  title: string;
  summary: string;
  prompt?: string;
  experienceId?: string;
  video?: {
    url?: string;
    mediaId?: string;
    durationMs?: number;
  };
  audience?: string;
  narrative?: string[];
  highlights?: string[];
  analytics?: {
    scans?: number;
    completions?: number;
    engagement?: number;
    replayRate?: number;
  };

  completedAt: string;

  location?: {
    lat?: number;
    lng?: number;
    label?: string;
  };

  /** Optional legacy transaction fields; not required for service experiences. */
  lineItems?: {
    label: string;
    price?: number;
  }[];
  total?: number;

  metadata?: Record<string, unknown>;
};
