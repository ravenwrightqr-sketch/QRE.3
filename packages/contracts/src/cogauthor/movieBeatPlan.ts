import type { MediaAsset } from "../media.js";

export type MovieBeatPlanMode = "auto" | "manual";
export type MovieBeatPlanBeatKind = "text" | "photo" | "cta";

export type MovieBeatPlanBeat = {
  id: string;
  order: number;
  kind: MovieBeatPlanBeatKind;
  text?: string;
  media?: MediaAsset;
  sourceIds: string[];
  reason: string;
  durationHintMs?: number;
  attentionRole?: string;
  silent?: boolean;
};

export type MovieBeatPlan = {
  mode: MovieBeatPlanMode;
  textBeatTarget: number;
  beats: MovieBeatPlanBeat[];
  selectedMediaIds: string[];
  organizationReasons: string[];
  manualOverride: boolean;
  estimatedDurationMs: number;
};
