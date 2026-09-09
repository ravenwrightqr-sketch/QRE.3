import type {
  RecognitionCandidate,
  RecognitionObservation,
  RecognitionResult,
} from "@qre/contracts";

function norm(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s._-]/gu, "");
}

function sameIdentity(a: RecognitionCandidate, b: RecognitionCandidate): boolean {
  const brandA = norm(a.brand);
  const brandB = norm(b.brand);
  const productA = norm(a.product || a.name);
  const productB = norm(b.product || b.name);
  const variantA = norm(a.variant);
  const variantB = norm(b.variant);
  if (brandA && brandB && brandA !== brandB) return false;
  if (productA && productB && productA === productB && (!variantA || !variantB || variantA === variantB)) return true;
  return Boolean(brandA && brandB && brandA === brandB && variantA && variantB && variantA === variantB);
}

function mergeCandidate(existing: RecognitionCandidate, incoming: RecognitionCandidate): RecognitionCandidate {
  const evidence = [...existing.evidence, ...incoming.evidence];
  const attributes = { ...(existing.attributes ?? {}), ...(incoming.attributes ?? {}) };
  return {
    ...existing,
    state: existing.state === "matched" || incoming.state === "matched" ? "matched" : existing.state,
    name: existing.name || incoming.name,
    brand: existing.brand || incoming.brand,
    product: existing.product || incoming.product,
    variant: existing.variant || incoming.variant,
    category: existing.category || incoming.category,
    attributes: Object.keys(attributes).length ? attributes : undefined,
    evidence: evidence.slice(0, 64),
    confidence: Math.max(existing.confidence, incoming.confidence),
  };
}

export function reconcileRecognitionResult(result: RecognitionResult): RecognitionResult {
  const observations: RecognitionObservation[] = [];
  for (const observation of result.observations) {
    const existingIndex = observations.findIndex((candidate) =>
      sameIdentity(candidate.candidate, observation.candidate),
    );
    if (existingIndex < 0) observations.push(observation);
    else {
      const existing = observations[existingIndex];
      observations[existingIndex] = {
        ...existing,
        candidate: mergeCandidate(existing.candidate, observation.candidate),
        location: existing.location || observation.location,
        sourceId: existing.sourceId || observation.sourceId,
      };
    }
  }

  return {
    ...result,
    observations: observations.slice(0, 500),
    warnings: [...new Set(result.warnings)].slice(0, 100),
  };
}
