import type {
  CognitiveClaim,
  CognitiveEvidence,
  CognitiveEvidenceStore
} from "./evidence.js";

export type CognitiveInferenceRule =
  | "shared_event"
  | "shared_place"
  | "temporal_overlap"
  | "shared_object"
  | "repeated_pattern";

export type CognitiveInference = {
  id: string;

  rule: CognitiveInferenceRule;

  evidenceIds: string[];

  subjectId: string;
  predicate: string;
  objectValue: string;

  confidence: number;

  explanation: string;
};

function confidenceFromEvidence(
  evidence: CognitiveEvidence[]
): number {
  if (!evidence.length) {
    return 0;
  }

  const average =
    evidence.reduce(
      (sum, item) => sum + item.confidence,
      0
    ) / evidence.length;

  return Math.min(
    0.99,
    Math.max(0, average)
  );
}

function makeInference(
  rule: CognitiveInferenceRule,
  evidence: CognitiveEvidence[],
  subjectId: string,
  predicate: string,
  objectValue: string,
  explanation: string
): CognitiveInference {
  return {
    id: `inference:${rule}:${subjectId}:${objectValue}`,

    rule,

    evidenceIds: evidence.map(
      item => item.id
    ),

    subjectId,

    predicate,

    objectValue,

    confidence:
      confidenceFromEvidence(evidence),

    explanation
  };
}

export function inferSharedEvent(
  evidence: CognitiveEvidence[]
): CognitiveInference[] {
  const results: CognitiveInference[] = [];

  const eventEvidence =
    evidence.filter(
      item =>
        item.predicate === "attended" ||
        item.predicate === "participated_in"
    );

  for (const first of eventEvidence) {
    for (const second of eventEvidence) {
      if (
        first.id === second.id ||
        first.objectValue !== second.objectValue
      ) {
        continue;
      }

      if (
        first.subjectId === second.subjectId
      ) {
        continue;
      }

      results.push(
        makeInference(
          "shared_event",
          [first, second],
          first.subjectId,
          "shared_event_with",
          second.subjectId,
          `Both entities are associated with the same event: ${first.objectValue}.`
        )
      );
    }
  }

  return deduplicateInferences(results);
}

export function inferSharedPlace(
  evidence: CognitiveEvidence[]
): CognitiveInference[] {
  const results: CognitiveInference[] = [];

  const placeEvidence =
    evidence.filter(
      item =>
        item.predicate === "visited" ||
        item.predicate === "located_at" ||
        item.predicate === "occurred_at"
    );

  for (const first of placeEvidence) {
    for (const second of placeEvidence) {
      if (
        first.id === second.id ||
        first.objectValue !== second.objectValue
      ) {
        continue;
      }

      if (
        first.subjectId === second.subjectId
      ) {
        continue;
      }

      results.push(
        makeInference(
          "shared_place",
          [first, second],
          first.subjectId,
          "shared_place_with",
          second.subjectId,
          `Both entities are associated with the same place: ${first.objectValue}.`
        )
      );
    }
  }

  return deduplicateInferences(results);
}

export function inferTemporalOverlap(
  evidence: CognitiveEvidence[]
): CognitiveInference[] {
  const results: CognitiveInference[] = [];

  const timed =
    evidence.filter(
      item =>
        Boolean(item.observedAt)
    );

  for (const first of timed) {
    for (const second of timed) {
      if (
        first.id === second.id ||
        first.subjectId === second.subjectId
      ) {
        continue;
      }

      if (
        !first.observedAt ||
        !second.observedAt
      ) {
        continue;
      }

      const firstTime =
        new Date(first.observedAt).getTime();

      const secondTime =
        new Date(second.observedAt).getTime();

      if (
        !Number.isFinite(firstTime) ||
        !Number.isFinite(secondTime)
      ) {
        continue;
      }

      const difference =
        Math.abs(firstTime - secondTime);

      const sixHours =
        6 * 60 * 60 * 1000;

      if (difference > sixHours) {
        continue;
      }

      results.push(
        makeInference(
          "temporal_overlap",
          [first, second],
          first.subjectId,
          "temporal_overlap_with",
          second.subjectId,
          "The recorded observations occurred within six hours of one another."
        )
      );
    }
  }

  return deduplicateInferences(results);
}

export function inferSharedObject(
  evidence: CognitiveEvidence[]
): CognitiveInference[] {
  const results: CognitiveInference[] = [];

  const objectEvidence =
    evidence.filter(
      item =>
        item.predicate === "used" ||
        item.predicate === "owned" ||
        item.predicate === "associated_with"
    );

  for (const first of objectEvidence) {
    for (const second of objectEvidence) {
      if (
        first.id === second.id ||
        first.subjectId === second.subjectId ||
        first.objectValue !== second.objectValue
      ) {
        continue;
      }

      results.push(
        makeInference(
          "shared_object",
          [first, second],
          first.subjectId,
          "shared_object_with",
          second.subjectId,
          `Both entities are associated with the same object: ${first.objectValue}.`
        )
      );
    }
  }

  return deduplicateInferences(results);
}

export function inferRepeatedPatterns(
  evidence: CognitiveEvidence[]
): CognitiveInference[] {
  const results: CognitiveInference[] = [];

  const groups =
    new Map<string, CognitiveEvidence[]>();

  for (const item of evidence) {
    const key =
      `${item.subjectId}:${item.predicate}:${item.objectValue}`;

    const existing =
      groups.get(key) ?? [];

    existing.push(item);

    groups.set(key, existing);
  }

  for (const [key, items] of groups) {
    if (items.length < 2) {
      continue;
    }

    const [subjectId, predicate, objectValue] =
      key.split(":");

    results.push(
      makeInference(
        "repeated_pattern",
        items,
        subjectId,
        predicate,
        objectValue,
        `The same relationship was supported by ${items.length} pieces of evidence.`
      )
    );
  }

  return deduplicateInferences(results);
}

function deduplicateInferences(
  inferences: CognitiveInference[]
): CognitiveInference[] {
  const seen =
    new Map<string, CognitiveInference>();

  for (const inference of inferences) {
    const reverseId =
      `inference:${inference.rule}:${inference.objectValue}:${inference.subjectId}`;

    if (
      seen.has(inference.id) ||
      seen.has(reverseId)
    ) {
      continue;
    }

    seen.set(
      inference.id,
      inference
    );
  }

  return [...seen.values()];
}

export function inferClaims(
  store: CognitiveEvidenceStore
): CognitiveClaim[] {
  const inferences = [
    ...inferSharedEvent(store.evidence),
    ...inferSharedPlace(store.evidence),
    ...inferTemporalOverlap(store.evidence),
    ...inferSharedObject(store.evidence),
    ...inferRepeatedPatterns(store.evidence)
  ];

  return inferences.map(
    inference => ({
      id: `claim:${inference.id}`,

      subjectId:
        inference.subjectId,

      predicate:
        inference.predicate,

      objectValue:
        inference.objectValue,

      evidenceIds:
        inference.evidenceIds,

      confidence:
        inference.confidence,

      status:
        inference.confidence >= 0.9
          ? "probable"
          : inference.confidence >= 0.6
            ? "possible"
            : "possible"
    })
  );
}
