export type CognitiveEvidenceSource =
  | "prompt"
  | "user"
  | "scan"
  | "memory"
  | "geo"
  | "system"
  | "inference";

export type CognitiveEvidenceKind =
  | "observed"
  | "stated"
  | "derived"
  | "inferred"
  | "predicted";

export type CognitiveConfidence =
  | "certain"
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type CognitiveEvidence = {
  id: string;
  subject: string;
  predicate: string;
  object: string;

  source: CognitiveEvidenceSource;
  kind: CognitiveEvidenceKind;
  confidence: CognitiveConfidence;

  timestamp?: string;
  location?: string;

  context?: Record<string, unknown>;
};

export type CognitiveStateChange = {
  id: string;

  subject: string;

  previousValue?: string;
  nextValue: string;

  reason: string;

  evidenceIds: string[];

  timestamp?: string;
};

export type CognitiveWorldState = {
  evidence: CognitiveEvidence[];

  changes: CognitiveStateChange[];

  known: string[];
  inferred: string[];
  possible: string[];

  lastUpdated?: string;
};

export function createWorldState(
  evidence: CognitiveEvidence[] = []
): CognitiveWorldState {
  return {
    evidence,
    changes: [],

    known: evidence
      .filter(
        item =>
          item.kind === "observed" ||
          item.kind === "stated"
      )
      .map(item => item.id),

    inferred: evidence
      .filter(
        item =>
          item.kind === "derived" ||
          item.kind === "inferred"
      )
      .map(item => item.id),

    possible: evidence
      .filter(item => item.kind === "predicted")
      .map(item => item.id),

    lastUpdated: new Date().toISOString()
  };
}
