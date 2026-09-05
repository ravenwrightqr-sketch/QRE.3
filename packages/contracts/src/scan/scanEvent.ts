export type ScanEventType =
  | "SCAN"
  | "SESSION_START"
  | "SESSION_END"
  | "FLOW_START"
  | "FLOW_STEP"
  | "FLOW_COMPLETE"
  | "PAYMENT"
  | "GEO_MARK"
  | "CHECK_IN"
  | "CHECK_OUT";

export type GeoPayload = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type ScanEvent = {
  assetId: string;
  sessionId: string | null;
  userId: string | null;
  type: ScanEventType;
  timestamp: string;

  geo?: GeoPayload;
};