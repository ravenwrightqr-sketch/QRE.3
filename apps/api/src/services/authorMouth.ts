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

/**
 * ONE PRODUCTION MOUTH.
 *
 * QRE owns:
 *   - supplied reality
 *   - semantic authority
 *   - candidate authorization
 *   - recovery safety
 *   - realization scoring
 *   - sequence selection
 *
 * The model owns:
 *   - language realization
 *   - phrasing
 *   - compression
 *   - implication
 *   - attitude
 *   - wordplay
 *
 * Mouth never invents concrete reality.
 */
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

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through",
  "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be",
  "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them",
  "you", "we", "me", "very", "really", "just", "already", "apparently", "somehow", "perhaps", "maybe",
]);

const tokens = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));
const meaningful = (value: string): Set<string> => new Set([...tokens(value)].filter((token) => !STOP.has(token)));
const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};
const wordCount = (value: string): number => clean(value).split(/\s+/).filter(Boolean).length;
const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? ""));
}
function semantic(beat: MouthCandidateBeat) { return beat.semanticRealization; }
function relationKind(beat: MouthCandidateBeat): string { return clean(semantic(beat)?.relation?.kind).toLowerCase(); }

function semanticAuthorityText(beat: MouthCandidateBeat): string {
  const s = semantic(beat);
  const observer = beat.observerExperience;
  return clean([
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

function realizationLift(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 0;
  const source = meaningful([
    envelope.subject,
    ...sourceLabels(beat, envelope),
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
  ].join(" "));
  const candidate = meaningful(value);
  if (!candidate.size) return 0;
  const novelty = metric(1 - overlap(candidate, source));
  const authority = meaningful(semanticAuthorityText(beat));
  const authorityOverlap = authority.size ? overlap(candidate, authority) : 0;
  const structuralTurn = metric(
    (/[.!?;:]/.test(value) ? 0.28 : 0) +
    (/\b(?:but|yet|and|then|while|only)\b/i.test(value) ? 0.12 : 0) +
    (wordCount(value) <= 8 ? 0.22 : 0) +
    (novelty >= 0.25 ? 0.2 : 0) +
    (authorityOverlap >= 0.15 ? 0.28 : 0),
  );
  return metric(novelty * 0.32 + structuralTurn * 0.28 + authorityOverlap * 0.4);
}

function requiredConcreteAnchors(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  if (!/payoff|release/i.test(clean(beat.role))) return [];
  const labels = sourceLabels(beat, envelope);
  const explicitEntities = envelope.suppliedEntities ?? [];
  const anchors = explicitEntities.filter((entity) => labels.some((label) => overlap(meaningful(entity), meaningful(label)) >= 0.5));
  if (anchors.length) return uniqueStrings(anchors).slice(0, 8);
  return uniqueStrings(labels.flatMap((label) => [...meaningful(label)])).slice(0, 8);
}

function preservesSubjectAnchor(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const subject = clean(envelope.subject);
  const value = clean(text);
  if (beat.order !== 1) return true;
  if (!subject || !value) return false;
  const subjectTokens = meaningful(subject);
  const candidateTokens = meaningful(value);
  if (!subjectTokens.size || !candidateTokens.size) return false;
  const subjectOverlap = overlap(subjectTokens, candidateTokens);
  const conflictingActor = /^(?:he|she|they|we|you|someone|somebody|a man|a woman|another person)\b/i.test(value);
  return !conflictingActor && subjectOverlap >= 0.5;
}

function preservesRequiredAnchor(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const anchors = requiredConcreteAnchors(beat, envelope);
  if (!anchors.length) return true;
  const candidate = meaningful(text);
  if (!candidate.size) return false;
  return anchors.some((anchor) => {
    const anchorTokens = meaningful(anchor);
    if (!anchorTokens.size) return false;
    const shared = overlap(anchorTokens, candidate);
    return shared >= 0.5 || [...anchorTokens].some((token) => token.length >= 4 && candidate.has(token));
  });
}

function creativeStrategies(beat: MouthCandidateBeat): string[] {
  const relation = relationKind(beat);
  const role = clean(beat.role).toLowerCase();
  const out: string[] = [];
  const add = (name: string, job: string) => out.push(`${name}: ${job}`);
  if (/contrast|opposition|difference|tension/i.test(relation)) add("CONTRAST", "put two supplied meanings against each other");
  if (/agency|choice|decision|deviation|interruption|rebellion|unexpected|intent/i.test(relation)) add("STATUS_REVERSAL", "let the supplied outcome defeat the earlier expectation");
  if (/ownership|possession|belong|property/i.test(relation)) add("POSSESSION_TURN", "use the supplied ownership relation as the punch");
  if (/return|recurrence|again|callback|memory/i.test(relation)) add("CALLBACK", "make a repeated supplied detail heavier because of what changed");
  if (/cause|consequence|result|effect/i.test(relation)) add("CONSEQUENCE", "let the supplied result speak for itself");
  if (/surprise|absurd|comic|humou?r/i.test(relation)) add("COMIC_INVERSION", "make the supplied fact undercut the expected reading");
  add("RECONTEXTUALIZATION", "make one supplied detail read differently beside another supplied detail");
  add("IMPLICATION", "leave the approved connection for the reader to complete");
  add("UNDERSTATEMENT", "say less than the full obvious explanation");
  add("COMPRESSION", "remove connective prose and keep the sharpest anchors");
  add("COLLISION", "put two supplied details into one memorable relationship");
  if (/payoff|release/i.test(role)) add("PAYOFF_LANDING", "land the supplied endpoint without adding another event");
  if (/establish|arrival/i.test(role)) add("HOOK_ANCHOR", "make the first supplied detail carry the unresolved pressure");
  return uniqueStrings(out).slice(0, 8);
}

function compactCreativeJob(beat: MouthCandidateBeat, envelope: RealityEnvelope) {
  const s = semantic(beat);
  const eventIds = uniqueStrings(beat.eventIds ?? []);
  const eventDetails = eventIds.map((id) => {
    const event = envelope.events.find((item) => item.id === id);
    const structure = envelope.eventStructure.find((item) => item.eventId === id);
    return {
      id,
      label: clean(event?.label),
      entities: uniqueStrings(event?.entities ?? []),
      sourceIds: uniqueStrings(event?.sourceIds ?? []),
      structure: structure ? {
        subjects: uniqueStrings(structure.subjects), actions: uniqueStrings(structure.actions), objects: uniqueStrings(structure.objects),
        states: uniqueStrings(structure.states), temporalMarkers: uniqueStrings(structure.temporalMarkers), sensoryMarkers: uniqueStrings(structure.sensoryMarkers),
        semanticTags: uniqueStrings(structure.semanticTags), recurrenceScore: structure.recurrenceScore, transitionScore: structure.transitionScore,
        anomalyScore: structure.anomalyScore, salienceScore: structure.salienceScore,
      } : null,
    };
  });
  const eventSet = new Set(eventIds);
  return {
    order: beat.order, role: clean(beat.role), subject: clean(envelope.subject), eventIds, events: eventDetails,
    continuity: envelope.entityContinuity.filter((entity) => entity.eventIds.some((id) => eventSet.has(id))),
    relations: envelope.relations.filter((relation) => eventSet.has(relation.from) || eventSet.has(relation.to)),
    patterns: envelope.patterns.filter((pattern) => pattern.eventIds.some((id) => eventSet.has(id))),
    realityVocabulary: {
      entities: envelope.suppliedEntities.slice(0, 24), actions: envelope.suppliedActions.slice(0, 24), states: envelope.suppliedStates.slice(0, 24), phrases: envelope.suppliedPhrases.slice(0, 24),
    },
    semanticRealization: s ? {
      mechanism: clean(s.mechanism), relation: s.relation ? { kind: clean(s.relation.kind), fromEventId: clean(s.relation.fromEventId), toEventId: clean(s.relation.toEventId) } : null,
      before: clean(s.before), after: clean(s.after), subject: clean(s.subject || envelope.subject), realizationMove: clean(s.realizationMove), creativeOpportunity: clean(s.creativeOpportunity),
      feltEffect: clean(s.feltEffect), viewerShift: clean(s.viewerShift), languageAim: clean(s.languageAim), evidenceEventIds: uniqueStrings(s.evidenceEventIds ?? []),
      beforeEventIds: uniqueStrings(s.beforeEventIds ?? []), afterEventIds: uniqueStrings(s.afterEventIds ?? []),
      callback: s.callback ? { detail: clean(s.callback.detail), eventIds: uniqueStrings(s.callback.eventIds ?? []), role: clean(s.callback.role) } : null,
      confidence: s.confidence,
    } : null,
    observerExperience: beat.observerExperience ? {
      objective: clean(beat.observerExperience.objective), surprise: clean(beat.observerExperience.surprise), curiosity: clean(beat.observerExperience.curiosity),
      attention: uniqueStrings(beat.observerExperience.attention), landing: clean(beat.observerExperience.landing), explanationForbidden: beat.observerExperience.explanationForbidden === true,
      feltEffect: clean(beat.observerExperience.feltEffect), viewerShift: clean(beat.observerExperience.viewerShift), realizationDirection: clean(beat.observerExperience.realizationDirection),
    } : null,
    viewerState: beat.viewerState ? {
      beforeState: clean(beat.viewerState.beforeState), afterState: clean(beat.viewerState.afterState), attentionMove: clean(beat.viewerState.attentionMove), curiosityPressure: beat.viewerState.curiosityPressure,
      contrast: beat.viewerState.contrast, interruption: beat.viewerState.interruption, accumulation: beat.viewerState.accumulation, tempo: beat.viewerState.tempo,
      payoffPressure: beat.viewerState.payoffPressure, stateShift: beat.viewerState.stateShift, predictionError: beat.viewerState.predictionError, evidenceEventIds: uniqueStrings(beat.viewerState.evidenceEventIds ?? []),
    } : null,
    change: clean(beat.change), next: clean(beat.next), frontier: clean(beat.frontier), strategies: creativeStrategies(beat), obligations: uniqueStrings(beat.obligations ?? []), forbidden: uniqueStrings(beat.forbiddenMoves ?? []),
    creativeJob: "REALIZE THE EXPERIENCE, not the source sentence. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Do not explain the thesis.",
  };
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

function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 1;
  if (processRisk(value)) return 1;
  const s = semantic(beat);
  const observer = beat.observerExperience;
  const source = meaningful([
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.suppliedPhrases,
  ].join(" "));
  const candidate = meaningful(value);
  const grounding = overlap(candidate, source);
  const semanticGrounding = overlap(candidate, meaningful(semanticAuthorityText(beat)));

  // A semantically authorized line may use vocabulary absent from source prose.
  // Safety is still bounded by an approved semantic contract, not an English verb list.
  if (s && (semanticGrounding >= 0.05 || clean(s.feltEffect) || clean(s.viewerShift) || clean(s.languageAim))) return 0;
  if (observer && (clean(observer.feltEffect) || clean(observer.viewerShift) || clean(observer.realizationDirection))) return 0;
  return grounding >= 0.12 ? 0 : 0.95;
}

function creativeEvidenceOverlap(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const labels = sourceLabels(beat, envelope);
  const candidate = meaningful(text);
  if (!labels.length) return 0;
  return metric(labels.reduce((sum, label) => sum + overlap(meaningful(label), candidate), 0) / labels.length);
}
function semanticOverlap(text: string, beat: MouthCandidateBeat): number {
  const authority = semanticAuthorityText(beat);
  if (!authority) return 0;
  return overlap(meaningful(authority), meaningful(text));
}
function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value);
}

function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const literal = exactSource(value, labels);
  const semanticScore = semanticOverlap(value, beat);
  const grounding = metric(creativeEvidenceOverlap(value, beat, envelope) * 0.58 + overlap(meaningful(value), meaningful(envelope.subject)) * 0.08 + semanticScore * 0.34);
  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));
  const generic = genericRisk(value);
  const process = processRisk(value);
  const explanation = explanationRisk(value);
  const lift = realizationLift(value, beat, envelope);
  const semanticApproved = Boolean(semantic(beat));
  const priorNovelty = priorTexts.length === 0 ? 1 : metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0));
  const compressed = wordCount(value) >= 2 && wordCount(value) <= 10;
  const forbidden = beat.observerExperience?.explanationForbidden === true;
  const explanationPenalty = forbidden ? explanation : explanation * 0.35;
  const hasRelationalMove = semanticApproved && (lift >= 0.3 || semanticScore >= 0.05 || (creativeEvidenceOverlap(value, beat, envelope) >= 0.2 && relationKind(beat).length > 0));
  const anchorPreserved = preservesRequiredAnchor(value, beat, envelope);
  const subjectAnchorPreserved = preservesSubjectAnchor(value, beat, envelope);
  const feltAuthority = Boolean(semantic(beat)?.feltEffect || semantic(beat)?.viewerShift || semantic(beat)?.languageAim || beat.observerExperience?.feltEffect || beat.observerExperience?.viewerShift || beat.observerExperience?.realizationDirection);

  const creative = metric(
    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55,
  );
  const recoveryScore = recovery && literal ? metric(0.2 + grounding * 0.25) : 0;
  const score = recoveryScore || (literal ? (beat.order === 1 ? metric(0.2 + grounding * 0.2 - generic * 0.5 - process * 0.5) : 0) : creative);
  const reasons: string[] = [];
  if (literal) reasons.push("literal-source-restatement");
  if (recovery) reasons.push("recovery-source");
  if (grounding >= 0.15) reasons.push("event-grounded");
  if (semanticApproved) reasons.push("approved-semantic-realization");
  if (hasRelationalMove && !literal) reasons.push("meaning-executed");
  if (feltAuthority) reasons.push("felt-authority");
  if (lift >= 0.3) reasons.push("realization-lift");
  if (creativeEvidenceOverlap(value, beat, envelope) >= 0.3) reasons.push("source-specific");
  if (priorNovelty >= 0.6) reasons.push("novel-language");
  if (compressed) reasons.push("compressed");
  if (explanation > 0) reasons.push("explicit-explanation-risk");
  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");
  if (!anchorPreserved) reasons.push("required-anchor-missing");
  if (!subjectAnchorPreserved) reasons.push("subject-anchor-missing");

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds: grounding >= 0.15 && invention < 0.9 ? [...(beat.eventIds ?? [])] : [],
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: grounding,
    meaningScore: hasRelationalMove ? Math.max(lift, semanticScore, feltAuthority ? 0.35 : 0) : literal ? 0.25 : 0,
    observerDiscoveryScore: hasRelationalMove ? metric((forbidden && explanation === 0 ? 1 : 0.7) * Math.max(0.4, lift, semanticScore, feltAuthority ? 0.45 : 0)) : literal ? 0.08 : 0,
    transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.4),
    obligationCoverage: hasRelationalMove ? metric(0.72 + grounding * 0.28) : literal ? 0.45 : 0,
    relationContractScore: metric((beat.relationKinds ?? []).length ? 0.86 : 0.4),
    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process)),
    cohesionScore: metric(0.34 + lift * 0.18 + grounding * 0.1 + priorNovelty * 0.07 + (hasRelationalMove ? 0.18 : 0) + (feltAuthority ? 0.08 : 0) + (anchorPreserved ? 0.05 : -0.12) - explanationPenalty * 0.1 - generic * 0.15),
    noveltyScore: priorNovelty,
    compressionScore: compressed ? 0.98 : 0.55,
    inventionRisk: invention,
    repetitionRisk: 1 - priorNovelty,
    collageRisk: labels.length > 1 && creativeEvidenceOverlap(value, beat, envelope) < 0.2 ? 0.75 : 0,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH: an expert human copywriter operating under an absolute reality boundary.",
    "The movie, sequence, semantic meaning, and beat roles are already chosen. Your job is LANGUAGE REALIZATION, not planning.",
    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",
    "The aesthetic target is FELT MEANING: the reader should experience a click, turn, tension, recognition, irony, tenderness, surprise, or consequence rather than receive an explanation.",
    "Use the feltEffect, viewerShift, and languageAim as primary creative direction. Translate them into the smallest memorable line that makes the approved change perceptible.",
    "A strong realization may be fragmentary. Forms such as 'Beauty. Then chaos.' or 'Innocence, briefly.' are valid patterns when their underlying meaning is actually supported. Never copy those examples into unrelated content.",
    "Optimize for killer human language: memorable, specific, surprising, emotionally legible, image-rich, rhythmically sharp, and alive. Safety is the boundary, not the aesthetic target.",
    "Use the full semantic contract you receive. The mechanism, relationship, before/after meaning, realization move, creative opportunity, felt effect, viewer shift, language aim, observer surprise, curiosity, landing, event structure, continuity, patterns, and viewer-state dynamics are deliberate authorial signals.",
    "When the contract supports a strong implication, status turn, irony, collision, callback, recontextualization, understatement, or consequence, prefer it over scene narration.",
    "Candidate A should be the strongest overall realization. Candidate B should take a materially different angle. Candidate C should take the boldest approved angle.",
    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",
    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",
    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome.",
    "Never mention viewers, audiences, beats, strategies, evidence, cognition, movies, planning, or storytelling.",
    "Never write generic emotional summaries or trailer language.",
    "Prefer 2-8 words when the meaning allows it. A longer line is justified only when compression would lose the approved relationship.",
    "The opening cut must explicitly preserve subject identity. Later cuts may omit the subject once identity is established.",
    "At payoff, land the supplied endpoint and accumulated meaning. Do not append another event.",
    "When explanationForbidden is true, do not state the thesis, relationship, lesson, or conclusion. Make it felt instead.",
    "Internally draft many possibilities and silently reject weak or merely descriptive ones. Return only the strongest three materially different realizations for every beat.",
  ].join(" ");
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {
  const lens = classifyLens(input.lens);
  const jobs = input.beats.map((beat) => compactCreativeJob(beat, input.envelope));
  return [
    { role: "system" as const, content: buildSystemPrompt() },
    { role: "user" as const, content: JSON.stringify({
      task: "REALIZE_APPROVED_CREATIVE_JOBS",
      lens: input.lens || "AUTO",
      lensProfile: lens,
      reality: {
        subject: input.envelope.subject,
        entities: input.envelope.suppliedEntities.slice(0, 16),
        actions: input.envelope.suppliedActions.slice(0, 16),
        states: input.envelope.suppliedStates.slice(0, 16),
        phrases: input.envelope.suppliedPhrases.slice(0, 20),
        events: input.envelope.events.slice(0, 24).map((event) => ({ id: event.id, label: event.label })),
      },
      jobs,
      priorTexts: input.priorTexts ?? [],
      output: { variantsByBeat: jobs.map((job) => ({ order: job.order, variants: ["A", "B", "C"] })) },
    }, null, 2) },
  ];
}

