/**
 * Sequence Play is the internal semantic contract for how an experience plays
 * in time. It is not a screenplay template and it does not prescribe a fixed
 * number or order of beats.
 *
 * Reality answers: what exists / happened.
 * SequencePlay answers: what the viewer should know, want, question, or
 * re-understand from one cut to the next.
 */

export type ViewerAttentionRole =
  | "arrival"
  | "hook"
  | "question"
  | "pressure"
  | "reframe"
  | "escalation"
  | "discovery"
  | "consequence"
  | "release"
  | "payoff"
  | "callback"
  | "continuation";

export type ViewerState = {
  known: string[];
  expected?: string;
  unresolved?: string;
  currentWant?: string;
  recentChange?: string;
};

export type SequenceCut = {
  id: string;
  order: number;
  role: ViewerAttentionRole;
  sourceIds: string[];
  informationGain: string;
  attentionDelta: string;
  viewerBefore: ViewerState;
  viewerAfter: ViewerState;
  nextPromise?: string;
  payoffConnection?: string;
  noveltyScore?: number;
  confidence: number;
};

export type SequencePlay = {
  subject: string;
  premise: string;
  openingState: ViewerState;
  cuts: SequenceCut[];
  closingState?: ViewerState;
  continuity?: string[];
  antiCrutch?: string[];
  continuation?: string;
};
