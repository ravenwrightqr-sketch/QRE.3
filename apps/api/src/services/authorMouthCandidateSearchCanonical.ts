/*
 * QRE CANONICAL MOUTH CANDIDATE ADAPTER
 *
 * Legacy candidate search remains responsible for generation and its existing
 * safety metrics. This adapter is the canonical bridge that lets grounded
 * semantic realization survive lexical-overlap scoring without weakening the
 * reality boundary.
 *
 * CORE DISTINCTION:
 *   source wording -> diagnostic evidence
 *   approved beat  -> semantic ownership
 *   final language -> realization
 *
 * UNIVERSAL REALITY SHAPE:
 *   stable supplied reality -> discovery / accumulation / recurrence / attitude
 *   supplied event          -> event realization / story movement
 *   supplied state          -> experiential state / transformation
 *
 * DEEPER EXPERIENCE:
 *   what happened -> what did that do -> what did it make newly meaningful
 *   -> Mouth realizes that consequence instead of merely restating the source.
 *
 * The consequence layer interprets supplied reality. It never authorizes a new
 * concrete event.
 *
 * LENS WIRING:
 *   active lens -> model realization guidance
 *   active lens -> candidate-specific fit
 *   active lens -> grounded-surprise scoring
 *
 * The lens changes interpretation, never reality.
 */

import {
  buildMouthCandidateMessages as buildLegacyMessages,
  parseMouthCandidateBatch as parseLegacyBatch,
  scoreMouthCandidate as scoreLegacyCandidate,
} from "./authorMouthCandidateSearch.js";
import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
} from "@qre/contracts";
import {
  buildCharacterProfile,
  classifyLens,
} from "./authorCharacterLensEngine.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: import("@qre/contracts").AuthorDomainContext;
};

const activeLensByBeat = new WeakMap<object, string>();

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at",
  "for", "with", "from", "by", "through", "after", "before", "then", "now",
  "very", "just", "still", "again", "this", "that", "it", "is", "are", "was",
  "were", "be", "been", "being", "as", "into", "my", "your", "our", "their",
  "his", "her", "its", "he", "she", "they", "them", "you", "we", "me",
]);

function normalizeToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
}

function tokenSet(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3)
      .map(normalizeToken),
  );
}

