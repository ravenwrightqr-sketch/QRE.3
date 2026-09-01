/**
 * Canonical internal representation of source reality for QRE Author cognition.
 *
 * Facts remain immutable evidence. Events are the units the Author can relate,
 * contrast, sequence, and revisit. Edges preserve temporal, causal,
 * relational, and recontextualization links without changing source truth.
 */
import type { LatentMovieCandidate } from "./latentMovie.js";

export type RealityEvidence = {
  id: string;
  text: string;
  kind: "fact" | "moment" | "memory" | "trajectory" | "prompt" | "identity";
};

export type RealityEvent = {
  id: string;
  label: string;
  sourceIds: string[];
  entities: string[];
  place?: string;
  time?: string;
  goal?: string;
  emotionalState?: string;
  salient: boolean;
  provenance: "explicit" | "memory" | "prompt";
};

export type RealityRelation = {
  from: string;
  to: string;
  kind:
    | "before"
    | "after"
    | "causes"
    | "changes"
    | "contrasts"
    | "repeats"
    | "belongs_to"
    | "involves"
    | "recontextualizes"
    | "converges";
  strength: number;
};

/** Derived structural anatomy. Never replaces or mutates the explicit event label. */
export type RealityEventStructure = {
  eventId: string;
  subjects: string[];
  actions: string[];
  objects: string[];
  states: string[];
  temporalMarkers: string[];
  sensoryMarkers: string[];
  semanticTags: string[];
  recurrenceScore: number;
  transitionScore: number;
  anomalyScore: number;
  salienceScore: number;
};

/** Stable entity continuity discovered across supplied reality. */
export type RealityEntityContinuity = {
  name: string;
  mentionCount: number;
  eventIds: string[];
  firstEventId: string;
  lastEventId: string;
  kind: "person" | "animal" | "object" | "place" | "organization" | "unknown";
  salienceScore: number;
};

export type RealityPattern = {
  kind:
    | "transition"
    | "motif"
    | "recurrence"
    | "tension"
    | "anomaly"
    | "thread";
  label: string;
  eventIds: string[];
  evidenceIds: string[];
  strength: number;
};

export type RealityGraph = {
  evidence: RealityEvidence[];
  events: RealityEvent[];
  relations: RealityRelation[];
  unresolvedTensions: string[];
  recurringSignals: string[];
  sensorySignals: string[];
  /** Rich derived structure used by cognition/movie search. */
  eventStructure?: RealityEventStructure[];
  entityContinuity?: RealityEntityContinuity[];
  patterns?: RealityPattern[];
  /** Derived hypotheses only. Never promote these to source truth. */
  latentMovieCandidates?: LatentMovieCandidate[];
};
