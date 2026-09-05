/**
 * QRE EXPERIENCE STATE
 *
 * Durable semantic state for an experience chapter.
 * This is interpretation state, never source truth and never an Author authority.
 */
import type { WorldSimulation } from "../world/worldSimulation.js";

export type ExperienceTempoMode =
  | "hook"
  | "accelerate"
  | "tighten"
  | "hold"
  | "revisit"
  | "release"
  | "open";

export type ExperienceTempo = {
  mode: ExperienceTempoMode;
  urgency: number;
  compression: number;
  revealSpacing: number;
  holdPressure: number;
  nextBeatPull: number;
  reason: string;
  arc: string[];
};

export type ExperienceState = {
  version: 1;
  realityAnchors?: string[];
  worldSimulation?: WorldSimulation;
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
  tempo: ExperienceTempo;
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
