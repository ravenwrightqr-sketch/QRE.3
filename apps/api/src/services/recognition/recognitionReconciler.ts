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

type Bbox = [number, number, number, number];

function bboxOverlap(a?: Bbox, b?: Bbox): number {
  if (!a || !b) return 0;
  const [ax1, ay1, ax2, ay2] = a;
  const [bx1, by1, bx2, by2] = b;
  const left = Math.max(ax1, bx1);
  const top = Math.max(ay1, by1);
  const right = Math.min(ax2, bx2);
  const bottom = Math.min(ay2, by2);
  if (right <= left || bottom <= top) return 0;
  const intersection = (right - left) * (bottom - top);
  const areaA = Math.max(0, ax2 - ax1) * Math.max(0, ay2 - ay1);
  const areaB = Math.max(0, bx2 - bx1) * Math.max(0, by2 - by1);
  return intersection / Math.max(1, Math.min(areaA, areaB));
}

function samePhysicalObservation(a: RecognitionObservation, b: RecognitionObservation): boolean {
  if (a.observationId === b.observationId) return true;
  if (a.sourceId && b.sourceId && a.sourceId === b.sourceId) return true;
  const overlap = bboxOverlap(a.location?.bbox, b.location?.bbox);
  return overlap >= 0.65;
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
      sameIdentity(candidate.candidate, observation.candidate) && samePhysicalObservation(candidate, observation),
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
