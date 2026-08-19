import type {
  AuthorEvidenceModality,
  AuthorGeoEvidence,
  AuthorMultimodalEvidence,
  AuthorTimelineEvidence,
} from "@qre/contracts";

export type AuthorEvidenceInput = {
  sourceId: string;
  modality: AuthorEvidenceModality;
  label: string;
  value?: string;
  confidence?: number;
  eventIds?: readonly string[];
  metadata?: Record<string, string | number | boolean | null>;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

export function normalizeMultimodalEvidence(
  inputs: readonly AuthorEvidenceInput[],
): AuthorMultimodalEvidence[] {
  return inputs
    .filter((input) => clean(input.sourceId) && clean(input.label))
    .map((input) => ({
      sourceId: clean(input.sourceId),
      modality: input.modality,
      label: clean(input.label),
      value: clean(input.value) || undefined,
      confidence: metric(input.confidence ?? 0.8),
      eventIds: [...new Set((input.eventIds ?? []).map(clean).filter(Boolean))],
      metadata: input.metadata,
    }));
}

export function normalizeTimelineEvidence(
  values: readonly AuthorTimelineEvidence[],
): AuthorTimelineEvidence[] {
  return values
    .filter((value) => clean(value.sourceId) && clean(value.label))
    .map((value) => ({
      ...value,
      sourceId: clean(value.sourceId),
      label: clean(value.label),
      confidence: metric(value.confidence),
    }))
    .sort((a, b) => String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? "")));
}

export function normalizeGeoEvidence(
  values: readonly AuthorGeoEvidence[],
): AuthorGeoEvidence[] {
  return values
    .filter((value) => clean(value.sourceId) && clean(value.label))
    .map((value) => ({
      ...value,
      sourceId: clean(value.sourceId),
      label: clean(value.label),
      confidence: metric(value.confidence),
    }));
}

export function deriveModalitySignals(
  evidence: readonly AuthorMultimodalEvidence[],
): string[] {
  return [...new Set(
    evidence
      .filter((item) => item.confidence >= 0.6)
      .flatMap((item) => [item.label, ...(item.value ? [item.value] : [])])
      .map(clean)
      .filter(Boolean),
  )].slice(0, 64);
}
