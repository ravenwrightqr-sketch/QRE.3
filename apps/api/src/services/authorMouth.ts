import type {
  AuthorDomainContext,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidatePool,
  MouthSequencePath,
  MouthBeamOptions,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";

/**
 * QRE ONE MOUTH
 *
 * This is the only production language-realization implementation.
 *
 * Authority order:
 *   1. reality safety
 *   2. semantic authorization from Cognition
 *   3. sequence function
 *   4. expressive quality
 *
 * Grounding is not authorization. Shared event IDs prove provenance;
 * they never by themselves permit an interpretation.
 */

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by",
  "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are",
  "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her",
  "its", "he", "she", "they", "them", "you", "we", "me", "very", "really", "just", "already",
  "apparently", "anyway", "perhaps", "maybe",
]);

const tokens = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'’-]+/g)
      .filter((token) => token.length >= 3),
  );

const meaningful = (value: string): Set<string> =>
  new Set([...tokens(value)].filter((token) => !STOP.has(token)));

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function wordCount(value: string): number {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set(
    (beat.eventIds ?? [])
      .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
      .map(clean)
      .filter(Boolean),
  )];
}

function worldSource(envelope: RealityEnvelope): string[] {
  return [
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].map(clean).filter(Boolean);
}

function semanticSource(beat: MouthCandidateBeat): string[] {
  const semantic = beat.semanticRealization;
  if (!semantic) return [];
  return [
    semantic.subject,
    semantic.before,
    semantic.after,
    semantic.callback,
    semantic.relation,
    semantic.realizationMove,
    semantic.creativeOpportunity,
    semantic.mechanism,
  ].map(clean).filter(Boolean);
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value);
}

function explicitConcreteRisk(text: string, source: string): number {
  const value = clean(text);
  if (!value) return 1;
  if (/\b(?:qre|cognition|planner|planning|candidate|semantic|trajectory|viewer|observer|objective|audience|mouth|author|beam|realization|payoff\s+dependency)\b/i.test(value)) return 1;
  if (/\b(?:this means|which means|the meaning is|the point is|the viewer|the audience|this proves|in other words)\b/i.test(value)) return 1;

  const candidate = meaningful(value);
  const supplied = meaningful(source);
  const sourceOverlap = overlap(candidate, supplied);
  const unsupportedAction = /\b(?:walk(?:ed|s)?|run(?:ned|s|ning)?|grab(?:bed|s|bing)?|kiss(?:ed|es|ing)?|hug(?:ged|s|ging)?|smil(?:ed|es|ing)?|laugh(?:ed|s|ing)?|talk(?:ed|s|ing)?|open(?:ed|s|ing)?|clos(?:ed|es|ing)?|enter(?:ed|s|ing)?|return(?:ed|s|ing)?|watch(?:ed|es|ing)?|look(?:ed|s|ing)?|move(?:d|s|ing)?|touch(?:ed|es|ing)?|throw|threw|catch|caught|dance(?:d|s|ing)?|drive|drove|push(?:ed|es|ing)?|pull(?:ed|s|ing)?|vanish(?:ed|es|ing)?|disappear(?:ed|s|ing)?)\b/i.test(value);
  if (unsupportedAction && sourceOverlap < 0.55) return 1;

  return 0;
}

function semanticAuthorization(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): { authorized: boolean; strength: number; reason: string } {
  const semantic = beat.semanticRealization;
  if (!semantic) return { authorized: false, strength: 0, reason: "no-approved-semantic-realization" };

  const evidenceIds = new Set(semantic.evidenceEventIds ?? []);
  const beatIds = (beat.eventIds ?? []).filter((id) => evidenceIds.has(id));
  if (!beatIds.length) {
    return { authorized: false, strength: 0, reason: "semantic-evidence-mismatch" };
  }

  const candidate = meaningful(text);
  const labels = sourceLabels(beat, envelope);
  const semanticText = semanticSource(beat).join(" ");
  const semanticTokens = meaningful(semanticText);
  const semanticOverlap = overlap(candidate, semanticTokens);

  const before = meaningful(clean(semantic.before));
  const after = meaningful(clean(semantic.after));
  const beforeOverlap = overlap(candidate, before);
  const afterOverlap = overlap(candidate, after);
  const relationOverlap = overlap(candidate, meaningful(clean(semantic.relation)));
  const callbackOverlap = overlap(candidate, meaningful(clean(semantic.callback)));
  const opportunityOverlap = overlap(candidate, meaningful(clean(semantic.creativeOpportunity)));

  const sourceHits = labels.filter((label) => overlap(candidate, meaningful(label)) >= 0.5).length;
  const crossSource = sourceHits >= 2;
  const beforeAfter = before.size > 0 && after.size > 0 && beforeOverlap >= 0.18 && afterOverlap >= 0.18;
  const semanticMove = relationOverlap >= 0.34 || callbackOverlap >= 0.45 || opportunityOverlap >= 0.34 || semanticOverlap >= 0.34;

  const strength = metric(
    (beforeAfter ? 0.38 : 0) +
      (crossSource ? 0.34 : 0) +
      (semanticMove ? 0.28 : 0),
  );

  if (!beforeAfter && !crossSource && !semanticMove) {
    return { authorized: false, strength, reason: "candidate-does-not-express-approved-meaning" };
  }

  return { authorized: true, strength, reason: "approved-semantic-realization" };
}

function evaluateCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[],
): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const literal = exactSource(value, labels);
  const sourceText = labels.join(" ");
  const wholeText = worldSource(envelope).join(" ");
  const grounding = metric(
    overlap(meaningful(value), meaningful(sourceText)) * 0.75 +
      overlap(meaningful(value), meaningful(wholeText)) * 0.25,
  );
  const semantic = semanticAuthorization(value, beat, envelope);
  const invention = metric(explicitConcreteRisk(value, wholeText));

  const novelty = priorTexts.length
    ? metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0))
    : 1;

  const short = wordCount(value) >= 2 && wordCount(value) <= 12;
  const multiEventSupport = labels.length > 1
    ? labels.filter((label) => overlap(meaningful(value), meaningful(label)) >= 0.5).length >= 2
    : false;

  const score = literal
    ? metric(0.72 + grounding * 0.18 + novelty * 0.1)
    : metric(
        semantic.authorized * 0.48 +
          semantic.strength * 0.2 +
          grounding * 0.12 +
          novelty * 0.08 +
          (multiEventSupport ? 0.07 : 0) +
          (short ? 0.05 : 0) -
          invention * 0.75,
      );

  const reasons: string[] = [];
  if (literal) reasons.push("literal-source-restatement");
  if (grounding >= 0.24) reasons.push("event-grounded");
  if (semantic.authorized) reasons.push(semantic.reason);
  if (!semantic.authorized && !literal) reasons.push(semantic.reason);
  if (multiEventSupport) reasons.push("cross-event-expression");
  if (short) reasons.push("human-sized-cut");
  if (invention > 0) reasons.push("unsupported-concrete-risk");

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds: grounding >= 0.24 && invention < 0.9 ? [...(beat.eventIds ?? [])] : [],
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: grounding,
    meaningScore: metric(semantic.strength),
    observerDiscoveryScore: metric(semantic.authorized ? Math.max(semantic.strength, 0.4) : 0),
    transitionScore: metric(beat.viewerState?.stateShift ?? 0.4),
    obligationCoverage: metric(literal ? 1 : semantic.authorized ? 0.7 + semantic.strength * 0.3 : 0),
    relationContractScore: metric(beat.relationKinds?.length ? 0.85 : 0.35),
    forbiddenMoveRisk: invention,
    cohesionScore: metric(0.55 + semantic.strength * 0.35 + grounding * 0.1),
    noveltyScore: novelty,
    compressionScore: short ? 0.95 : 0.65,
    inventionRisk: invention,
    repetitionRisk: 1 - novelty,
    collageRisk: multiEventSupport ? 0 : 0.2,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH. Cognition has already decided the reality, movie, semantic meaning, relations, viewer movement, and beat order.",
    "Your only job is language realization.",
    "Reality freedom is LOW. Framing freedom is HIGH.",
    "Do not invent any person, object, place, physical action, physical relation, reaction, dialogue, event, or chronology.",
    "Grounding alone is not permission to be creative. Creative language must express the approved semantic realization for its beat.",
    "When several supplied facts share one approved semantic turn, make the viewer feel the relationship between them rather than captioning each fact separately.",
    "Use the supplied lens only to change framing, attitude, rhythm, irony, status, suspense, tenderness, absurdity, or genre coloration. Never use a lens to add facts.",
    "Never explain the thesis. Cause discovery.",
    "Never write generic atmospheric fragments such as 'A flash of blue', 'A tremor', 'Sudden stillness', 'A final flourish', or similar filler.",
    "Never merely rename an event into a prettier noun such as bath -> cleansing or theft -> acquisition.",
    "Prefer a human-sized line with a concrete relationship, status turn, contrast, consequence, callback, or recontextualization when the approved semantic evidence supports one.",
    "If the beat has no approved semantic turn, use the supplied fact literally rather than inventing an interpretation.",
  ].join(" ");
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  const lens = classifyLens(input.lens);
  const reality = worldSource(input.envelope);
  const beatPayload = input.beats.map((beat) => ({
    order: beat.order,
    role: beat.role,
    evidence: sourceLabels(beat, input.envelope),
    eventIds: beat.eventIds ?? [],
    semanticRealization: beat.semanticRealization ?? null,
    observerExperience: beat.observerExperience ?? null,
    change: beat.change,
    next: beat.next,
    obligations: beat.obligations ?? [],
    forbiddenMoves: beat.forbiddenMoves ?? [],
  }));

  return [
    { role: "system", content: buildSystemPrompt() },
    {
      role: "user",
      content: JSON.stringify({
        instruction: "Return exactly 3 candidate cuts for every beat. Each cut must realize the approved meaning, not caption the source event. Use literal source text only as the fallback when the beat has no usable semantic realization.",
        lens: input.lens || "AUTO",
        lensProfile: lens,
        domainContext: input.domainContext ?? null,
        reality,
        beats: beatPayload,
        priorTexts: input.priorTexts ?? [],
        outputSchema: {
          variantsByBeat: [
            { order: 1, variants: ["candidate", "candidate", "candidate"] },
          ],
        },
      }, null, 2),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const cleaned = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat)) return undefined;

    const variantsByBeat = parsed.variantsByBeat
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        order: Number(item.order),
        variants: Array.isArray(item.variants)
          ? item.variants.map(clean).filter(Boolean).slice(0, 3)
          : [],
      }))
      .filter((item) => Number.isFinite(item.order) && item.order > 0 && item.variants.length > 0);

    return variantsByBeat.length ? { variantsByBeat } : undefined;
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  return evaluateCandidate(
    input.text,
    input.beat,
    input.envelope,
    input.priorTexts ?? [],
  );
}