function meaningfulTokenSet(value: string): Set<string> {
  return new Set(
    [...tokenSet(value)].filter((token) => !FUNCTION_WORDS.has(token)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

function sourceLabelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return [
    ...new Set(
      (beat.eventIds ?? [])
        .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
        .map(clean)
        .filter(Boolean),
    ),
  ];
}

function relationalCompressionAuthorized(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): boolean {
  const participants = new Set(
    [
      ...(envelope.suppliedEntities ?? []),
      ...(envelope.suppliedPhrases ?? []),
    ]
      .map(clean)
      .filter(Boolean)
      .filter((value) => !/^(?:someone|something|it|this|that)$/i.test(value)),
  );
  if (participants.size < 2) return false;
  const eventIds = new Set(beat.eventIds ?? []);
  const beatEvents = envelope.events.filter((event) => eventIds.has(event.id));
  if (!beatEvents.length) return false;
  return beatEvents.some((event) =>
    /\b(?:met|talked|talking|spoke|speaking|shared|together|between|with|connected|joined|visited|called|texted|messaged|worked|played|danced)\b/i.test(clean(event.label)),
  );
}

type MouthRealityShape = "stable" | "event" | "state" | "observation";

function realityShapeForLabel(label: string): MouthRealityShape {
  const value = clean(label).toLowerCase();
  if (!value) return "observation";
  if (/\b(?:went|came|arrived|left|returned|saw|met|found|lost|got|stole|took|gave|made|finished|started|opened|closed|walked|ran|drove|ate|drank|kissed|married|celebrated|played|visited|bought|sold|built|fixed|painted|wrote|called|laughed|cried|looked|felt|became|changed|did)\b/i.test(value) || /\b(?:\d+\s*(?:minute|minutes|hour|hours|day|days|times?)|at\s+\d|today|yesterday|tomorrow|this\s+(?:morning|afternoon|evening|night)|last\s+(?:night|week|month|year)|next\s+(?:day|week|month|year))\b/i.test(value)) return "event";
  if (/\b(?:likes?|loves?|prefers?|enjoys?|wants?|needs?|hates?|walks?|eats?|drinks?|plays?|knows?|keeps?|collects?|visits?|uses?|wears?|has|have|owns?)\b/i.test(value)) return "stable";
  if (/\b(?:nervous|happy|sad|angry|calm|excited|tired|proud|afraid|scared|confident|quiet|loud|fierce|sweet|gentle|wild|goofy|stubborn|ready|different|changed|fabulous)\b/i.test(value)) return "state";
  return "observation";
}

function realityShapeForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): MouthRealityShape {
  const labels = sourceLabelsForBeat(beat, envelope);
  if (!labels.length) return "observation";
  const shapes = labels.map(realityShapeForLabel);
  const eventCount = shapes.filter((shape) => shape === "event").length;
  const stableCount = shapes.filter((shape) => shape === "stable").length;
  const stateCount = shapes.filter((shape) => shape === "state").length;
  if (eventCount >= Math.max(stableCount, stateCount)) return "event";
  if (stableCount > eventCount && stableCount >= stateCount) return "stable";
  if (stateCount > eventCount && stateCount > stableCount) return "state";
  return "observation";
}

function unsupportedConcreteClaimRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text).toLowerCase();
  if (!value) return 1;
  const sourceLabels = sourceLabelsForBeat(beat, envelope);
  const sourceWorld = [
    ...sourceLabels,
    envelope.subject,
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
  ].map(clean).filter(Boolean).join(" ");
  const candidateTokens = meaningfulTokenSet(value);
  const sourceTokens = meaningfulTokenSet(sourceWorld);
  const sourceOverlap = overlap(candidateTokens, sourceTokens);
  const directlySuppliedSource = sourceLabels.some((label) => {
    const labelTokens = meaningfulTokenSet(label);
    if (!labelTokens.size || !candidateTokens.size) return false;
    return overlap(candidateTokens, labelTokens) === 1 && overlap(labelTokens, candidateTokens) === 1;
  });
  if (directlySuppliedSource) return 0;

  const concreteOccurrence = /\b(?:glance|glanced|looked|looks|smiled|smile|touched|touch|held|hold|reached|reach|stood|stand|sat|sit|walked|walk|ran|run|opened|open|closed|close|entered|enter|left|leave|arrived|arrive|returned|return|called|call|texted|text|messaged|message|laughed|laugh|cried|cry|kissed|kiss|hugged|hug|turned|turn|moved|move|appeared|appear|disappeared|disappear|followed|follow|watched|watch|heard|hear|saw|see|smelled|smell|sounded|sound|tasted|taste|breathed|breathe|whispered|whisper|spoke|speak|talked|talk|danced|dance|drove|drive|ate|eat|drank|drink)\b/i.test(value);
  const concreteSceneNoun = /\b(?:room|street|road|house|home|door|window|floor|wall|table|chair|car|garden|yard|sky|cloud|rain|sunlight|moonlight|shadow|light|air|smoke|water|path|frame|hallway|kitchen|bathroom|bed|phone|screen|hand|hands|face|eyes|shoulder|shoulders|body|voice|sound|scent|smell)\b/i.test(value);
  const newChronology = /\b(?:suddenly|then|afterward|after|before|later|earlier|eventually|finally|already|again|next|that night|the next day|the following day|minutes? later|hours? later|days? later)\b/i.test(value);
  const conceptualRealization = /\b(?:ease|lightness|warmth|tension|silence|distance|connection|recognition|release|calm|nerves|nervousness|awkwardness|closeness|uncertainty|comfort|relief|energy|rhythm|stillness|solace|familiar|strange|guard|grip|belonging|absence|presence|wanting|need|curiosity|pressure|momentum|possibility|permission|agreement|confirmation|fabulous|proud|happy|status|victory|exit|finish|upgrade|approved)\b/i.test(value);
  const transformation = directTransformationSignal(value);
  const consequence = experientialConsequenceSignal(value, sourceLabels, beat);

  if (sourceOverlap >= 0.35 && !concreteOccurrence && !concreteSceneNoun && !newChronology) return 0;
  if (transformation >= 0.58 && consequence >= 0.45 && conceptualRealization && !concreteOccurrence && !newChronology) return 0;
  if (relationalCompressionAuthorized(beat, envelope) && conceptualRealization && !concreteOccurrence && !newChronology && sourceOverlap >= 0.08) return 0;
  if (concreteOccurrence || concreteSceneNoun || newChronology) return 1;
  if (conceptualRealization && (transformation >= 0.58 || consequence >= 0.58)) return 0;
  return 0;
}

