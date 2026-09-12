/**
 * Canonical QRE semantic sequence contract.
 *
 * Reality answers what exists or happened. SequencePlay answers what changes
 * in the visitor's understanding from one cut to the next. Presentation is
 * downstream; this contract contains only semantic experience state.
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

export type ViewerMomentum = import("./viewerMomentum.js").ViewerMomentum;
export type MagnetCircle = import("./viewerMomentum.js").MagnetCircle;
export type CutNecessity = import("./viewerMomentum.js").CutNecessity;
export type SequenceTransition = import("./viewerMomentum.js").SequenceTransition;

export type SequenceCut = {
  id: string;
  order: number;
  role: ViewerAttentionRole;
  gainKind?: SequenceGainKind;
  sourceIds: string[];
  informationGain: string;
  attentionDelta: string;
  viewerBefore: ViewerState;
  viewerAfter: ViewerState;
  momentum?: SequenceTransition;
  necessity?: CutNecessity;
  nextPromise?: string;
  payoffConnection?: string;
  noveltyScore?: number;
  confidence: number;
};

export type SequencePlay = {
  subject: string;
  premise: string;
  openingState: ViewerState;
  baselineFacts?: string[];
  openingMomentum?: ViewerMomentum;
  cuts: SequenceCut[];
  closingMomentum?: ViewerMomentum;
  closingState?: ViewerState;
  continuity?: string[];
  antiCrutch?: string[];
  continuation?: string;
};
