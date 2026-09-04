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

export type ViewerMomentum = import("./viewerMomentum.js").ViewerMomentum;
export type MagnetCircle = import("./viewerMomentum.js").MagnetCircle;
export type CutNecessity = import("./viewerMomentum.js").CutNecessity;
export type SequenceTransition = import("./viewerMomentum.js").SequenceTransition;

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
  /** Cognitive transition that makes this cut earn its place. */
  momentum?: SequenceTransition;
  /** Whether removing this cut damages curiosity, coherence, surprise, escalation, or payoff. */
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
  /** Facts/identity established before the actual attention sequence begins. */
  baselineFacts?: string[];
  /** Current viewer momentum at the sequence entrance. */
  openingMomentum?: ViewerMomentum;
  cuts: SequenceCut[];
  /** Final viewer momentum after the payoff/release. */
  closingMomentum?: ViewerMomentum;
  closingState?: ViewerState;
  continuity?: string[];
  antiCrutch?: string[];
  continuation?: string;
};
