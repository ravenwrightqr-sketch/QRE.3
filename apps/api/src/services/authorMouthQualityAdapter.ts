import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthLanguage } from "./authorMouthLanguageGate.js";
import type { MouthCandidate, MouthCandidateBeat } from "./authorMouthCandidateSearch.js";
import { buildGroundedFallbackCandidates } from "./authorMouthGroundedFallback.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizeEndpoint = (value: string): string => clean(value).replace(/[.!?]+$/g, "").toLowerCase();

function relationMode(beat: MouthCandidateBeat): boolean {
  const mode = clean(beat.realizationMode).toLowerCase();
  return ["reframe", "contrast", "turn", "callback", "reversal", "meaning"].some((value) => mode.includes(value));
}

function hookOrEstablishment(beat: MouthCandidateBeat): boolean {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  return attention === "hook" || role === "arrival" || role === "establish" || clean(beat.realizationMode).toLowerCase() === "direct_grounded_realization";
}

function payoffOrRelease(beat: MouthCandidateBeat): boolean {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  return attention === "payoff" || attention === "release" || role === "payoff" || role === "release";
}

function transitionCoverage(candidate: MouthCandidate, beat: MouthCandidateBeat): number {
  const required = [...(beat.eventIds ?? [])].filter(Boolean);
  if (!required.length) return 0.5;
  const supported = new Set(candidate.supportedEventIds);
  const hits = required.filter((id) => supported.has(id)).length;
  return Number(Math.max(0, Math.min(1, hits / Math.max(1, required.length))).toFixed(3));
}

function relationCoverage(candidate: MouthCandidate, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const required = [...(beat.eventIds ?? [])].filter(Boolean);
  if (required.length < 2) return 0.5;
  const supported = new Set(candidate.supportedEventIds);
  const relevantRelations = envelope.relations.filter((relation) => required.includes(relation.from) && required.includes(relation.to) && supported.has(relation.from) && supported.has(relation.to));
  if (!relevantRelations.length) return 0;
  const strongest = relevantRelations.reduce((best, relation) => Math.max(best, relation.strength), 0);
  return Number(Math.max(0, Math.min(1, 0.55 + Math.min(0.45, strongest * 0.45))).toFixed(3));
}

function semanticExecutionBaseline(candidate: MouthCandidate, beat: MouthCandidateBeat): number {
  if (hookOrEstablishment(beat)) return Number(Math.max(0, Math.min(1, Math.max(candidate.groundingScore, candidate.supportedEventIds.length > 0 ? 0.65 : 0.35))).toFixed(3));
  if (payoffOrRelease(beat)) return Number(Math.max(0, Math.min(1, Math.max(candidate.groundingScore * 0.8, candidate.supportedEventIds.length > 0 ? 0.55 : 0.3))).toFixed(3));
  return candidate.meaningScore;
}

function exactEndpoint(beat: MouthCandidateBeat, text: string, envelope: RealityEnvelope): boolean {
  if (!payoffOrRelease(beat)) return false;
  const endpointLabels = (beat.paysOff ?? [])
    .map((label) => envelope.events.find((event) => event.label === label)?.label ?? label)
    .map(clean)
    .filter(Boolean);
  if (!endpointLabels.length) return false;
  return endpointLabels.some((label) => normalizeEndpoint(text) === normalizeEndpoint(label));
}

export function adaptMouthCandidateQuality(input: { candidate: MouthCandidate; beat: MouthCandidateBeat; envelope: RealityEnvelope }): MouthCandidate {
  const { candidate, beat, envelope } = input;
  const language = evaluateMouthLanguage(candidate.text, envelope);
  const transition = transitionCoverage(candidate, beat);
  const relationEvidence = relationCoverage(candidate, beat, envelope);
  const relationRequired = relationMode(beat);
  const isHook = hookOrEstablishment(beat);
  const isPayoff = payoffOrRelease(beat);
  const endpointIsExact = exactEndpoint(beat, candidate.text, envelope);
  const baseMeaning = semanticExecutionBaseline(candidate, beat);

  const meaningPenalty = relationRequired && !isHook && transition < 1 ? (1 - transition) * 0.22 : 0;
  const endpointBonus = isPayoff && candidate.supportedEventIds.length > 0 ? (endpointIsExact ? 0.35 : 0.12) : 0;
  const naturalnessPenalty = language.fragmentRisk * 0.22 + language.keywordAssemblyRisk * 0.2 + language.analyticLanguageRisk * 0.2 + language.supportedActionRisk * 0.12 + language.supportedEntityRisk * 0.06;
  const relationMeaningBonus = relationRequired && transition >= 1 ? relationEvidence * 0.35 : 0;
  const adaptedMeaning = Number(Math.max(0, Math.min(1, baseMeaning + relationMeaningBonus + endpointBonus - meaningPenalty)).toFixed(3));
  const lexicalRisk = language.accepted ? Math.min(0.25, language.supportedActionRisk * 0.8 + language.supportedEntityRisk * 0.5) : Math.max(language.supportedActionRisk, language.supportedEntityRisk, candidate.inventionRisk);
  const adaptedInvention = Number(Math.max(0, Math.min(1, lexicalRisk)).toFixed(3));
  const score = Number(Math.max(0, Math.min(1, candidate.score * 0.42 + adaptedMeaning * 0.24 + language.naturalness * 0.17 + transition * 0.06 + relationEvidence * 0.05 + endpointBonus * 0.06 - naturalnessPenalty * 0.12 - meaningPenalty * 0.1)).toFixed(3));

  const reasons = [...candidate.reasons, ...language.reasons];
  if (relationRequired && !isHook && transition < 1) reasons.push("incomplete-transition-coverage");
  if (relationRequired && transition >= 1 && relationEvidence > 0) reasons.push("graph-relation-supported");
  if (isHook) reasons.push("hook-scored-as-establishment");
  if (isPayoff) reasons.push("payoff-endpoint-priority");
  if (endpointIsExact) reasons.push("non-negotiable-endpoint-exact");
  if (candidate.inventionRisk > 0.45 && language.accepted) reasons.push("raw-model-risk-overridden-by-evidence-gate");
  if (language.accepted === false) reasons.push("language-quality-gate");

  return {
    ...candidate,
    groundingScore: Number(Math.max(0, Math.min(1, candidate.groundingScore * 0.78 + language.naturalness * 0.12 + relationEvidence * 0.1)).toFixed(3)),
    meaningScore: adaptedMeaning,
    inventionRisk: adaptedInvention,
    score,
    reasons: [...new Set(reasons)],
  };
}

export function adaptMouthCandidatePool(input: { candidates: readonly MouthCandidate[]; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate[] {
  const fallback = buildGroundedFallbackCandidates({ beat: input.beat, envelope: input.envelope, priorTexts: input.priorTexts });
  const adapted = [...input.candidates, ...fallback]
    .map((candidate) => adaptMouthCandidateQuality({ candidate, beat: input.beat, envelope: input.envelope }))
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  return adapted.filter((candidate) => {
    const key = candidate.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}