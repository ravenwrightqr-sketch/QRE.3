/**
 * Canonical internal representation of source reality for QRE Author cognition.
 *
 * Facts remain immutable evidence. Events are the units the Author can relate,
 * contrast, sequence, and revisit. Edges preserve temporal, causal,
 * relational, and recontextualization links without changing source truth.
 */
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

export type RealityGraph = {
  evidence: RealityEvidence[];
  events: RealityEvent[];
  relations: RealityRelation[];
  unresolvedTensions: string[];
  recurringSignals: string[];
  sensorySignals: string[];
};
