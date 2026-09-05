import type {
  AuthorDomainContext,
  MouthBeamOptions,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidatePool,
  MouthSequencePath,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";
import { evaluateRealizationBoundary } from "./authorRealizationBoundary.js";
import { buildMouthRealizationAuthority } from "./authorMouthRealizationAuthority.js";
import { buildCreativeLensBrief } from "./authorCreativeLensBrief.js";

/** ONE PRODUCTION MOUTH. Model writes language; QRE governs reality. */
export type { MouthCandidateBeat } from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const uniqueStrings = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const wordCount = (value: string): number => clean(value).split(/\s+/).filter(Boolean).length;

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through",
  "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be",
  "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them",
  "you", "we", "me", "very", "really", "just", "already", "apparently", "somehow", "perhaps", "maybe",
]);

const tokens = (value: string): Set<string> =>
  new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));
const meaningful = (value: string): Set<string> => new Set([...tokens(value)].filter((token) => !STOP.has(token)));
const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};

function semantic(beat: MouthCandidateBeat) { return beat.semanticRealization; }

function scopedEventIds(beat: MouthCandidateBeat): string[] {
  const s = semantic(beat);
  const beatIds = uniqueStrings(beat.eventIds ?? []);
  if (!s) return beatIds;
  const approved = uniqueStrings([
    ...(s.evidenceEventIds ?? []),
    ...(s.beforeEventIds ?? []),
    ...(s.afterEventIds ?? []),
    ...(s.callback?.eventIds ?? []),
  ]).filter((id) => beatIds.includes(id));
  return approved.length ? approved : beatIds;
}

function localEvidence(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const ids = new Set(scopedEventIds(beat));
  const events = envelope.events.filter((event) => ids.has(event.id));
  const structures = envelope.eventStructure.filter((structure) => ids.has(structure.eventId));
  return uniqueStrings([
    ...events.flatMap((event) => [event.label, ...(event.entities ?? [])]),
    ...structures.flatMap((structure) => [
      ...structure.subjects,
      ...structure.actions,
      ...structure.objects,
      ...structure.states,
      ...structure.temporalMarkers,
      ...structure.sensoryMarkers,
    ]),
  ]).slice(0, 20);
}

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const ids = new Set(scopedEventIds(beat));
  return uniqueStrings(envelope.events.filter((event) => ids.has(event.id)).map((event) => event.label));
}

function relationKind(beat: MouthCandidateBeat): string {
  return clean(semantic(beat)?.relation?.kind).toLowerCase();
}

function semanticAuthorityText(beat: MouthCandidateBeat): string {
  const s = semantic(beat);
  const observer = beat.observerExperience;
  return clean([
    s?.relation?.kind,
    s?.mechanism,
    s?.before,
    s?.after,
    s?.realizationMove,
    s?.creativeOpportunity,
    s?.feltEffect,
    s?.viewerShift,
    s?.languageAim,
    observer?.feltEffect,
    observer?.viewerShift,
    observer?.realizationDirection,
  ].join(" "));
}

function requiredConcreteAnchors(beat: MouthCandidateBeat): string[] {
  if (beat.realizationObligations?.endpointPolicy.mode !== "preserve") return [];
  return uniqueStrings(beat.realizationObligations.requiredAnchors).slice(0, 8);
}

export function preservesSubjectIdentity(text: string, subject: string): boolean {
  const value = clean(text);
  const suppliedSubject = clean(subject);
  if (!value || !suppliedSubject) return false;
  const subjectTokens = meaningful(suppliedSubject);
  const candidateTokens = meaningful(value);
  if (!subjectTokens.size || !candidateTokens.size) return false;
  const conflictingActor = /^(?:he|she|they|we|you|someone|somebody|a man|a woman|another person)\b/i.test(value);
  return !conflictingActor && overlap(subjectTokens, candidateTokens) >= 0.5;
}

