export type ExperienceBeatKind =
  | "jolt"
  | "reveal"
  | "turn"
  | "payoff"
  | "afterglow";

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
  meta?: Record<string, unknown>;
};
