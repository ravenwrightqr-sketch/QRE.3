/**
 * Canonical internal representation of source reality for QRE Author cognition.
 *
 * Facts remain immutable evidence. Events are the units the Author can relate,
 * contrast, sequence, and revisit. Derived structure is explicitly marked as
 * interpretive so it can enrich creativity without becoming source truth.
 */

export type RealityEvidence = {
  id: string;
  text: string;
  kind: "fact" | "moment" | "memory" | "trajectory" | "prompt" | "identity";
};

export type RealityEntityContinuity = {
  name: string;
  mentionCount: number;
  eventIds: string[];
  firstEventId: string;
  lastEventId: string;
  kind: "person" | "animal" | "object" | "place" | "organization" | "event" | "unknown";
  salienceScore: number;
};

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

export type RealityPattern = {
  kind: "transition" | "recurrence" | "motif" | "tension" | "thread" | "anomaly";
  label: string;
  eventIds: string[];
  evidenceIds: string[];
  strength: number;
};

export type RealityGraph = {
  evidence: RealityEvidence[];
  events: RealityEvent[];
  relations: RealityRelation[];
  eventStructure?: RealityEventStructure[];
  entityContinuity?: RealityEntityContinuity[];
  patterns?: RealityPattern[];
  unresolvedTensions: string[];
  recurringSignals: string[];
  sensorySignals: string[];
  
};