function preservesSubjectAnchor(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  if (beat.order !== 1) return true;
  return preservesSubjectIdentity(text, envelope.subject);
}

function identityRecoveryText(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): string | undefined {
  if (beat.order !== 1) return undefined;
  const value = clean(text);
  const subject = clean(envelope.subject);
  if (!value || !subject || preservesSubjectAnchor(value, beat, envelope)) return undefined;
  return `${subject} — ${value}`;
}

function preservesRequiredAnchor(text: string, beat: MouthCandidateBeat): boolean {
  const anchors = requiredConcreteAnchors(beat);
  if (!anchors.length) return true;
  const candidate = meaningful(text);
  return anchors.some((anchor) => {
    const anchorTokens = meaningful(anchor);
    return anchorTokens.size > 0 && (overlap(anchorTokens, candidate) >= 0.5 || [...anchorTokens].some((token) => token.length >= 4 && candidate.has(token)));
  });
}

function genericRisk(text: string): number {
  return /\b(?:special moment|what a day|magical|magic happens|journey|new chapter|happy ending|everything changed|unforgettable|beautiful moment|meaningful moment|good times|making memories|cherished memories|a day to remember|ready for anything|full of joy|cinematic|like a movie|in that moment|speaks volumes|the truth is revealed|new beginning|such a special|wonderful experience)\b/i.test(clean(text)) ? 1 : 0;
}

function processRisk(text: string): number {
  return /\b(?:viewer|audience|beat|strategy|cognition|frontier|narrative|storytelling|theme|realization|payoff|information|evidence|semantic|trajectory|candidate|mouth|author|planner)\b/i.test(clean(text)) ? 1 : 0;
}

function explanationRisk(text: string): number {
  let hits = 0;
  for (const pattern of [
    /\b(?:because|therefore|thus|hence|due to|as a result|thanks to)\b/i,
    /\b(?:the reason|the cause|the point|the meaning|the secret|the ingredient)\b/i,
    /\b(?:which made|which caused|which meant|that's how|that is how)\b/i,
    /\b(?:this means|which means|in other words)\b/i,
  ]) if (pattern.test(clean(text))) hits += 1;
  return metric(hits / 2);
}

function evidenceCoverage(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const candidate = meaningful(text);
  const evidence = localEvidence(beat, envelope);
  if (!candidate.size || !evidence.length) return 0;
  const units = evidence.map(meaningful).filter((unit) => unit.size);
  const bestUnit = Math.max(...units.map((unit) => overlap(unit, candidate)), 0);
  const total = overlap(new Set([...units.flatMap((unit) => [...unit])]), candidate);
  return metric(bestUnit * 0.6 + total * 0.4);
}

function semanticCoverage(text: string, beat: MouthCandidateBeat): number {
  const authority = meaningful(semanticAuthorityText(beat));
  return authority.size ? overlap(authority, meaningful(text)) : 0;
}

function realizationLift(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const candidate = meaningful(text);
  if (!candidate.size) return 0;
  const evidence = meaningful(localEvidence(beat, envelope).join(" "));
  const authority = meaningful(semanticAuthorityText(beat));
  const evidenceOverlap = overlap(evidence, candidate);
  const authorityOverlap = overlap(authority, candidate);
  const novelty = metric(1 - evidenceOverlap);
  const structuralTurn = metric(
    (/[.!?;:]/.test(clean(text)) ? 0.18 : 0) +
    (/\b(?:but|yet|and|then|while|only|always|never|again|still)\b/i.test(clean(text)) ? 0.16 : 0) +
    (authorityOverlap >= 0.08 ? 0.34 : 0) +
    (evidenceOverlap >= 0.15 ? 0.18 : 0) +
    (novelty >= 0.2 ? 0.14 : 0),
  );
  return metric(novelty * 0.2 + authorityOverlap * 0.48 + structuralTurn * 0.32);
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value);
}

function paraphraseRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  if (!labels.length || exactSource(value, labels)) return 0;
  const candidate = meaningful(value);
  const evidence = localEvidence(beat, envelope).map(meaningful).filter((unit) => unit.size);
  const bestUnitCoverage = Math.max(...evidence.map((unit) => overlap(candidate, unit)), 0);
  const sourceCoverage = overlap(candidate, meaningful(localEvidence(beat, envelope).join(" ")));
  const lift = realizationLift(value, beat, envelope);
  return metric((bestUnitCoverage * 0.58 + sourceCoverage * 0.22 + (semanticCoverage(value, beat) < 0.05 ? 0.2 : 0)) * (1 - Math.min(0.75, lift)));
}

function fragmentRisk(text: string): number {
  const value = clean(text);
  if (!value || /^[a-z]/.test(value)) return 1;
  if (/^(?:which|that|because|although|while|when|since|if)\b/i.test(value)) return 0.95;
  if (/(?:,|:|;)\s*$/.test(value)) return 0.95;
  return 0;
}

function compressionScore(text: string): number {
  const count = wordCount(text);
  if (count <= 0) return 0;
  if (count <= 12) return 0.98;
  if (count <= 20) return 0.9;
  if (count <= 32) return 0.78;
  if (count <= 48) return 0.62;
  return 0.45;
}

function evaluateCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[],
  recovery = false,
): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const literal = exactSource(value, labels);
  const semanticScore = semanticCoverage(value, beat);
  const evidenceScore = evidenceCoverage(value, beat, envelope);
  const lift = realizationLift(value, beat, envelope);
  const generic = genericRisk(value);
  const process = processRisk(value);
  const explanation = explanationRisk(value);
  const fragment = fragmentRisk(value);
  const paraphrase = paraphraseRisk(value, beat, envelope);
  const anchorPreserved = preservesRequiredAnchor(value, beat);
  const subjectAnchorPreserved = preservesSubjectAnchor(value, beat, envelope);
  const semanticApproved = Boolean(semantic(beat));
  const feltAuthority = Boolean(
    semantic(beat)?.feltEffect ||
    semantic(beat)?.viewerShift ||
    semantic(beat)?.languageAim ||
    beat.observerExperience?.feltEffect ||
    beat.observerExperience?.viewerShift ||
    beat.observerExperience?.realizationDirection,
  );
  const relation = relationKind(beat);
  const openingEstablishing = beat.order === 1 && (/establish|opening|introduc/i.test(clean(beat.role)) || Boolean(semantic(beat)));
  const relationalExecution = semanticApproved && (
    lift >= 0.26 ||
    semanticScore >= 0.04 ||
    (evidenceScore >= 0.15 && relation.length > 0)
  );
  const groundedCreative = evidenceScore >= 0.12 || semanticScore >= 0.04 || lift >= 0.22;
  const explanationForbidden = beat.realizationObligations?.explanationPolicy.forbidden ?? beat.observerExperience?.explanationForbidden ?? false;
  const explanationPenalty = explanationForbidden ? explanation : explanation * 0.3;
  const priorNovelty = priorTexts.length === 0 ? 1 : metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0));
  const compression = compressionScore(value);
  const grounding = metric(evidenceScore * 0.62 + semanticScore * 0.28 + (preservesSubjectIdentity(value, envelope.subject) ? 0.1 : 0));

  const creative = metric(
    grounding * 0.2 +
    lift * 0.27 +
    (relationalExecution ? 0.22 : 0) +
    (groundedCreative ? 0.09 : 0) +
    (feltAuthority ? 0.08 : 0) +
    priorNovelty * 0.04 +
    compression * 0.07 +
    (anchorPreserved ? 0.04 : -0.18) +
    (subjectAnchorPreserved || beat.order > 1 ? 0.03 : -0.2) -
    explanationPenalty * 0.38 -
    generic * 0.6 -
    process * 0.6 -
    fragment * 0.24 -
    paraphrase * 0.34,
  );

  const recoveryScore = recovery && literal ? metric(0.12 + grounding * 0.18) : 0;
  const score = recoveryScore || (
    literal
      ? (beat.order === 1 && openingEstablishing ? metric(0.18 + grounding * 0.18 - generic * 0.5 - process * 0.5) : 0)
      : creative
  );

  const reasons: string[] = [];
  if (literal) reasons.push("literal-source-restatement");
  if (recovery) reasons.push("recovery-source");
  if (grounding >= 0.12) reasons.push("event-grounded");
  if (semanticApproved) reasons.push("approved-semantic-realization");
  if (relationalExecution && !literal) reasons.push("meaning-executed");
  if (groundedCreative && !literal) reasons.push("grounded-creative-realization");
  if (feltAuthority) reasons.push("felt-authority");
  if (lift >= 0.26) reasons.push("realization-lift");
  if (evidenceScore >= 0.3) reasons.push("source-specific");
  if (priorNovelty >= 0.6) reasons.push("novel-language");
  if (compression >= 0.9) reasons.push("economical-cut");
  if (explanation > 0) reasons.push("explicit-explanation-risk");
  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (fragment >= 0.9) reasons.push("fragment-continuation-risk");
  if (paraphrase >= 0.65) reasons.push("paraphrase-risk");
  if (!anchorPreserved) reasons.push("required-anchor-missing");
  if (!subjectAnchorPreserved) reasons.push("subject-anchor-missing");

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds: grounding >= 0.12 ? [...(beat.eventIds ?? [])] : [],
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: grounding,
    meaningScore: relationalExecution ? Math.max(lift, semanticScore, feltAuthority ? 0.35 : 0) : (openingEstablishing && groundedCreative ? 0.3 : literal ? 0.2 : 0),
    observerDiscoveryScore: relationalExecution
      ? metric((explanationForbidden && explanation === 0 ? 1 : 0.7) * Math.max(0.38, lift, semanticScore, feltAuthority ? 0.45 : 0))
      : openingEstablishing && groundedCreative ? 0.28 : literal ? 0.06 : 0,
    transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.4),
    obligationCoverage: relationalExecution ? metric(0.72 + grounding * 0.28) : openingEstablishing && groundedCreative ? 0.58 : literal ? 0.42 : 0,
    relationContractScore: metric((beat.relationKinds ?? []).length ? 0.9 : 0.45),
    forbiddenMoveRisk: metric(Math.max(explanationPenalty, generic, process, fragment)),
    cohesionScore: metric(0.34 + lift * 0.2 + grounding * 0.1 + priorNovelty * 0.06 + (relationalExecution ? 0.2 : 0) + (feltAuthority ? 0.08 : 0) - explanationPenalty * 0.1 - generic * 0.15),
    noveltyScore: priorNovelty,
    compressionScore: compression,
    inventionRisk: 0,
    repetitionRisk: 1 - priorNovelty,
    collageRisk: labels.length > 1 && evidenceScore < 0.12 ? 0.72 : 0,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH.",
    "QRE has already discovered the world, the relationship, the dramatic sequence, and the viewer effect. You realize that approved material in language.",
    "CORE QRE RULE: the supplied facts are true; the interesting relationship between them is the thing to make the viewer notice.",
    "Do not summarize the facts. Do not explain the relationship. Make the relationship FELT through the cut.",
    "Concrete reality is beat-scoped.",
    "The beat is your entire concrete reality scope. Do not reach backward or sideways for unrelated facts.",
    "The lens changes HOW the supplied reality lands, never WHAT happened.",
    "Use implication, contrast, status, irony, understatement, metaphor, personification, juxtaposition, callback, rhythm, and wordplay whenever the approved meaning earns them.",
    "Novel language is welcome. New concrete facts are not.",
    "A new physical event, object, person, setting, chronology, reaction, sensory fact, dialogue, or outcome requires explicit supplied authorization.",
    "Do not normalize absurd or contradictory supplied facts; supplied assertions remain true.",
    "Do not mention viewers, audiences, beats, strategies, cognition, evidence, semantics, planning, movies, storytelling, or authorship mechanics.",
    "Do not use generic trailer language or emotional summaries.",
    "One cut is one film moment. It may be a phrase, sentence, or several connected sentences when that is the smallest form that preserves the relationship, tension, anticipation, or rhythm.",
    "Opening cuts establish the supplied subject naturally when needed. Later cuts may omit it.",
    "Payoff cuts land the approved endpoint without appending a new event.",
    "Return exactly three materially different standalone lines for every supplied beat. Never output labels, placeholders, A/B/C, explanations, or metadata.",
  ].join(" ");
}

