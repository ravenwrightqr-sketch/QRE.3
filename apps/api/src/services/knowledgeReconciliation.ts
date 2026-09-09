export type ReconciliationFact = {
  label: string;
  value: string;
  category?: string;
  unit?: string;
  notes?: string;
};

export type ReconciliationCandidate = {
  id: string;
  name: string;
  normalizedName: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  attributes: Array<{ key: string; value: string; normalizedValue?: string | null }>;
};

export type ReconciliationDecision = {
  matchId?: string;
  confidence: number;
  reason: string;
  ambiguous: boolean;
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 2));
}

function tokenOverlap(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function valueAffinity(fact: ReconciliationFact, candidate: ReconciliationCandidate): number {
  const factValue = normalize(fact.value);
  if (!factValue) return 0;
  let best = 0;
  for (const attribute of candidate.attributes) {
    const candidateValue = normalize(attribute.normalizedValue || attribute.value);
    if (!candidateValue) continue;
    if (candidateValue === factValue) best = Math.max(best, 1);
    else best = Math.max(best, tokenOverlap(fact.value, attribute.value));
  }
  return best;
}

function scoreCandidate(fact: ReconciliationFact, candidate: ReconciliationCandidate): number {
  const label = normalize(fact.label);
  const candidateName = normalize(candidate.name);
  if (!label || !candidateName) return 0;

  const exact = label === candidateName ? 1 : 0;
  const nameOverlap = tokenOverlap(fact.label, candidate.name);
  const category = fact.category && candidate.category
    ? normalize(fact.category) === normalize(candidate.category) ? 1 : tokenOverlap(fact.category, candidate.category)
    : 0;
  const brand = candidate.brand ? tokenOverlap(`${fact.label} ${fact.value}`, candidate.brand) : 0;
  const value = valueAffinity(fact, candidate);

  return exact * 0.55 + nameOverlap * 0.25 + value * 0.12 + category * 0.05 + brand * 0.03;
}

/**
 * Conservative identity resolution for cross-source knowledge.
 * It prefers an explicit exact match, otherwise requires a material score gap
 * before reusing an existing catalog identity.
 */
export function reconcileCatalogIdentity(
  fact: ReconciliationFact,
  candidates: ReconciliationCandidate[],
): ReconciliationDecision {
  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(fact, candidate) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return { confidence: 0, reason: "No candidate identities exist.", ambiguous: false };
  if (best.score >= 0.98) {
    return { matchId: best.candidate.id, confidence: best.score, reason: "Exact identity signals agree.", ambiguous: false };
  }
  const gap = best.score - (second?.score ?? 0);
  if (best.score >= 0.72 && gap >= 0.12) {
    return {
      matchId: best.candidate.id,
      confidence: Math.min(0.97, best.score),
      reason: `Matched by name/value/category evidence with a ${gap.toFixed(2)} score margin.`,
      ambiguous: false,
    };
  }
  if (best.score >= 0.55) {
    return {
      confidence: best.score,
      reason: "A plausible identity exists, but evidence is too ambiguous to merge automatically.",
      ambiguous: true,
    };
  }
  return { confidence: best.score, reason: "No sufficiently strong identity match.", ambiguous: false };
}
