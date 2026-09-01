/**
 * Canonical internal representation of source reality for QRE Author cognition.
 *
 * Facts remain immutable evidence. Events are the units the Author can relate,
 * contrast, sequence, and revisit. Derived structure is explicitly marked as
 * interpretive so it can enrich creativity without becoming source truth.
 */
import type { LatentMovieCandidate } from "./latentMovie.js";

export type RealityEvidence = {
  id: string;
  text: string;
  kind: "fact" | "moment" | "memory" | "trajectory" | "prompt" | "identity";
};

export type RealityEntity = {
  id: string;
  name: string;
  kind: "person" | "animal" | "object" | "place" | "organization" | "event" | "unknown";
  sourceIds: string[];
  confidence: number;
};

export type RealityEntityContinuity = {
  entityId: string;
  entity: string;
  eventIds: string[];
  firstEventId?: string;
  lastEventId?: string;
  recurrenceCount: number;
  confidence: number;
};

export type RealityEventStructure = {
  eventId: string;
  actionTerms: string[];
  stateTerms: string[];
  objectTerms: string[];
  semanticTags: string[];
  recurrenceScore: number;
  transitionScore: number;
  anomalyScore: number;
  salience: number;
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
  action?: string;
  object?: string;
  stateBefore?: string;
  stateAfter?: string;
  kind?: "event" | "state" | "observation";
  salience?: number;
  tags?: string[];
  structure?: RealityEventStructure;
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
  evidenceIds?: string[];
};

export type RealityTransition = {
  fromEventId: string;
  toEventId: string;
  before?: string;
  after?: string;
  mechanism: "explicit" | "state_shift" | "process" | "temporal" | "recurrence";
  confidence: number;
};

export type RealityPattern = {
  id: string;
  label: string;
  eventIds: string[];
  signal: "recurrence" | "contrast" | "transformation" | "convergence" | "sequence" | "status" | "sensory";
  confidence: number;
};

export type RealityThread = {
  id: string;
  label: string;
  eventIds: string[];
  basis: "recurrence" | "tension" | "unfinished_process" | "recontextualization";
  confidence: number;
};

export type RealityAnomaly = {
  id: string;
  label: string;
  eventIds: string[];
  basis: "state_mismatch" | "repeat" | "unusual_convergence" | "unexpected_change" | "density";
  confidence: number;
};

export type RealitySalience = {
  eventId: string;
  score: number;
  reasons: string[];
};

export type RealityGraph = {
  evidence: RealityEvidence[];
  entities?: RealityEntity[];
  entityContinuity?: RealityEntityContinuity[];
  entityContinuities?: RealityEntityContinuity[];
  events: RealityEvent[];
  eventStructure?: RealityEventStructure[];
  eventStructures?: RealityEventStructure[];
  relations: RealityRelation[];
  transitions?: RealityTransition[];
  patterns?: RealityPattern[];
  openThreads?: RealityThread[];
  anomalies?: RealityAnomaly[];
  salience?: RealitySalience[];
  unresolvedTensions: string[];
  recurringSignals: string[];
  sensorySignals: string[];
  /** Derived hypotheses only. Never promote these to source truth. */
  latentMovieCandidates?: LatentMovieCandidate[];
};
