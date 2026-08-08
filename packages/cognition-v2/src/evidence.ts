export type CognitiveEvidenceType =
  | "explicit_statement"
  | "observed_event"
  | "recorded_location"
  | "recorded_time"
  | "shared_context"
  | "historical_record"
  | "derived_relationship"
  | "pattern"
  | "inference"
  | "possibility";

export type CognitiveEvidence = {
  id: string;

  type: CognitiveEvidenceType;

  subjectId: string;
  predicate: string;
  objectValue: string;

  confidence: number;

  source?: string;

  observedAt?: string;
  recordedAt?: string;

  locationId?: string;

  context?: Record<string, unknown>;
};

export type CognitiveClaim = {
  id: string;

  subjectId: string;
  predicate: string;
  objectValue: string;

  evidenceIds: string[];

  confidence: number;

  status:
    | "known"
    | "probable"
    | "possible"
    | "disputed";

  firstObserved?: string;
  lastObserved?: string;
};

export type CognitiveEvidenceStore = {
  evidence: CognitiveEvidence[];
  claims: CognitiveClaim[];
};

export function createEvidenceStore(
  evidence: CognitiveEvidence[] = [],
  claims: CognitiveClaim[] = []
): CognitiveEvidenceStore {
  return {
    evidence: [...evidence],
    claims: [...claims]
  };
}

export function addEvidence(
  store: CognitiveEvidenceStore,
  evidence: CognitiveEvidence
): CognitiveEvidenceStore {
  return {
    ...store,
    evidence: [
      ...store.evidence,
      evidence
    ]
  };
}

export function addClaim(
  store: CognitiveEvidenceStore,
  claim: CognitiveClaim
): CognitiveEvidenceStore {
  return {
    ...store,
    claims: [
      ...store.claims,
      claim
    ]
  };
}

export function getEvidenceForClaim(
  store: CognitiveEvidenceStore,
  claimId: string
): CognitiveEvidence[] {
  const claim = store.claims.find(
    item => item.id === claimId
  );

  if (!claim) {
    return [];
  }

  return store.evidence.filter(
    evidence =>
      claim.evidenceIds.includes(evidence.id)
  );
}