function cleanVariant(value: unknown): string { return clean(value).replace(/^(?:A|B|C)\s*:\s*/i, "").trim(); }
export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat)) return undefined;
    const variantsByBeat = parsed.variantsByBeat.map((item) => {
      const value = item as { order?: unknown; variants?: unknown };
      return { order: Number(value.order), variants: Array.isArray(value.variants) ? value.variants.map(cleanVariant).filter(Boolean).slice(0, 3) : [] };
    }).filter((item) => Number.isFinite(item.order) && item.order > 0 && item.variants.length > 0);
    return variantsByBeat.length ? { variantsByBeat } : undefined;
  } catch { return undefined; }
}

export function deterministicCreativeFallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings(sourceLabels(beat, envelope));
}
function lexicalNovelty(text: string, prior: readonly MouthCandidate[]): number {
  if (!prior.length) return 1;
  return metric(1 - Math.max(...prior.map((candidate) => overlap(meaningful(text), meaningful(candidate.text))), 0));
}
export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[]; recovery?: boolean }): MouthCandidate {
  return evaluateCandidate(input.text, input.beat, input.envelope, input.priorTexts ?? [], input.recovery === true);
}
export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  const text = clean(candidate.text);
  if (!text || candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;
  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;
  if (candidate.reasons.includes("required-anchor-missing")) return false;
  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;
  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;
  if (candidate.reasons.includes("recovery-source")) return true;
  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;
}
function pathIncrement(candidate: MouthCandidate, prior: readonly MouthCandidate[], pool: MouthCandidatePool): number {
  const novelty = lexicalNovelty(candidate.text, prior);
  const state = pool.viewerState;
  const fit = metric(candidate.transitionScore * 0.14 + state.stateShift * 0.16 + state.curiosityPressure * 0.2 + state.predictionError * 0.14 + candidate.observerDiscoveryScore * 0.36);
  return metric(candidate.score * 0.34 + candidate.meaningScore * 0.16 + candidate.cohesionScore * 0.1 + candidate.obligationCoverage * 0.05 + fit * 0.12 + novelty * 0.05 + (candidate.reasons.includes("felt-authority") ? 0.1 : 0) + (candidate.reasons.includes("realization-lift") ? 0.05 : 0) + (candidate.reasons.includes("source-specific") ? 0.04 : 0) + (candidate.reasons.includes("compressed") ? 0.04 : 0) - (candidate.reasons.includes("recovery-source") ? 0.18 : 0) - (candidate.reasons.includes("explicit-explanation-risk") ? 0.12 : 0) - candidate.forbiddenMoveRisk * 0.12);
}
function dedupe(candidates: readonly MouthCandidate[]): MouthCandidate[] {
  const seen = new Set<string>(); const result: MouthCandidate[] = [];
  for (const candidate of candidates) { const key = clean(candidate.text).toLowerCase(); if (!key || seen.has(key)) continue; seen.add(key); result.push(candidate); }
  return result;
}
export function selectBestMouthSequence(pools: readonly MouthCandidatePool[], options: MouthBeamOptions = {}): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };
  const width = Math.max(1, Math.floor(options.width ?? 12));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  let paths: Array<{ candidates: MouthCandidate[]; score: number }> = [{ candidates: [], score: 0 }];
  for (let poolIndex = 0; poolIndex < ordered.length; poolIndex += 1) {
    const pool = ordered[poolIndex];
    const creative = dedupe(pool.candidates).filter(isAuthorizedMouthCandidate).filter((candidate) => !candidate.reasons.includes("literal-source-restatement"));
    const openingLiteral = poolIndex === 0 ? dedupe(pool.candidates).filter((candidate) => candidate.endpointExactness >= 0.999 && candidate.inventionRisk < 0.9 && !candidate.reasons.includes("generic-summary-risk") && !candidate.reasons.includes("subject-anchor-missing")) : [];
    const eligible = dedupe([...creative, ...openingLiteral]);
    if (!eligible.length) return { candidates: [], texts: [], score: 0 };
    eligible.sort((a, b) => b.score - a.score);
    const bounded = eligible.slice(0, Math.max(width, perBeat));
    const expanded: Array<{ candidates: MouthCandidate[]; score: number }> = [];
    for (const path of paths) for (const candidate of bounded) {
      if (path.candidates.some((prior) => clean(prior.text).toLowerCase() === clean(candidate.text).toLowerCase())) continue;
      expanded.push({ candidates: [...path.candidates, candidate], score: path.score + pathIncrement(candidate, path.candidates, pool) });
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
    const generatedCandidates = generated.map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }));
    const fallbackCandidates = deterministicCreativeFallback(beat, input.envelope).map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope, recovery: true }));
    return {
      order: beat.order,
      viewerState: beat.viewerState,
      nextPromise: clean(beat.next),
      frontier: clean(beat.frontier),
      candidates: dedupe([...generatedCandidates, ...fallbackCandidates]),
    };
  });
}