function creativeMaterialJob(beat: MouthCandidateBeat, envelope: RealityEnvelope, lensName?: string) {
  const s = semantic(beat);
  const lens = classifyLens(lensName || "NONE");
  const local = localEvidence(beat, envelope);
  const brief = buildCreativeLensBrief(lens, {
    subject: envelope.subject,
    coreTraits: uniqueStrings(envelope.suppliedStates ?? []),
    statusPosture: "",
    emotionalPosture: "",
    contradictions: [],
    objectRelationships: uniqueStrings(envelope.sensorySignals ?? []),
    privateInterpretations: [],
    confidence: 1,
  }, envelope);
  const implicationStrategies = uniqueStrings((brief as { implicationStrategies?: unknown }).implicationStrategies);
  const meaning = {
    relation: clean(s?.relation?.kind),
    mechanism: clean(s?.mechanism),
    before: clean(s?.before),
    after: clean(s?.after),
    realizationMove: clean(s?.realizationMove),
    creativeOpportunity: clean(s?.creativeOpportunity),
    feltEffect: clean(s?.feltEffect ?? beat.observerExperience?.feltEffect),
    viewerShift: clean(s?.viewerShift ?? beat.observerExperience?.viewerShift),
    languageAim: clean(s?.languageAim ?? beat.observerExperience?.realizationDirection),
  };
  return {
    order: beat.order,
    role: clean(beat.role),
    subject: clean(envelope.subject),
    realizationObligations: beat.realizationObligations,
    beatReality: local,
    availableReality: uniqueStrings([envelope.subject, ...local, ...Object.values(meaning)]).slice(0, 28),
    relationship: {
      kind: meaning.relation,
      mechanism: meaning.mechanism,
      before: meaning.before,
      after: meaning.after,
      approvedEventIds: uniqueStrings(s?.evidenceEventIds ?? []),
      interpretation: meaning.creativeOpportunity,
    },
    meaning,
    lens: {
      label: clean(brief.label),
      intensity: brief.intensity,
      framing: brief.framingBias,
      preferences: brief.realizationPreferences,
      treatmentMoves: brief.treatmentMoves,
      implicationStrategies,
      forbiddenRealityMoves: brief.forbiddenRealityMoves,
    },
    output: "Write three materially different standalone lines that make the approved relationship perceptible without explaining it.",
  };
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {
  const jobs = input.beats.map((beat) => creativeMaterialJob(beat, input.envelope, input.lens));
  return [
    { role: "system" as const, content: buildSystemPrompt() },
    {
      role: "user" as const,
      content: JSON.stringify({ task: "REALIZE_AUTHORIZED_MATERIAL", jobs }, null, 2),
    },
  ];
}

function cleanVariant(value: unknown): string {
  const text = clean(value).replace(/^(?:A|B|C)\s*:\s*/i, "").trim();
  return /^(?:A|B|C)$/i.test(text) ? "" : text;
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat)) return undefined;
    const variantsByBeat = parsed.variantsByBeat.map((item) => {
      const value = item as { order?: unknown; variants?: unknown };
      return {
        order: Number(value.order),
        variants: Array.isArray(value.variants) ? value.variants.map(cleanVariant).filter(Boolean).slice(0, 3) : [],
      };
    }).filter((item) => Number.isFinite(item.order) && item.order > 0 && item.variants.length > 0);
    return variantsByBeat.length ? { variantsByBeat } : undefined;
  } catch {
    return undefined;
  }
}