export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  if (!clean(candidate.text)) return false;
  if (candidate.inventionRisk >= 0.9 || candidate.forbiddenMoveRisk >= 0.9) return false;
  if (candidate.endpointExactness >= 0.999) return true;
  return candidate.reasons.includes("approved-semantic-realization");
}

function lexicalNovelty(text: string, prior: readonly MouthCandidate[]): number {
  if (!prior.length) return 1;
  const current = meaningful(text);
  return metric(1 - Math.max(...prior.map((candidate) => overlap(current, meaningful(candidate.text))), 0));
}

function pathIncrement(
  candidate: MouthCandidate,
  prior: readonly MouthCandidate[],
  pool: MouthCandidatePool,
): number {
  const state = pool.viewerState;
  const novelty = lexicalNovelty(candidate.text, prior);
  const stateFit = metric(
    candidate.transitionScore * 0.45 +
      state.stateShift * 0.2 +
      state.curiosityPressure * 0.15 +
      state.predictionError * 0.1 +
      candidate.observerDiscoveryScore * 0.1,
  );
  const literalPenalty = candidate.endpointExactness >= 0.999 ? 0.08 : 0;
  const semanticBonus = candidate.reasons.includes("approved-semantic-realization") ? 0.12 : 0;
  return metric(
    candidate.score * 0.42 +
      stateFit * 0.24 +
      candidate.meaningScore * 0.12 +
      candidate.obligationCoverage * 0.06 +
      novelty * 0.06 +
      candidate.cohesionScore * 0.04 +
      semanticBonus -
      literalPenalty,
  );
}

function dedupe(candidates: readonly MouthCandidate[]): MouthCandidate[] {
  const seen = new Set<string>();
  const result: MouthCandidate[] = [];
  for (const candidate of candidates) {
    const key = clean(candidate.text).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };

  const width = Math.max(1, Math.floor(options.width ?? 8));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  let paths: Array<{ candidates: MouthCandidate[]; score: number }> = [{ candidates: [], score: 0 }];

  for (const pool of ordered) {
    let eligible = dedupe(pool.candidates).filter(isAuthorizedMouthCandidate);

    // Literal source is the explicit emergency rail. Do not synthesize a fake
    // interpretation when the semantic gate has no winner for this beat.
    if (!eligible.some((candidate) => candidate.reasons.includes("approved-semantic-realization"))) {
      eligible = eligible.filter((candidate) => candidate.endpointExactness >= 0.999);
    }

    if (!eligible.length) return { candidates: [], texts: [], score: 0 };

    eligible.sort((a, b) => b.score - a.score);
    eligible = eligible.slice(0, Math.max(perBeat, width));

    const expanded: Array<{ candidates: MouthCandidate[]; score: number }> = [];
    for (const path of paths) {
      for (const candidate of eligible) {
        if (path.candidates.some((prior) => clean(prior.text).toLowerCase() === clean(candidate.text).toLowerCase())) continue;
        expanded.push({
          candidates: [...path.candidates, candidate],
          score: path.score + pathIncrement(candidate, path.candidates, pool),
        });
      }
    }

    expanded.sort((a, b) => {
      const aMean = a.candidates.reduce((sum, candidate) => sum + candidate.meaningScore, 0) / Math.max(1, a.candidates.length);
      const bMean = b.candidates.reduce((sum, candidate) => sum + candidate.meaningScore, 0) / Math.max(1, b.candidates.length);
      return bMean - aMean || b.score - a.score;
    });
    paths = expanded.slice(0, width);
  }

  const best = paths.sort((a, b) => b.score - a.score)[0];
  if (!best) return { candidates: [], texts: [], score: 0 };

  return {
    candidates: best.candidates,
    texts: best.candidates.map((candidate) => candidate.text),
    score: metric(best.score / Math.max(1, best.candidates.length)),
  };
}