function lensFitForCandidate(text: string, lensInput?: string): number {
  const lens = classifyLens(lensInput);
  const candidateTokens = meaningfulTokenSet(text);
  const framingTokens = meaningfulTokenSet(lens.framingBias.join(" "));
  const preferenceTokens = meaningfulTokenSet(lens.realizationPreferences.join(" "));
  const framingFit = overlap(candidateTokens, framingTokens);
  const preferenceFit = overlap(candidateTokens, preferenceTokens);
  const antiGeneric = /\b(?:beautiful|magical|special|incredible|perfect|amazing|wonderful|journey|moment)\b/i.test(clean(text)) ? 0.2 : 0;
  return metric(Math.max(0, framingFit * 0.52 + preferenceFit * 0.28 + lens.intensity * 0.2 - antiGeneric));
}

function directTransformationSignal(text: string): number {
  const value = clean(text);
  if (!value) return 0;
  const transformationVerb = /\b(?:became|becomes|turned|turns|faded|fade|eased|ease|lifted|lifts|softened|softens|opened|opens|gave|give|flowed|flows|dissolved|dissolve|bled|bleed|released|releases|settled|settles|loosened|loosens|lightened|lightens|changed|changes|shifted|shifts|broke|breaks|melted|melts)\b/i;
  const transformationStructure = /\b(?:\w+(?:ness)?\s+(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted)|(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted))\b/i.test(value);
  if (!transformationVerb.test(value)) return 0;
  const words = value.split(/\s+/).filter(Boolean).length;
  const concise = words <= 7 ? 0.2 : words <= 11 ? 0.1 : 0;
  return metric(0.58 + (transformationStructure ? 0.2 : 0) + concise);
}

function experientialConsequenceSignal(text: string, sourceLabels: readonly string[], beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 0;
  const words = value.split(/\s+/).filter(Boolean).length;
  const candidate = meaningfulTokenSet(value);
  const source = meaningfulTokenSet(sourceLabels.join(" "));
  const sourceOverlap = overlap(candidate, source);
  const consequenceVocabulary = /\b(?:opened|closed|shifted|changed|deepened|collapsed|eased|tightened|loosened|faded|settled|melted|flowed|stayed|remained|became|turned|pulled|released|connected|familiar|strange|closer|distant|distance|guard|grip|rhythm|silence|stillness|relief|tension|ease|recognition|curiosity|ache|weight|lightness|freedom|pressure|belonging|absence|presence|want|wanted|need|needed|almost|already|finally|again|still|somehow|suddenly)\b/i.test(value) ? 0.28 : 0;
  const experientialStructure = /\b(?:something|nothing|everything|it|that|this|already|somehow|suddenly|finally|still|almost|again|too|just)\b/i.test(value) ? 0.14 : 0;
  const consequenceVerb = /\b(?:opened|closed|changed|shifted|deepened|collapsed|eased|tightened|loosened|faded|settled|melted|flowed|stayed|remained|became|turned|pulled|released|connected|felt|feel|wanted|want|needed|need|lost|found|held)\b/i.test(value) ? 0.22 : 0;
  const compressed = words <= 8 ? 0.12 : words <= 12 ? 0.06 : 0;
  const semanticDeparture = sourceOverlap < 0.65 ? 0.1 : 0;
  const beatAuthority = beat.eventIds?.length || beat.change || beat.attentionFunction || beat.relationKinds?.length ? 0.12 : 0;
  return metric(consequenceVocabulary + experientialStructure + consequenceVerb + compressed + semanticDeparture + beatAuthority);
}