/** Evidence-locked recovery only. This is not a second author. */
export function deterministicCreativeFallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return sourceLabels(beat, envelope);
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[]; recovery?: boolean }): MouthCandidate {
  return annotateMouthRealizationBoundary(
    evaluateCandidate(input.text, input.beat, input.envelope, input.priorTexts ?? [], input.recovery === true),
    input.beat,
    input.envelope,
  );
}

function annotateMouthRealizationBoundary(candidate: MouthCandidate, beat: MouthCandidateBeat, envelope: RealityEnvelope): MouthCandidate {
  const authority = beat.realizationAuthority ?? buildMouthRealizationAuthority({ beat, envelope });
  const eventIds = new Set(beat.eventIds ?? []);
  const localEvents = envelope.events.filter((event) => eventIds.has(event.id));
  const localStructures = envelope.eventStructure.filter((structure) => eventIds.has(structure.eventId));
  const localReality = uniqueStrings([
    envelope.subject,
    ...localEvents.flatMap((event) => [event.label, ...(event.entities ?? [])]),
    ...localStructures.flatMap((structure) => [
      ...structure.subjects, ...structure.actions, ...structure.objects, ...structure.states,
      ...structure.temporalMarkers, ...structure.sensoryMarkers,
    ]),
    ...authority.reality.entities,
    ...authority.reality.actions,
    ...authority.reality.objects,
    ...authority.reality.states,
  ]);
  const globalReality = uniqueStrings([
    envelope.subject,
    ...envelope.events.flatMap((event) => [event.label, ...(event.entities ?? [])]),
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.suppliedPhrases,
  ]);
  const semanticAuthority = uniqueStrings([
    ...Object.values(authority.meaning),
    ...authority.earnedInterpretations,
  ]);
  const boundary = evaluateRealizationBoundary({
    text: candidate.text,
    subject: envelope.subject,
    localReality,
    globalReality,
    semantic: semanticAuthority,
    earnedInterpretations: authority.earnedInterpretations,
    permittedRealizationModes: authority.permittedRealizationModes,
    inferenceBudget: authority.inferenceBudget,
  });
  const reasons = candidate.reasons.filter((reason) => reason !== "realization-boundary-approved" && reason !== "realization-boundary-rejected");
  reasons.push(boundary.inventionRisk >= 0.9 ? "realization-boundary-rejected" : "realization-boundary-approved");
  return { ...candidate, inventionRisk: boundary.inventionRisk, reasons };
}

export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  const text = clean(candidate.text);
  if (!text) return false;
  if (candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("realization-boundary-rejected")) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;
  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;
  if (candidate.reasons.includes("required-anchor-missing")) return false;
  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;
  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;
  if (candidate.reasons.includes("recovery-source")) return true;
  if (candidate.beatOrder === 1 && candidate.reasons.includes("grounded-creative-realization") && candidate.score >= 0.26) return true;
  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.26;
}

function isIdentityRecoveryEligible(candidate: MouthCandidate): boolean {
  if (!candidate.text || candidate.inventionRisk >= 0.9) return false;
  const reasons = new Set(candidate.reasons);
  if (reasons.has("realization-boundary-rejected") || reasons.has("generic-summary-risk") || reasons.has("process-language-risk") || reasons.has("required-anchor-missing")) return false;
  return reasons.has("subject-anchor-missing") && candidate.beatOrder === 1;
}

