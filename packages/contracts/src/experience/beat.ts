import type { MediaAsset } from "../media.js";

export type ExperienceBeatKind =
  | "jolt"
  | "reveal"
  | "turn"
  | "payoff"
  | "afterglow"
  | "photo";

export type ExperienceBeat = {
  id: string;
  text: string;
  kind: ExperienceBeatKind;
  order: number;
  attentionRole?: string;
  operator?: string;
  callback?: boolean;
  durationHintMs?: number;
  visualHint?: string;
  audioMood?: string;
  /** First-class visual beat. Text stays empty unless the source image itself contains text. */
  media?: MediaAsset;
  meta?: Record<string, unknown>;
};