function expressiveRealizationSignal(text: string, sourceLabels: readonly string[], beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 0;
  const words = value.split(/\s+/).filter(Boolean).length;
  const current = meaningfulTokenSet(value);
  const source = meaningfulTokenSet(sourceLabels.join(" "));
  const localOverlap = overlap(current, source);
  const directTransformation = directTransformationSignal(value);
  const experientialConsequence = experientialConsequenceSignal(value, sourceLabels, beat);
  const activeVerb = /\b(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted|stayed|keep|kept|continued|waited|felt|feel)\b/i.test(value) ? 0.2 : 0;
  const compressed = words <= 6 ? 0.14 : words <= 10 ? 0.06 : 0;
  const contrastive = /\b(?:but|yet|still|almost|only|except|instead|rather|never|not|nothing|everything|then|before|after|until)\b/i.test(value) ? 0.12 : 0;
  const imageableAbstraction = /\b(?:current|pull|weight|spark|rush|drift|heat|cold|light|shadow|gravity|rumble|vibration|flow|quiet|tremor|pressure|edge|space|wave|fire|supernova|echo|warmth|ease|lightness|tension|silence|distance|connection|recognition|release|calm|nerves|nervousness|awkwardness|closeness|uncertainty|comfort|relief|energy|rhythm|stillness|solace|familiar|strange|guard|grip|belonging|absence|presence|fabulous|proud|happy|status|victory|exit|finish|upgrade|approved)\b/i.test(value) ? 0.18 : 0;
  const bareArticleLabel = /^(?:a|an|the)\s+[a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2}[.!?]?$/i.test(value);
  const conceptualLabel = /\b(?:assent|approval|recognition|connection|possibility|momentum|lightness|warmth|ease|release|permission|agreement|confirmation|fabulous|proud|happy|status|victory|exit|finish|upgrade|approved)\b/i.test(value);
  const labelPenalty = bareArticleLabel && conceptualLabel ? 0.16 : conceptualLabel && words <= 3 && directTransformation < 0.5 ? 0.05 : 0;
  const beatAuthority = beat.eventIds?.length || beat.change || beat.attentionFunction || beat.relationKinds?.length ? 0.18 : 0;
  return metric(0.18 + directTransformation * 0.3 + experientialConsequence * 0.24 + activeVerb + compressed + contrastive + imageableAbstraction + beatAuthority * 0.4 + (localOverlap >= 0.08 ? 0.08 : 0) - labelPenalty);
}

function groundedSurpriseForCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, legacy: MouthCandidate, interpretation: ReturnType<typeof evaluateMouthInterpretation>, lensInput?: string): number {
  const sourceLabels = sourceLabelsForBeat(beat, envelope);
  const candidateTokens = meaningfulTokenSet(text);
  const localTokens = meaningfulTokenSet(sourceLabels.join(" "));
  const worldTokens = meaningfulTokenSet([
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].join(" "));
  const localAnchor = overlap(candidateTokens, localTokens);
  const worldAnchor = overlap(candidateTokens, worldTokens);
  const semanticDistance = metric(Math.max(0, 1 - localAnchor));
  const recognition = metric(Math.max(worldAnchor, legacy.supportedEventIds.length > 0 ? 0.55 : 0, legacy.supportedRelationPairs.length > 0 ? 0.35 : 0));
  const lensFit = lensFitForCandidate(text, lensInput);
  const expressiveness = expressiveRealizationSignal(text, sourceLabels, beat);
  const safety = metric(1 - Math.max(legacy.inventionRisk, legacy.forbiddenMoveRisk, interpretation.unsupportedConcreteRisk));
  return metric(semanticDistance * 0.19 + recognition * 0.24 + lensFit * 0.2 + expressiveness * 0.16 + (interpretation.accepted ? 0.16 : 0) + legacy.noveltyScore * 0.05 + safety * 0.02);
}

