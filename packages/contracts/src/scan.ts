import type { FlowAction } from "./flow";

export type AccessState =
  | "UNCLAIMED"
  | "LOCKED"
  | "UNLOCKED";

export type ScanRuntimeResponse = {
  access: AccessState;

  sessionId: string;

  asset: {
    id: string;
    slug: string;
    status: string;
    priceCents: number;
    flowId: string | null;
    ownerId?: string | null;
  };

  flow?: {
    id: string;
    actions: FlowAction[];
  };

  teaser?: {
    type: "text" | "cta";
    text: string;
    url?: string;
  }[];

  analytics?: {
    totalScans: number;
    eventCount: number;
    lastScan: string;
  };

  state: "initial" | "scanning" | "completed";
};