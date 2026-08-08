import type {
  CognitiveClaim,
  CognitiveEvidence,
  CognitiveEvidenceStore
} from "./evidence.js";

type ClaimStatus =
  | "known"
  | "probable"
  | "possible"
  | "disputed";

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function statusFromConfidence(
  confidence: number
): ClaimStatus {
  if (confidence >= 0.9) {
    return "known";
  }

  if (confidence >= 0.7) {
    return "probable";
  }

  return "possible";
}

function evidenceWeight(
  evidence: CognitiveEvidence
): number {
  switch (evidence.type) {
    case "explicit_statement":
      return 1;

    case "historical_record":
      return 0.95;

    case "observed_event":
      return 0.9;

    case "recorded_location":
      return 0.85;

    case "recorded_time":
      return 0.85;

    case "shared_context":
      return 0.75;

    case "derived_relationship":
      return 0.7;

    case "pattern":
      return 0.6;

    case "inference":
      return 0.5;

    case "possibility":
      return 0.35;
  }
}

function normalizeEvidenceConfidence(
  evidence: CognitiveEvidence
): number {
  return clampConfidence(
    evidence.confidence *
      evidenceWeight(evidence)
  );
}

export function getSupportingEvidence(
  store: CognitiveEvidenceStore,
  subjectId: string,
  predicate: string,
  objectValue: string
): CognitiveEvidence[] {
  return store.evidence.filter(
    evidence =>
      evidence.subjectId === subjectId &&
      evidence.predicate === predicate &&
      evidence.objectValue === objectValue
  );
}

export function getConflictingEvidence(
  store: CognitiveEvidenceStore,
  subjectId: string,
  predicate: string,
  objectValue: string
): CognitiveEvidence[] {
  return store.evidence.filter(
    evidence =>
      evidence.subjectId === subjectId &&
      evidence.predicate === predicate &&
      evidence.objectValue !== objectValue
  );
}

export function calculateClaimConfidence(
  supporting: CognitiveEvidence[],
  conflicting: CognitiveEvidence[] = []
): number {
  if (!supporting.length) {
    return 0;
  }

  const supportingStrength =
    1 -
    supporting.reduce(
      (remaining, evidence) =>
        remaining *
        (1 -
          normalizeEvidenceConfidence(evidence)),
      1
    );

  const conflictStrength =
    conflicting.reduce(
      (total, evidence) =>
        total +
        normalizeEvidenceConfidence(evidence),
      0
    );

  const normalizedConflict =
    Math.min(0.85, conflictStrength);

  return clampConfidence(
    supportingStrength *
      (1 - normalizedConflict)
  );
}

export function evaluateClaim(
  store: CognitiveEvidenceStore,
  subjectId: string,
  predicate: string,
  objectValue: string
): CognitiveClaim | null {
  const supporting =
    getSupportingEvidence(
      store,
      subjectId,
      predicate,
      objectValue
    );

  if (!supporting.length) {
    return null;
  }

  const conflicting =
    getConflictingEvidence(
      store,
      subjectId,
      predicate,
      objectValue
    );

  const confidence =
    calculateClaimConfidence(
      supporting,
      conflicting
    );

  const status =
    conflicting.length > 0 &&
    confidence < 0.7
      ? "disputed"
      : statusFromConfidence(
          confidence
        );

  const timestamps =
    supporting
      .flatMap(evidence => [
        evidence.observedAt,
        evidence.recordedAt
      ])
      .filter(
        (value): value is string =>
          Boolean(value)
      )
      .sort();

  return {
    id: [
      subjectId,
      predicate,
      objectValue
    ].join("::"),

    subjectId,
    predicate,
    objectValue,

    evidenceIds:
      supporting.map(
        evidence => evidence.id
      ),

    confidence,
    status,

    firstObserved:
      timestamps[0],

    lastObserved:
      timestamps[timestamps.length - 1]
  };
}

export function evaluateAllClaims(
  store: CognitiveEvidenceStore
): CognitiveClaim[] {
  const keys = new Map<
    string,
    {
      subjectId: string;
      predicate: string;
      objectValue: string;
    }
  >();

  for (const evidence of store.evidence) {
    const key = [
      evidence.subjectId,
      evidence.predicate,
      evidence.objectValue
    ].join("::");

    keys.set(key, {
      subjectId: evidence.subjectId,
      predicate: evidence.predicate,
      objectValue: evidence.objectValue
    });
  }

  return Array.from(keys.values())
    .map(key =>
      evaluateClaim(
        store,
        key.subjectId,
        key.predicate,
        key.objectValue
      )
    )
    .filter(
      (claim): claim is CognitiveClaim =>
        claim !== null
    );
}
