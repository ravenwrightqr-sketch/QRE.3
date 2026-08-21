import type { SequencePlay } from "./sequencePlay.js";

export type AuthorRhythm = "hit" | "short" | "standard" | "long";

export type AuthorBrainTruth = {
  prompt: string;
  subject: string;
  place?: string;
  lens?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  trajectory?: string[];
  creativeLearningContext?: string[];
  returning?: boolean;
  visitNumber?: number;
  presenceSummary?: string[];
};

export type AuthorCreativeBrief = {
  angle: string;
  engine: string;
  question: string;
  strongestImage: string;
  tension: string;
  payoff: string;
  callback: string;
  rhythm: AuthorRhythm[];
  avoid: string[];
};

export type AuthorSceneKind =
  | "line"
  | "hook"
  | "movement"
  | "discovery"
  | "turn"
  | "payoff"
  | "afterglow";

export type AuthorScene = {
  text: string;
  kind?: AuthorSceneKind;
};

export type AuthorResult = {
  brief: AuthorCreativeBrief;
  scenes: AuthorScene[];
  sequence?: SequencePlay;
  field: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
};
