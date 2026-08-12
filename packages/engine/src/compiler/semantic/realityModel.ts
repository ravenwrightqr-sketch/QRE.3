/**
 * =====================================================
 * QRE REALITY MODEL BUILDER
 * =====================================================
 *
 * JEKYLL: conserve what the prompt actually says before
 * any creative realization is allowed to reinterpret it.
 *
 * This module is intentionally domain-agnostic. It does not
 * know about dogs, weddings, mechanics, raves, birthdays, etc.
 * It preserves evidence as ordered reality beats and derives
 * lightweight semantic atoms from those evidence spans.
 *
 * HYDE may later embellish these facts. HYDE does not get to
 * replace them.
 * =====================================================
 */

import type {
  CognitiveEvidence,
  RealityAtom,
  RealityBeat,
  RealityModel,
  RealityRelation,
} from "@qre/contracts";

const INSTRUCTION_PREFIX = /^(?:please\s+)?(?:make|create|write|tell|turn|build|generate|give|produce|design|show|craft)\b[^.?!:]*?(?=\b(?:about|for|from|with|where|that|who|when|while|after|before|my|our|the|a|an)\b)/i;

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for",
  "from", "had", "has", "have", "he", "her", "his", "i", "in", "is", "it",
  "its", "my", "of", "on", "or", "our", "she", "that", "the", "their", "them",
  "there", "they", "this", "to", "was", "we", "were", "what", "when", "where",
  "which", "who", "with", "you", "your",
]);

const ACTION_HINTS = new Set([
  "arrive", "arriving", "arrived", "get", "getting", "got", "look", "looking", "looked",
  "clean", "cleaning", "cleaned", "repair", "repairing", "repaired", "drive", "driving",
  "hit", "hitting", "walk", "walking", "walked", "leave", "leaving", "left", "stay", "stayed",
  "talk", "talking", "dance", "dancing", "started", "start", "come", "coming", "came",
  "eat", "eating", "ate", "find", "found", "miss", "missed", "keep", "keeping", "add", "adding",
  "become", "becoming", "became", "finish", "finishing", "finished", "go", "going", "went",
  "receive", "received", "open", "opened", "close", "closing", "closed", "celebrate", "celebrating",
]);

function clean(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^\W+|\W+$/g, "").trim();
}

function normalize(value: string): string {
  return clean(value).toLowerCase();
}

function evidence(detail: string, source: "prompt" | "context" = "prompt"): CognitiveEvidence {
  return { source, detail, confidence: 1 };
}

function splitEvidence(prompt: string): string[] {
  const withoutCommand = clean(prompt.replace(INSTRUCTION_PREFIX, ""));

  // Preserve explicit chronology and comma-separated concrete events. We
  // intentionally retain the original wording instead of reducing it to
  // vocabulary labels such as "rave" or "birthday".
  const chunks = withoutCommand
    .split(/(?<=[.!?;])\s+|,\s+(?=(?:and|then|but|while|after|before|until|where|with|the|a|an)\b)/i)
    .map(clean)
    .filter(Boolean);

  return chunks.length > 0 ? chunks : [withoutCommand];
}

function contentTokens(text: string): string[] {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9' -]/g, " ")
      .split(/\s+/)
      .map(clean)
      .filter(token => token.length >= 3 && !STOPWORDS.has(token))
  )];
}

function classifyAtom(token: string, sourceText: string): RealityAtom["kind"] {
  if (ACTION_HINTS.has(token)) return "action";
  if (/\b(?:happy|sad|funny|beautiful|romantic|wild|proud|confident|playful|brutal)\b/i.test(token)) {
    return "emotion";
  }
  if (/\b(?:ready|repaired|finished|open|closed|great|exhausted)\b/i.test(token)) {
    return "state";
  }
  if (/\b(?:at|inside|near|from)\b/i.test(sourceText) && token.length > 3) return "place";
  return "unknown";
}

export function buildRealityModel(prompt: string): RealityModel {
  const source = clean(prompt);
  const chunks = splitEvidence(source);
  const atoms: RealityAtom[] = [];
  const sequence: RealityBeat[] = [];

  chunks.forEach((chunk, index) => {
    const tokens = contentTokens(chunk);
    const atomIds: string[] = [];

    // The complete evidence span is itself conserved. This is the important
    // escape hatch: even if token-level semantics are imperfect, the original
    // concrete statement cannot disappear during realization.
    const spanId = `reality-span-${index + 1}`;
    atoms.push({
      id: spanId,
      kind: "unknown",
      value: chunk,
      normalized: normalize(chunk),
      status: "observed",
      confidence: 1,
      salience: Math.max(0.5, Math.min(1, chunk.length / 120)),
      sourceText: chunk,
      evidence: [evidence(chunk)],
    });
    atomIds.push(spanId);

    for (const token of tokens) {
      const id = `reality-atom-${atoms.length + 1}`;
      atoms.push({
        id,
        kind: classifyAtom(token, chunk),
        value: token,
        normalized: normalize(token),
        status: "observed",
        confidence: 0.9,
        salience: ACTION_HINTS.has(token) ? 0.9 : 0.65,
        sourceText: chunk,
        evidence: [evidence(chunk)],
      });
      atomIds.push(id);
    }

    sequence.push({
      id: `reality-beat-${index + 1}`,
      order: index,
      sourceText: chunk,
      atomIds,
      required: true,
      confidence: 1,
      evidence: [evidence(chunk)],
    });
  });

  const relations: RealityRelation[] = sequence.slice(1).map((beat, index) => ({
    from: sequence[index].id,
    to: beat.id,
    relation: "occurs_before",
    confidence: 1,
    evidence: [evidence(`Prompt order: ${sequence[index].sourceText} → ${beat.sourceText}`)],
  }));

  return {
    version: 1,
    prompt: source,
    atoms,
    relations,
    sequence,
    observedText: chunks,
    unresolved: [],
    conservedAtomIds: sequence.map(beat => beat.atomIds[0]).filter(Boolean),
    invariants: {
      preserveObservedEvidence: true,
      preserveSequenceWhenExplicit: true,
      distinguishCreativeMaterial: true,
      neverInventObservedFact: true,
    },
  };
}

/**
 * Returns the fraction of conserved evidence spans represented by a candidate
 * realization. This is deliberately a hard semantic gate, not a prose score.
 */
export function scoreRealityCoverage(
  model: RealityModel,
  realization: string,
): number {
  const normalized = normalize(realization);
  if (!normalized) return 0;

  let covered = 0;
  for (const span of model.sequence) {
    const spanText = normalize(span.sourceText);
    if (spanText && normalized.includes(spanText)) {
      covered += 1;
      continue;
    }

    // If a creative rewrite changes syntax, require the high-salience content
    // atoms to survive rather than requiring verbatim text for every span.
    const atoms = model.atoms.filter(atom => span.atomIds.includes(atom.id));
    const required = atoms
      .filter(atom => atom.id.startsWith("reality-atom-") && atom.salience >= 0.65)
      .map(atom => atom.normalized)
      .filter(token => token.length >= 3);

    const tokenHits = required.filter(token => normalized.includes(token)).length;
    if (required.length > 0 && tokenHits / required.length >= 0.5) covered += 1;
  }

  return model.sequence.length === 0 ? 1 : covered / model.sequence.length;
}

export function assertRealityConserved(model: RealityModel, realization: string): void {
  const coverage = scoreRealityCoverage(model, realization);
  if (coverage < 0.8) {
    throw new Error(
      `Reality conservation failed: ${(coverage * 100).toFixed(0)}% evidence coverage; minimum 80% required`,
    );
  }
}
