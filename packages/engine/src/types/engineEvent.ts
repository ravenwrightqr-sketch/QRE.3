export const EngineEventTypes = {
  SCAN_START: "SCAN_START",

  FLOW_TRIGGERED: "FLOW_TRIGGERED",
  FLOW_STEP: "FLOW_STEP",
  FLOW_COMPLETE: "FLOW_COMPLETE",

  MEMORY_APPLIED: "MEMORY_APPLIED",

  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",

  GEO_MARK: "GEO_MARK",
} as const;

export type EngineEventType =
  (typeof EngineEventTypes)[keyof typeof EngineEventTypes];