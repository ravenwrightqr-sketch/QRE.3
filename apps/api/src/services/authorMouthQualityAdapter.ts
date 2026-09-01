import type { RealityRelation } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthLanguage } from "./authorMouthLanguageGate.js";
import type {
  MouthCandidate,
  MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";
import { buildGroundedFallbackCandidates } from "./authorMouthGroundedFallback.js";
import {
  evaluateAttentionCut,
} from "./authorMouthAttentionGate.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalize = (value: string): string =>
  clean(value).replace(/[.!?]+$/g, "").toLowerCase();

function isHook(beat: MouthCandidateBeat): boolean {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const mode = clean(beat.realizationMode).toLowerCase();
  return (
    attention === "hook" ||
    role === "arrival" ||
    role === "establish" ||
    mode === "direct_grounded_realization"
  );
}

function isPayoff(beat: MouthCandidateBeat): boolean {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  return (
    attention === "payoff" ||
    attention === "release" ||
    role === "payoff" ||
    role === "release"
  );
}

function exactEndpoint(
  beat: MouthCandidateBeat,
  text: string,
): boolean {
  if (!isPayoff(beat)) return false;
  const endpoint = clean(beat.paysOff?.[0] ?? "");
  return Boolean(endpoint) && normalize(endpoint) === normalize(text);
}

function transitionCoverage(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
): number {
  const required = [
    ...(beat.eventIds ?? []),
  ].filter(Boolean);

  if (!required.length) {
    return isHook(beat) ? 1 : 0.5;
  }

  const supported = new Set(
    candidate.supportedEventIds,
  );

  const hits = required.filter(
    (id) => supported.has(id),
  ).length;

  const semanticMode = clean(
    [
      beat.realizationMode,
      beat.creativeMove,
      beat.attentionFunction,
      beat.role,
      ...(beat.relationKinds ?? []),
    ].join(" "),
  ).toLowerCase();

  const isMultiSignal =
    /\b(?:contrast|contrasts|changes|reframe|recontextualize|turn|callback|reversal|consequence|escalat(?:e|ion)|payoff|release)\b/i.test(
      semanticMode,
    );

  const requiredSignals = isMultiSignal
    ? Math.min(2, required.length)
    : required.length;

  return Math.max(
    0,
    Math.min(
      1,
      hits / Math.max(1, requiredSignals),
    ),
  );
}

function relationCoverage(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const kinds = new Set<RealityRelation["kind"]>(
    (beat.relationKinds ?? [])
      .map(clean)
      .filter(Boolean)
      .filter((kind): kind is RealityRelation["kind"] =>
        [
          "before",
          "after",
          "causes",
          "changes",
          "contrasts",
          "repeats",
          "belongs_to",
          "involves",
          "recontextualizes",
          "converges",
        ].includes(kind as RealityRelation["kind"]),
      ),
  );
  if (!kinds.size) return 0.5;

  const supported = new Set(candidate.supportedEventIds);
  const actual = new Set<RealityRelation["kind"]>(
    envelope.relations
      .filter((relation) => supported.has(relation.from) && supported.has(relation.to))
      .map((relation) => relation.kind),
  );

  let hits = 0;
  for (const kind of kinds) if (actual.has(kind)) hits += 1;
  return Math.max(0, Math.min(1, hits / kinds.size));
}

function endpointSemanticSupport(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
): number {
  if (!isPayoff(beat)) return 0;
  const endpoint = clean(beat.paysOff?.[0] ?? "");
  if (!endpoint) return 0;

  const candidateTokens = new Set(clean(candidate.text).toLowerCase().split(/[^a-z0-9'-]+/i).filter((token) => token.length >= 3));
  const endpointTokens = new Set(endpoint.toLowerCase().split(/[^a-z0-9'-]+/i).filter((token) => token.length >= 3));
  if (!candidateTokens.size || !endpointTokens.size) return 0;

  let overlap = 0;
  for (const token of candidateTokens) if (endpointTokens.has(token)) overlap += 1;
  const lexical = overlap / endpointTokens.size;

  const semanticOwnership = candidate.supportedEventIds.length > 0 ||
    candidate.reasons.includes("semantic-anchor-confirmed") ||
    candidate.reasons.includes("approved-beat-authority") ||
    candidate.reasons.includes("approved-semantic-realization");

  return Math.max(semanticOwnership ? 0.72 : 0, lexical * 0.28);
}

function creativePayoffSignal(candidate: MouthCandidate, beat: MouthCandidateBeat): number {
  if (!isPayoff(beat)) return 0;
  const text = clean(candidate.text);
  const count = text.split(/\s+/).filter(Boolean).length;
  const compressed = count <= 3 ? 1 : count <= 6 ? 0.88 : count <= 10 ? 0.58 : 0.28;
  const fragment = !/^(?:the|a|an|he|she|they|it|we|i|you)\b/i.test(text);
  const statusLike = /\b(?:fab(?:ulous)?|fabulous|done|ready|complete|cleared|approved|official|upgrade|mission|level|round|victory|made\s+it|showtime|finished|proud|happy|good|great)\b/i.test(text);
  return Math.min(1, compressed * 0.5 + (fragment ? 0.24 : 0) + (statusLike ? 0.26 : 0));
}

function hardInvalid(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): boolean {
  const language = evaluateMouthLanguage(candidate.text, envelope);

  if (!language.accepted) return true;
  if (isPayoff(beat)) {
    const endpointSupport = endpointSemanticSupport(candidate, beat);
    if (endpointSupport < 0.35) return true;
  }
  if (candidate.inventionRisk > 0.45 && !isHook(beat)) return true;
  if (candidate.forbiddenMoveRisk > 0.45) return true;
  if (candidate.collageRisk > 0.7) return true;
  return false;
}

export function adaptMouthCandidateQuality(input: {
  candidate: MouthCandidate;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
}): MouthCandidate {
  const { candidate, beat, envelope } = input;
  const language = evaluateMouthLanguage(candidate.text, envelope);
  const hook = isHook(beat);
  const payoff = isPayoff(beat);
  const endpoint = exactEndpoint(beat, candidate.text);
  const transition = transitionCoverage(candidate, beat);
  const relation = relationCoverage(candidate, beat, envelope);
  const attention = evaluateAttentionCut({
    text: candidate.text,
    beat,
    envelope,
  });

  const meaning = Math.max(0, Math.min(1,
    candidate.meaningScore * 0.46 +
    transition * 0.2 +
    relation * 0.12 +
    attention.score * 0.12 +
    language.naturalness * 0.1,
  ));

  const endpointSupport = endpointSemanticSupport(candidate, beat);
  const payoffCreativity = creativePayoffSignal(candidate, beat);

  const semanticQuality = Math.max(0, Math.min(1,
    meaning * 0.3 +
    transition * 0.18 +
    relation * 0.1 +
    language.naturalness * 0.12 +
    attention.score * 0.12 +
    candidate.compressionScore * 0.06 +
    endpointSupport * (payoff ? 0.08 : 0) +
    payoffCreativity * (payoff ? 0.04 : 0),
  ));

  const invention = Math.max(
    candidate.inventionRisk,
    language.supportedActionRisk,
    language.supportedEntityRisk,
  );

  /*
   * The endpoint is an obligation, not a sentence template.
   * Exact wording gets a useful bonus; semantically owned creative wording
   * is allowed to beat it when it produces the stronger human-facing cut.
   */
  const exactBonus = endpoint ? 0.12 : 0;
  const score = Math.max(0, Math.min(1,
    candidate.score * 0.28 +
    semanticQuality * 0.5 +
    endpointSupport * (payoff ? 0.1 : 0) +
    exactBonus +
    payoffCreativity * (payoff ? 0.08 : 0) -
    invention * 0.08,
  ));

  const reasons = new Set([
    ...candidate.reasons,
    ...language.reasons,
    ...attention.reasons,
  ]);

  if (hook) {
    reasons.add("hook-scored-as-establishment");
    reasons.delete("weak-meaning-transition");
    reasons.delete("weak-obligation-coverage");
    reasons.delete("weak-relation-contract");
  }

  if (payoff) {
    reasons.add("payoff-endpoint-preserved");
    reasons.delete("weak-meaning-execution");
    reasons.delete("weak-meaning-transition");
    reasons.delete("weak-obligation-coverage");
    reasons.delete("weak-relation-contract");
    if (endpoint) reasons.add("payoff-endpoint-exact");
    else reasons.add("payoff-rephrased-endpoint");
  }

  return {
    ...candidate,
    groundingScore: Number(candidate.groundingScore.toFixed(3)),
    meaningScore: Number(meaning.toFixed(3)),
    transitionScore: Number(transition.toFixed(3)),
    obligationCoverage: Number(transition.toFixed(3)),
    relationContractScore: Number(relation.toFixed(3)),
    inventionRisk: Number(Math.max(0, Math.min(1, invention)).toFixed(3)),
    compressionScore: Number(Math.max(candidate.compressionScore, attention.density).toFixed(3)),
    score: Number(score.toFixed(3)),
    reasons: [...reasons],
  };
}

export function adaptMouthCandidatePool(input: {
  candidates: readonly MouthCandidate[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate[] {
  const fallback = buildGroundedFallbackCandidates({
    beat: input.beat,
    envelope: input.envelope,
    priorTexts: input.priorTexts,
  });

  const adapted = [
    ...input.candidates,
    ...fallback,
  ].map((candidate) =>
    adaptMouthCandidateQuality({
      candidate,
      beat: input.beat,
      envelope: input.envelope,
    }),
  );

  const seen = new Set<string>();
  const deduped = adapted.filter((candidate) => {
    const key = normalize(candidate.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const valid = deduped
    .filter((candidate) => !hardInvalid(candidate, input.beat, input.envelope))
    .sort((a, b) => b.score - a.score);

  if (valid.length) return valid;

  return deduped
    .filter((candidate) => evaluateMouthLanguage(candidate.text, input.envelope).accepted)
    .sort((a, b) => b.score - a.score);
}
