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
  const required = [...(beat.eventIds ?? [])].filter(Boolean);
  if (!required.length) return isHook(beat) ? 1 : 0.5;
  const supported = new Set(candidate.supportedEventIds);
  const hits = required.filter((id) => supported.has(id)).length;
  return Math.max(0, Math.min(1, hits / Math.max(1, required.length)));
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

function hardInvalid(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): boolean {
  const language = evaluateMouthLanguage(candidate.text, envelope);

  if (!language.accepted) return true;
  if (isPayoff(beat) && !exactEndpoint(beat, candidate.text)) return true;
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
  const transition = payoff ? 1 : hook ? 1 : transitionCoverage(candidate, beat);
  const relation = payoff ? 1 : relationCoverage(candidate, beat, envelope);

  const attention = evaluateAttentionCut({
    text: candidate.text,
    beat,
    envelope,
  });

  const meaning = payoff
    ? 1
    : hook
      ? Math.max(candidate.meaningScore, candidate.groundingScore)
      : Math.max(
          candidate.meaningScore,
          transition * 0.45 + relation * 0.3 + candidate.groundingScore * 0.25,
        );

  const invention = language.accepted
    ? Math.min(candidate.inventionRisk, 0.35)
    : Math.max(candidate.inventionRisk, language.supportedActionRisk, language.supportedEntityRisk);

  const endpointBonus = endpoint ? 0.35 : 0;
  const semanticQuality =
    meaning * 0.32 +
    transition * 0.24 +
    relation * 0.13 +
    language.naturalness * 0.11 +
    attention.score * 0.12 +
    candidate.compressionScore * 0.08;

  const score = payoff
    ? Math.max(0.9, Math.min(1, 0.92 + language.naturalness * 0.08))
    : Math.max(
        0,
        Math.min(
          1,
          candidate.score * 0.4 +
            semanticQuality * 0.5 +
            endpointBonus * 0.1 -
            invention * 0.08,
        ),
      );

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
    reasons.add("payoff-endpoint-priority");
    if (endpoint) reasons.add("non-negotiable-endpoint-exact");
    reasons.delete("weak-meaning-execution");
    reasons.delete("weak-meaning-transition");
    reasons.delete("weak-obligation-coverage");
    reasons.delete("weak-relation-contract");
  }

  return {
    ...candidate,
    groundingScore: Math.max(candidate.groundingScore, language.accepted ? 0.42 : 0),
    meaningScore: Number(meaning.toFixed(3)),
    transitionScore: Number(transition.toFixed(3)),
    obligationCoverage: Number((payoff || hook ? 1 : Math.max(candidate.obligationCoverage, 0.5)).toFixed(3)),
    relationContractScore: Number((payoff || hook ? 1 : Math.max(candidate.relationContractScore, relation)).toFixed(3)),
    inventionRisk: Number(Math.max(0, Math.min(1, invention)).toFixed(3)),
    compressionScore: Number(Math.max(candidate.compressionScore, attention.density).toFixed(3)),
    score: Number(Math.max(0, Math.min(1, score)).toFixed(3)),
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
    .filter((candidate) => {
      const language = evaluateMouthLanguage(candidate.text, input.envelope);
      return language.accepted && (!isPayoff(input.beat) || exactEndpoint(input.beat, candidate.text));
    })
    .sort((a, b) => b.score - a.score);
}
