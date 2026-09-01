/**
 * QRE CANONICAL MOUTH
 * ONE production language-realization boundary.
 *
 * FEEL IT. DO NOT EXPLAIN IT.
 * Reality freedom is low. Framing freedom is high.
 */
import {
  buildMouthCandidateMessages as buildBaseMessages,
  parseMouthCandidateBatch as parseBaseBatch,
  scoreMouthCandidate as scoreBaseCandidate,
} from "./authorMouthCandidateSearch.js";
import type { MouthCandidate, MouthCandidateBatch, MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens, buildCharacterProfile } from "./authorCharacterLensEngine.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

export type { MouthCandidate, MouthCandidateBatch, MouthCandidateBeat, MouthCandidateSelection } from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: import("@qre/contracts").AuthorDomainContext;
};

const activeLensByBeat = new WeakMap<object, string>();
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).split(/\s+/).filter(Boolean);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const normalize = (value: string): string => clean(value).replace(/[.!?]+$/g, "").toLowerCase();

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? "").map(clean).filter(Boolean))];
}
function tokenSet(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((token) => token.length >= 3));
}
function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}
function isPayoff(beat: MouthCandidateBeat): boolean {
  const a = clean(beat.attentionFunction).toLowerCase();
  const r = clean(beat.role).toLowerCase();
  return a === "payoff" || a === "release" || r === "payoff" || r === "release";
}
function isHook(beat: MouthCandidateBeat): boolean {
  const a = clean(beat.attentionFunction).toLowerCase();
  const r = clean(beat.role).toLowerCase();
  return a === "hook" || r === "arrival" || r === "establish";
}

/* A service role mentioned inside an event is not automatically a character. */
const ROLE_WORDS = /\b(?:groomer|barber|mechanic|housekeeper|cleaner|waiter|waitress|server|chef|driver|photographer|planner|officiant|vendor|host|manager|employee|staff|worker|therapist|doctor|nurse|teacher|agent|lawyer|judge|witness)\b/i;
function unstatedAgent(text: string, envelope: RealityEnvelope): boolean {
  if (!ROLE_WORDS.test(text)) return false;
  const explicitPeople = envelope.suppliedEntities.filter((value) => /\b(?:person|man|woman|child|friend|partner|owner|host|groomer|barber|mechanic|lawyer|judge|witness)\b/i.test(value));
  if (explicitPeople.length) return false;
  return /\b(?:the|a|an)\s+(?:groomer|barber|mechanic|housekeeper|cleaner|waiter|waitress|server|chef|driver|photographer|planner|officiant|vendor|host|manager|employee|staff|worker|therapist|doctor|nurse|teacher|agent|lawyer|judge|witness)\b/i.test(text);
}

function unsupportedConcrete(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  if (unstatedAgent(text, envelope)) return 1;
  const value = clean(text);
  const local = tokenSet(sourceLabels(beat, envelope).join(" "));
  const world = tokenSet([
    envelope.subject,
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
  ].join(" "));
  const candidate = tokenSet(value);
  if (overlap(candidate, local) >= 0.65 || overlap(candidate, world) >= 0.5) return 0;

  /* Physical reactions/staging are facts unless already grounded. */
  if (/\b(?:smile|smiled|laugh|laughed|walk|walked|move|moved|look|looked|touch|touched|hold|held|reach|reached|turn|turned|watch|watched|breathe|breathed|glance|glanced|stare|stared|wink|winked|nod|nodded|shrug|shrugged)\b/i.test(value)) return 0.9;
  return 0;
}

function explanationRisk(text: string): number {
  const value = clean(text);
  if (/\b(?:this means|which means|this shows|which shows|the meaning is|the point is|in other words|because this|the experience was|it was meaningful|it was important|the relationship|the viewer|the audience)\b/i.test(value)) return 1;
  if (/\b(?:feeling|emotion|significance|meaning|transformation|consequence)\b/i.test(value) && words(value).length > 8) return 0.65;
  return 0;
}

function feelNotExplain(text: string, beat: MouthCandidateBeat): number {
  const count = words(text).length;
  const brevity = count <= 7 ? 1 : count <= 11 ? 0.78 : 0.5;
  const payoff = isPayoff(beat) ? 0.18 : 0;
  const status = /\b(?:fab|fabulous|done|cleared|approved|complete|finished|upgrade|victory|win|winner|exit|peace|for now|temporary|temporarily|resumed|called|dapper|sharp)\b/i.test(clean(text)) ? 0.18 : 0;
  return metric(0.55 + brevity * 0.22 + payoff + status - explanationRisk(text) * 0.65);
}
function payoffReward(text: string, beat: MouthCandidateBeat): number {
  if (!isPayoff(beat)) return 0;
  const count = words(text).length;
  const compressed = count <= 2 ? 1 : count <= 5 ? 0.9 : count <= 8 ? 0.68 : 0.4;
  const status = /\b(?:fab|fabulous|done|cleared|approved|complete|finished|upgrade|victory|win|winner|exit|peace|for now|temporary|temporarily|resumed|called|dapper|sharp)\b/i.test(clean(text)) ? 0.35 : 0;
  const punctuation = /[.!?]$/.test(clean(text)) ? 0.16 : 0;
  return metric(compressed * 0.42 + status + punctuation);
}