function payoffRewardSignal(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 0;
  const shape = realityShapeForBeat(beat, envelope);
  const endpoint = clean(sourceLabelsForBeat(beat, envelope).at(-1) ?? "");
  const wordCount = value.split(/\s+/).filter(Boolean).length;
  const compressed = wordCount <= 7 ? 0.18 : wordCount <= 11 ? 0.1 : 0;
  const statusHit = /\b(?:fabulous|fab|done|cleared|approved|official|boss|legendary|nailed|upgrade|complete|exit|finish|victory|win|winner|promoted|made\s+it|showtime)\b/i.test(value) ? 0.26 : 0;
  const punch = /(?:[.!?]$|\b(?:no|not|but|still|finally|already|just)\b)/i.test(value) ? 0.1 : 0;
  const endpointDistance = endpoint ? metric(1 - overlap(meaningfulTokenSet(value), meaningfulTokenSet(endpoint))) : 0.5;
  const stateLanding = shape === "state" || /\b(?:happy|proud|relieved|calm|good|fabulous|fab|pleased|ready)\b/i.test(value) ? 0.18 : 0;
  const concretePenalty = unsupportedConcreteClaimRisk(value, beat, envelope) >= 0.9 ? 1 : 0;
  return metric(Math.max(0, compressed + statusHit + punch + endpointDistance * 0.18 + stateLanding - concretePenalty));
}

