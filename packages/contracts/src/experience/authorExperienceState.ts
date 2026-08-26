/**
 * QRE AUTHOR EXPERIENCE STATE
 *
 * Durable semantic state for an authored chapter.
 * This is interpretation state, never source truth.
 */
export type AuthorTempoMode =
  | "hook"
  | "accelerate"
  | "tighten"
  | "hold"
  | "revisit"
  | "release"
  | "open";

export type AuthorTempo = {
  mode: AuthorTempoMode;
  urgency: number;
  compression: number;
  revealSpacing: number;
  holdPressure: number;
  nextBeatPull: number;
  reason: string;
  arc: string[];
};

export type AuthorExperienceState = {
  version: 1;

  /** Explicit factual labels retained only as provenance anchors for later comparison. */
  realityAnchors?: string[];

  establishedEventIds: string[];
  changedEventIds: string[];
  carrierEventIds: string[];

  activeTensionKeys: string[];
  resolvedTensionKeys: string[];

  setupEventIds: string[];
  callbackEventIds: string[];
  revisitedEventIds: string[];

  unresolvedQuestions: string[];
  carryThreads: string[];

  futureEventIds: string[];
  futureThreadKeys: string[];
  consumedFutureEventIds: string[];
  retiredFutureThreadKeys: string[];

  semanticTurnKeys: string[];
  relationKinds: string[];

  continuationValue: number;
  lookaheadValue: number;
  endpointPressure: number;
  attentionPotential: number;

  tempo: AuthorTempo;

  selectedLens: string;
  selectedMovieId?: string;
  payoffEventIds: string[];
  earnedByEventIds: string[];

  chapter: {
    openingEventIds: string[];
    finalEventIds: string[];
    semanticTurns: string[];
    operations: string[];
  };

  memoryHooks: string[];
};