function pathIncrement(candidate: MouthCandidate, prior: readonly MouthCandidate[], pool: MouthCandidatePool): number {
  const novelty = prior.length ? metric(1 - Math.max(...prior.map((item) => overlap(meaningful(candidate.text), meaningful(item.text))), 0)) : 1;
  const state = pool.viewerState;
  const fit = metric(candidate.transitionScore * 0.12 + state.stateShift * 0.15 + state.curiosityPressure * 0.2 + state.predictionError * 0.14 + candidate.observerDiscoveryScore * 0.39);
  return metric(
    candidate.score * 0.34 +
    candidate.meaningScore * 0.18 +
    candidate.cohesionScore * 0.1 +
    candidate.obligationCoverage * 0.05 +
    fit * 0.13 +
    novelty * 0.04 +
    (candidate.reasons.includes("felt-authority") ? 0.08 : 0) +
    (candidate.reasons.includes("realization-lift") ? 0.05 : 0) +
    (candidate.reasons.includes("source-specific") ? 0.03 : 0) +
    (candidate.reasons.includes("economical-cut") ? 0.02 : 0) -
    (candidate.reasons.includes("recovery-source") ? 0.2 : 0) -
    (candidate.reasons.includes("explicit-explanation-risk") ? 0.12 : 0) -
    candidate.forbiddenMoveRisk * 0.12,
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

export function selectBestMouthSequence(pools: readonly MouthCandidatePool[], options: MouthBeamOptions = {}): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };
  const width = Math.max(1, Math.floor(options.width ?? 12));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  let paths: Array<{ candidates: MouthCandidate[]; score: number }> = [{ candidates: [], score: 0 }];
  for (const pool of ordered) {
    const eligible = dedupe(pool.candidates).filter(isAuthorizedMouthCandidate);
    if (!eligible.length) return { candidates: [], texts: [], score: 0 };
    eligible.sort((a, b) => b.score - a.score);
    const bounded = eligible.slice(0, Math.max(width, perBeat));
    const expanded: Array<{ candidates: MouthCandidate[]; score: number }> = [];
    for (const path of paths) {
      for (const candidate of bounded) {
        if (path.candidates.some((prior) => clean(prior.text).toLowerCase() === clean(candidate.text).toLowerCase())) continue;
        expanded.push({ candidates: [...path.candidates, candidate], score: path.score + pathIncrement(candidate, path.candidates, pool) });
      }
    }
    expanded.sort((a, b) => b.score - a.score);
    paths = expanded.slice(0, width);
  }
  const best = paths[0];
  if (!best) return { candidates: [], texts: [], score: 0 };
  return { candidates: best.candidates, texts: best.candidates.map((candidate) => candidate.text), score: metric(best.score / Math.max(1, best.candidates.length)) };
}

export function completeMouthPools(input: { envelope: RealityEnvelope; beats: readonly MouthCandidateBeat[]; generated?: MouthCandidateBatch }): MouthCandidatePool[] {
  return input.beats.map((beat) => {
    if (!beat.viewerState) throw new Error(`Mouth beat ${beat.order} is missing viewerState`);
    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    const generatedCandidates = dedupe(generated.map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope })));
    const authorizedGenerated = generatedCandidates.filter(isAuthorizedMouthCandidate);
    const identityRecoveryCandidates = generatedCandidates
      .filter(isIdentityRecoveryEligible)
      .map((candidate) => {
        const recoveredText = identityRecoveryText(candidate.text, beat, input.envelope);
        return recoveredText ? scoreMouthCandidate({ text: recoveredText, beat, envelope: input.envelope, recovery: true }) : undefined;
      })
      .filter((candidate): candidate is MouthCandidate => Boolean(candidate));

    const literalRecoveryCandidates = authorizedGenerated.length
      ? []
      : deterministicCreativeFallback(beat, input.envelope)
          .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope, recovery: true }))
          .filter((candidate) => isAuthorizedMouthCandidate(candidate));

    return {
      order: beat.order,
      viewerState: beat.viewerState,
      nextPromise: clean(beat.next),
      frontier: clean(beat.frontier),
      candidates: dedupe([...generatedCandidates, ...identityRecoveryCandidates, ...literalRecoveryCandidates]),
    };
  });
}