function domainContextText(context: MouthCandidateGenerationInput["domainContext"]): string {
  return context ? [
    context.category,
    context.businessType,
    context.businessName,
    context.businessDescription,
    context.serviceType,
    context.serviceName,
    context.subjectKind,
    ...(context.knownCapabilities ?? []),
    ...(context.contextualSignals ?? []),
  ].map(clean).filter(Boolean).join(" | ") : "";
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  for (const beat of input.beats) activeLensByBeat.set(beat as object, clean(input.lens));
  const messages = buildLegacyMessages(input);
  const contextText = domainContextText(input.domainContext);
  const lens = classifyLens(input.lens);
  const character = buildCharacterProfile(input.envelope);
  const instructions = [
    `ACTIVE LENS: ${lens.label || "custom"}.`,
    `LENS FRAMING BIASES: ${lens.framingBias.join(", ")}.`,
    `LENS REALIZATION PREFERENCES: ${lens.realizationPreferences.join(", ")}.`,
    `LENS INTENSITY: ${lens.intensity}.`,
    `SUBJECT POSTURE: ${character.statusPosture}.`,
    `EMOTIONAL POSTURE: ${character.emotionalPosture}.`,
    "The approved sequence is already chosen. Do not re-plan it.",
    "Generate three materially different viewer-facing realizations for each approved beat. One may be direct, one compressed, and one bolder/stranger when supported.",
    "The best line is not the safest paraphrase. It is the strongest truthful realization of the approved beat in context of the whole sequence.",
    "Do not make every cut grammatical or subject-led. Fragments, labels, questions, status language, send-offs, and abrupt compression are valid.",
    "Read the whole sequence before writing the current cut. Earlier cuts are context; later cuts are promises.",
    "A final supplied state such as happy, proud, relieved, complete, successful, or fabulous may land as identity, status, verdict, punchline, send-off, or afterimage. The exact expression must be earned from the sequence.",
    "Do not represent an emotional or status result as a newly invented physical reaction. For example, happy does not authorize smiling, laughing, wagging, breathing, or any other body action unless supplied.",
    "The final cut may be radically shorter than the source and may use different vocabulary when its meaning is already owned by the approved beat.",
    "Prefer a line that makes the viewer recognize the accumulated change without explaining the change.",
    "Truth is a hard boundary: never invent a concrete person, object, action, location, outcome, dialogue, event, chronology, identity attribute, or physical reaction.",
    "The lens changes framing, attitude, timing, status, implication, and emotional interpretation only. It never adds reality.",
    "Examples are behavioral references only: Nervous in. Fabulous out. / Made it. Fab. Exit. Do not copy them or turn them into a template.",
    contextText ? `DOMAIN CONTEXT IS CONTEXT, NOT FACT: ${contextText}` : "",
  ].filter(Boolean).join("\n");
  return messages.map((message) => ({ ...message, content: `${message.content}\n${instructions}` }));
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  return parseLegacyBatch(raw);
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  const legacy = scoreLegacyCandidate(input);
  const sourceLabels = sourceLabelsForBeat(input.beat, input.envelope);
  const interpretation = evaluateMouthInterpretation({ text: input.text, sourceLabels, envelope: input.envelope, beat: input.beat });
  const concreteRisk = unsupportedConcreteClaimRisk(input.text, input.beat, input.envelope);
  const authorizedEventIds = [...new Set(input.beat.eventIds ?? [])].filter(Boolean);
  const lensInput = activeLensByBeat.get(input.beat as object) || undefined;

  if (concreteRisk >= 0.9) {
    return {
      ...legacy,
      inventionRisk: 1,
      forbiddenMoveRisk: 1,
      supportedEventIds: [],
      groundingScore: 0,
      obligationCoverage: 0,
      meaningScore: 0,
      transitionScore: 0,
      score: 0,
      reasons: [...new Set([...legacy.reasons, "unsupported-concrete-realization", "invention-risk"])],
    };
  }

  if (!interpretation.reasons.includes("semantic-compression")) {
    return legacy;
  }

  const lensFit = lensFitForCandidate(input.text, lensInput);
  const directTransformation = directTransformationSignal(input.text);
  const expressiveRealization = expressiveRealizationSignal(input.text, sourceLabels, input.beat);
  const groundedSurprise = groundedSurpriseForCandidate(input.text, input.beat, input.envelope, legacy, interpretation, lensInput);
  const experientialConsequence = experientialConsequenceSignal(input.text, sourceLabels, input.beat);
  const payoffReward = payoffRewardSignal(input.text, input.beat, input.envelope);

  const strongExpressiveRealization = expressiveRealization >= 0.66 && groundedSurprise >= 0.6;
  const strongExperientialConsequence = experientialConsequence >= 0.58 && groundedSurprise >= 0.58;

  const reasons = [...new Set([
    ...legacy.reasons,
    "semantic-compression",
    "semantic-turn-grounded",
    "bounded-creative-bet",
    ...(directTransformation >= 0.58 ? ["direct-transformation"] : []),
    ...(strongExpressiveRealization ? ["expressive-realization", "grounded-surprise"] : []),
    ...(strongExperientialConsequence ? ["experiential-consequence"] : []),
    ...(payoffReward >= 0.62 ? ["viewer-reward"] : []),
  ])];

  const meaningScore = metric(
    legacy.meaningScore * 0.38 +
      interpretation.creativeFraming * 0.2 +
      expressiveRealization * 0.14 +
      experientialConsequence * 0.14 +
      groundedSurprise * 0.1 +
      payoffReward * 0.04,
  );

  const transitionScore = metric(
    legacy.transitionScore * 0.38 +
      directTransformation * 0.15 +
      experientialConsequence * 0.16 +
      expressiveRealization * 0.1 +
      groundedSurprise * 0.12 +
      lensFit * 0.05 +
      payoffReward * 0.04,
  );

  const score = metric(
    legacy.score * 0.34 +
      meaningScore * 0.2 +
      transitionScore * 0.18 +
      groundedSurprise * 0.12 +
      expressiveRealization * 0.08 +
      lensFit * 0.04 +
      payoffReward * 0.04,
  );

  return {
    ...legacy,
    inventionRisk: Math.max(legacy.inventionRisk, interpretation.unsupportedConcreteRisk, concreteRisk),
    forbiddenMoveRisk: Math.max(legacy.forbiddenMoveRisk, concreteRisk),
    supportedEventIds: authorizedEventIds.length > 0 ? authorizedEventIds : legacy.supportedEventIds,
    groundingScore: legacy.groundingScore,
    obligationCoverage: legacy.obligationCoverage,
    meaningScore,
    transitionScore,
    noveltyScore: legacy.noveltyScore,
    reasons,
    score,
  };
}
