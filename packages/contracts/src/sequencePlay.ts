/**
 * Sequence Play is the semantic contract for how an experience plays in time.
 *
 * Reality answers: what exists / happened.
 * SequencePlay answers: what changes in the viewer's experience from cut to cut.
 *
 * Important: identity and established facts belong to baseline world state. They
 * are not attention gains by themselves and should not consume sequence cuts
 * unless revealing them materially changes the viewer's question or expectation.
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

export type SequenceGainKind =
  | "baseline"
  | "new_fact"
  | "surprise"
  | "question"
  | "escalation"
  | "reframe"
  | "discovery"
  | "consequence"
  | "callback"
  | "payoff";

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
  /** Explicit classification. Optional only during migration of legacy producers. */
  gainKind?: SequenceGainKind;
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
  /** Facts/identity established before the actual attention sequence begins. */
  baselineFacts?: string[];
  cuts: SequenceCut[];
  closingState?: ViewerState;
  continuity?: string[];
  antiCrutch?: string[];
  continuation?: string;
};