function domainContext(context: MouthCandidateGenerationInput["domainContext"]): string {
  if (!context) return "";
  return [context.category, context.businessType, context.businessName, context.businessDescription, context.serviceType, context.serviceName, context.subjectKind, ...(context.knownCapabilities ?? []), ...(context.contextualSignals ?? [])].map(clean).filter(Boolean).join(" | ");
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  for (const beat of input.beats) activeLensByBeat.set(beat as object, clean(input.lens));
  const base = buildBaseMessages(input);
  const lens = classifyLens(input.lens);
  const character = buildCharacterProfile(input.envelope);
  const context = domainContext(input.domainContext);
  const doctrine = [
    "QRE MOUTH HAS ONE JOB: realize the already-approved cut.",
    "FEEL IT. DO NOT EXPLAIN IT.",
    "The approved movie already exists upstream. Do not re-plan it or summarize the movie.",
    "Generate materially different viewer-facing realizations: direct, compressed, and bold/strange when earned.",
    "Fragments, questions, status lines, verdicts, labels, callbacks, send-offs, and abrupt compression are valid.",
    "Prefer the smallest specific line that makes the accumulated meaning perceptible.",
    "Do not name an emotion, relationship, significance, or transformation when the cut can make it felt instead.",
    "A supplied role is context, not automatically a person in the scene. Never introduce the groomer, barber, mechanic, housekeeper, host, etc. unless that person is actually supplied as a participant.",
    "Do not invent physical reactions. A happy subject does not automatically smile, laugh, breathe, wink, nod, look, or move.",
    "Do not invent concrete events, objects, places, chronology, dialogue, motives, or people.",
    "Interpretation may personify or frame supplied reality when it is clearly an interpretation, not a new factual occurrence.",
    "For the final state, search for an earned status, verdict, afterimage, punchline, send-off, identity shift, or callback. Do not merely repeat the endpoint sentence.",
    "Examples are behavioral references only: Lawyer already called. / Eyebrow up. / Negotiations resumed. / Peace was temporary. Do not copy them as a template.",
    "The lens changes framing, timing, attitude, status, implication, and emotional pressure only. Reality does not change.",
    `ACTIVE LENS: ${lens.label || "NONE"}.`,
    `LENS BIASES: ${lens.framingBias.join(", ")}.`,
    `LENS PREFERENCES: ${lens.realizationPreferences.join(", ")}.`,
    `SUBJECT POSTURE: ${character.statusPosture}.`,
    `EMOTIONAL POSTURE: ${character.emotionalPosture}.`,
    context ? `DOMAIN CONTEXT: ${context}. Context is not fact.` : "",
  ].filter(Boolean).join(" ");
  return base.map((message) => ({ ...message, content: `${message.content}\n${doctrine}` }));
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  return parseBaseBatch(raw);
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  const base = scoreBaseCandidate(input);
  const unsupported = unsupportedConcrete(input.text, input.beat, input.envelope);
  const explanation = explanationRisk(input.text);
  const interpretation = evaluateMouthInterpretation({ text: input.text, sourceLabels: sourceLabels(input.beat, input.envelope), envelope: input.envelope, beat: input.beat });
  if (unsupported >= 0.9 || explanation >= 0.95) {
    return { ...base, inventionRisk: 1, forbiddenMoveRisk: 1, groundingScore: 0, obligationCoverage: 0, meaningScore: 0, transitionScore: 0, score: 0, supportedEventIds: [], reasons: [...new Set([...base.reasons, unsupported >= 0.9 ? "unsupported-concrete-realization" : "meaning-explained-instead-of-felt"]) ] };
  }
  const feel = feelNotExplain(input.text, input.beat);
  const payoff = payoffReward(input.text, input.beat);
  const semantic = interpretation.accepted ? 0.22 : 0;
  const novelty = metric(base.noveltyScore);
  const quality = metric(base.score * 0.44 + semantic + feel * 0.16 + payoff * 0.14 + novelty * 0.06);
  return {
    ...base,
    inventionRisk: Math.max(base.inventionRisk, interpretation.unsupportedConcreteRisk, unsupported),
    forbiddenMoveRisk: Math.max(base.forbiddenMoveRisk, unsupported),
    groundingScore: base.groundingScore,
    obligationCoverage: base.obligationCoverage,
    meaningScore: metric(base.meaningScore * 0.55 + semantic * 0.45 + feel * 0.12),
    transitionScore: metric(base.transitionScore * 0.55 + semantic * 0.35 + payoff * 0.1),
    noveltyScore: novelty,
    score: quality,
    reasons: [...new Set([...base.reasons, ...(interpretation.accepted ? ["approved-semantic-realization"] : []), ...(feel >= 0.72 ? ["feel-not-explain"] : []), ...(payoff >= 0.62 ? ["viewer-reward"] : [])])],
  };
}
