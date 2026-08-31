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
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }
  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function sourceLabelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return [
    ...new Set(
      (beat.eventIds ?? [])
        .map(
          (id) =>
            envelope.events.find((event) => event.id === id)?.label ?? "",
        )
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
      .filter(
        (value) =>
          !/^(?:someone|something|it|this|that)$/i.test(
            value,
          ),
      ),
  );

  if (participants.size < 2) {
    return false;
  }

  const eventIds = new Set(
    beat.eventIds ?? [],
  );

  const beatEvents = envelope.events.filter(
    (event) =>
      eventIds.has(event.id),
  );

  if (!beatEvents.length) {
    return false;
  }

  const sharedInteraction =
    beatEvents.some((event) =>
      /\b(?:met|talked|talking|spoke|speaking|shared|together|between|with|connected|joined|visited|called|texted|messaged|worked|played|danced)\b/i.test(
        clean(event.label),
      ),
    );

  return sharedInteraction;
}
/**
 * Universal supplied-reality shape.
 *
 * This is about what the supplied material actually says, not the domain.
 */
type MouthRealityShape =
  | "stable"
  | "event"
  | "state"
  | "observation";

function realityShapeForLabel(label: string): MouthRealityShape {
  const value = clean(label).toLowerCase();
  if (!value) return "observation";

  if (
    /\b(?:went|came|arrived|left|returned|saw|met|found|lost|got|stole|took|gave|made|finished|started|opened|closed|walked|ran|drove|ate|drank|kissed|married|celebrated|played|visited|bought|sold|built|fixed|painted|wrote|called|laughed|cried|looked|felt|became|changed|did)\b/i.test(value) ||
    /\b(?:\d+\s*(?:minute|minutes|hour|hours|day|days|times?)|at\s+\d|today|yesterday|tomorrow|this\s+(?:morning|afternoon|evening|night)|last\s+(?:night|week|month|year)|next\s+(?:day|week|month|year))\b/i.test(value)
  ) {
    return "event";
  }

  if (
    /\b(?:likes?|loves?|prefers?|enjoys?|wants?|needs?|hates?|walks?|eats?|drinks?|plays?|knows?|keeps?|collects?|visits?|uses?|wears?|has|have|owns?)\b/i.test(value)
  ) {
    return "stable";
  }

  if (
    /\b(?:nervous|happy|sad|angry|calm|excited|tired|proud|afraid|scared|confident|quiet|loud|fierce|sweet|gentle|wild|goofy|stubborn|ready|different|changed)\b/i.test(value)
  ) {
    return "state";
  }

  return "observation";
}

function realityShapeForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): MouthRealityShape {
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

function figurativeExpression(text: string): boolean {
  const value = clean(text);
  return (
    /\b(?:like|as\s+if|as\s+though|almost\s+like|felt\s+like|seemed\s+like)\b/i.test(value) ||
    /\b(?:metaphorically|figuratively)\b/i.test(value)
  );
}

function expressiveVocabulary(text: string): boolean {
  return /\b(?:current|pull|weight|spark|rush|drift|heat|cold|light|shadow|gravity|rumble|vibration|flow|quiet|tremor|pressure|edge|space|wave|fire|supernova|echo|warmth|ease|lightness|tension|silence|distance|connection|recognition|release|calm|nerves|nervousness|awkwardness|closeness|uncertainty|comfort|relief|energy|rhythm|stillness|solace|familiar|strange|guard|grip|belonging|absence|presence)\b/i.test(clean(text));
}

/**
 * Stable-world language may introduce new words. Novel vocabulary is not
 * itself invention. The hard question is whether the candidate asserts a new
 * occurrence, environment, physical action, sensorium, or chronology.
 */
function unsupportedConcreteClaimRisk(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const value = clean(text).toLowerCase();

  if (!value) {
    return 1;
  }

  const sourceLabels =
    sourceLabelsForBeat(
      beat,
      envelope,
    );

  const sourceWorld = [
    ...sourceLabels,
    envelope.subject,
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ");

  const candidateTokens =
    meaningfulTokenSet(
      value,
    );

  const sourceTokens =
    meaningfulTokenSet(
      sourceWorld,
    );

  const sourceOverlap =
    overlap(
      candidateTokens,
      sourceTokens,
    );
   const directlySuppliedSource =
  sourceLabels.some((label) => {
    const labelTokens = meaningfulTokenSet(label);

    if (!labelTokens.size || !candidateTokens.size) {
      return false;
    }

    return (
      overlap(candidateTokens, labelTokens) === 1 &&
      overlap(labelTokens, candidateTokens) === 1
    );
  });

if (directlySuppliedSource) {
  return 0;
}
  /*
   * Direct experiential transformation is allowed when the supplied
   * material actually supports that kind of transformation.
   *
   * Example:
   *
   *   wanted to talk again
   *   -> the wanting settled
   *
   * The transformation changes the expression of an already-supported
   * meaning; it does not introduce another concrete occurrence.
   */
  const transformation =
    directTransformationSignal(
      value,
    );

  const consequence =
    experientialConsequenceSignal(
      value,
      sourceLabels,
      beat,
    );

  /*
   * Concrete occurrence vocabulary.
   *
   * These are dangerous because they commonly introduce something that
   * physically happened, appeared, moved, was sensed, or occurred in time.
   */
  const concreteOccurrence =
    /\b(?:glance|glanced|looked|looks|smiled|smile|touched|touch|held|hold|reached|reach|stood|stand|sat|sit|walked|walk|ran|run|opened|open|closed|close|entered|enter|left|leave|arrived|arrive|returned|return|called|call|texted|text|messaged|message|laughed|laugh|cried|cry|kissed|kiss|hugged|hug|turned|turn|moved|move|appeared|appear|disappeared|disappear|followed|follow|watched|watch|heard|hear|saw|see|smelled|smell|sounded|sound|tasted|taste|breathed|breathe|whispered|whisper|spoke|speak|talked|talk|danced|dance|drove|drive|ate|eat|drank|drink)\b/i.test(
      value,
    );

  /*
   * New physical/environmental objects are also dangerous when they are
   * being asserted as part of the scene.
   */
  const concreteSceneNoun =
    /\b(?:room|street|road|house|home|door|window|floor|wall|table|chair|car|garden|yard|sky|cloud|rain|sunlight|moonlight|shadow|light|air|smoke|water|path|frame|hallway|kitchen|bathroom|bed|phone|screen|hand|hands|face|eyes|shoulder|shoulders|body|voice|sound|scent|smell)\b/i.test(
      value,
    );

  /*
   * New chronology is a factual claim unless chronology was already
   * supplied by the source material.
   */
  const newChronology =
    /\b(?:suddenly|then|afterward|after|before|later|earlier|eventually|finally|already|again|next|that night|the next day|the following day|minutes? later|hours? later|days? later)\b/i.test(
      value,
    );

  /*
   * Article-led conceptual expressions can be excellent experiential
   * realization. Do not reject them merely because they are abstract.
   */
  const conceptualRealization =
    /\b(?:ease|lightness|warmth|tension|silence|distance|connection|recognition|release|calm|nerves|nervousness|awkwardness|closeness|uncertainty|comfort|relief|energy|rhythm|stillness|solace|familiar|strange|guard|grip|belonging|absence|presence|wanting|need|curiosity|pressure|momentum|possibility|permission|agreement|confirmation)\b/i.test(
      value,
    );

  /*
   * A candidate with strong concrete grounding is safe.
   */
  if (
    sourceOverlap >= 0.35 &&
    !concreteOccurrence &&
    !concreteSceneNoun &&
    !newChronology
  ) {
    return 0;
  }

  /*
   * Direct transformations are allowed only when the wording remains
   * experiential/conceptual rather than introducing a new physical scene.
   */
  if (
    transformation >= 0.58 &&
    consequence >= 0.45 &&
    conceptualRealization &&
    !concreteOccurrence &&
    !newChronology
  ) {
    return 0;
  }

  /*
   * Relational compression is allowed only when the supplied material
   * actually establishes a shared interaction.
   *
   * This does NOT authorize a new interaction such as a glance, touch,
   * kiss, smile, etc.
   */
  if (
    relationalCompressionAuthorized(
      beat,
      envelope,
    ) &&
    conceptualRealization &&
    !concreteOccurrence &&
    !newChronology &&
    sourceOverlap >= 0.08
  ) {
    return 0;
  }

  /*
   * Unsupported concrete content is a hard failure.
   */
  if (
    concreteOccurrence ||
    concreteSceneNoun ||
    newChronology
  ) {
    return 1;
  }

  /*
   * Conceptual language with a weak but nonzero source anchor can still
   * be a legitimate experiential realization.
   */
  if (
    conceptualRealization &&
    (
      transformation >= 0.58 ||
      consequence >= 0.58
    )
  ) {
    return 0;
  }

  return 0;
}
function lensFitForCandidate(
  text: string,
  lensInput: string | undefined,
): number {
  const lens = classifyLens(lensInput);
  const candidateTokens = meaningfulTokenSet(text);
  const framingTokens = meaningfulTokenSet(lens.framingBias.join(" "));
  const preferenceTokens = meaningfulTokenSet(lens.realizationPreferences.join(" "));

  const framingFit = overlap(candidateTokens, framingTokens);
  const preferenceFit = overlap(candidateTokens, preferenceTokens);

  const antiGeneric =
    /\b(?:beautiful|magical|special|incredible|perfect|amazing|wonderful|journey|moment)\b/i.test(clean(text))
      ? 0.2
      : 0;

  return metric(
    Math.max(
      0,
      framingFit * 0.52 +
        preferenceFit * 0.28 +
        lens.intensity * 0.2 -
        antiGeneric,
    ),
  );
}

function directTransformationSignal(text: string): number {
  const value = clean(text);
  if (!value) return 0;

  const transformationVerb =
    /\b(?:became|becomes|turned|turns|faded|fade|eased|ease|lifted|lifts|softened|softens|opened|opens|gave|give|flowed|flows|dissolved|dissolve|bled|bleed|released|releases|settled|settles|loosened|loosens|lightened|lightens|changed|changes|shifted|shifts|broke|breaks|melted|melts)\b/i;

  const transformationStructure =
    /\b(?:\w+(?:ness)?\s+(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted)|(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted))\b/i.test(value);

  if (!transformationVerb.test(value)) return 0;

  const words = value.split(/\s+/).filter(Boolean).length;
  const concise = words <= 7 ? 0.2 : words <= 11 ? 0.1 : 0;

  return metric(
    0.58 +
      (transformationStructure ? 0.2 : 0) +
      concise,
  );
}

/**
 * Deeper experiential consequence.
 *
 * Search one level below literal wording:
 *   what happened -> what did it do -> what did that make newly felt,
 *   meaningful, familiar, strange, possible, difficult, connected,
 *   wanted, or important?
 *
 * This is not permission to invent another event.
 */
function experientialConsequenceSignal(
  text: string,
  sourceLabels: readonly string[],
  beat: MouthCandidateBeat,
): number {
  const value = clean(text);
  if (!value) return 0;

  const words = value.split(/\s+/).filter(Boolean).length;
  const candidate = meaningfulTokenSet(value);
  const source = meaningfulTokenSet(sourceLabels.join(" "));
  const sourceOverlap = overlap(candidate, source);

  const consequenceVocabulary =
    /\b(?:opened|closed|shifted|changed|deepened|collapsed|eased|tightened|loosened|faded|settled|melted|flowed|stayed|remained|became|turned|pulled|released|connected|familiar|strange|closer|distant|distance|guard|grip|rhythm|silence|stillness|relief|tension|ease|recognition|curiosity|ache|weight|lightness|freedom|pressure|belonging|absence|presence|want|wanted|need|needed|almost|already|finally|again|still|somehow|suddenly)\b/i.test(value)
      ? 0.28
      : 0;

  const experientialStructure =
    /\b(?:something|nothing|everything|it|that|this|already|somehow|suddenly|finally|still|almost|again|too|just)\b/i.test(value)
      ? 0.14
      : 0;

  const consequenceVerb =
    /\b(?:opened|closed|changed|shifted|deepened|collapsed|eased|tightened|loosened|faded|settled|melted|flowed|stayed|remained|became|turned|pulled|released|connected|felt|feel|wanted|want|needed|need|lost|found|held)\b/i.test(value)
      ? 0.22
      : 0;

  const compressed = words <= 8 ? 0.12 : words <= 12 ? 0.06 : 0;
  const semanticDeparture = sourceOverlap < 0.65 ? 0.1 : 0;
  const beatAuthority =
    beat.eventIds?.length ||
    beat.change ||
    beat.attentionFunction ||
    beat.relationKinds?.length
      ? 0.12
      : 0;

  return metric(
    consequenceVocabulary +
      experientialStructure +
      consequenceVerb +
      compressed +
      semanticDeparture +
      beatAuthority,
  );
}

function expressiveRealizationSignal(
  text: string,
  sourceLabels: readonly string[],
  beat: MouthCandidateBeat,
): number {
  const value = clean(text);
  if (!value) return 0;

  const words = value.split(/\s+/).filter(Boolean).length;
  const current = meaningfulTokenSet(value);
  const source = meaningfulTokenSet(sourceLabels.join(" "));
  const localOverlap = overlap(current, source);
  const directTransformation = directTransformationSignal(value);
  const experientialConsequence = experientialConsequenceSignal(
    value,
    sourceLabels,
    beat,
  );

  const activeVerb =
    /\b(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted|stayed|keep|kept|continued|waited|felt|feel)\b/i.test(value)
      ? 0.2
      : 0;

  const compressed = words <= 6 ? 0.14 : words <= 10 ? 0.06 : 0;

  const contrastive =
    /\b(?:but|yet|still|almost|only|except|instead|rather|never|not|nothing|everything|then|before|after|until)\b/i.test(value)
      ? 0.12
      : 0;

  const imageableAbstraction = expressiveVocabulary(value) ? 0.18 : 0;

  const bareArticleLabel =
    /^(?:a|an|the)\s+[a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2}[.!?]?$/i.test(value);

  const conceptualLabel =
    /\b(?:assent|approval|recognition|connection|possibility|momentum|lightness|warmth|ease|release|permission|agreement|confirmation)\b/i.test(value);

  const labelPenalty =
    bareArticleLabel && conceptualLabel
      ? 0.18
      : conceptualLabel && words <= 3 && directTransformation < 0.5
        ? 0.08
        : 0;

  const beatAuthority =
    beat.eventIds?.length ||
    beat.change ||
    beat.attentionFunction ||
    beat.relationKinds?.length
      ? 0.18
      : 0;

  return metric(
    0.18 +
      directTransformation * 0.3 +
      experientialConsequence * 0.24 +
      activeVerb +
      compressed +
      contrastive +
      imageableAbstraction +
      beatAuthority * 0.4 +
      (localOverlap >= 0.08 ? 0.08 : 0) -
      labelPenalty,
  );
}

function groundedSurpriseForCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  legacy: MouthCandidate,
  interpretation: ReturnType<typeof evaluateMouthInterpretation>,
  lensInput: string | undefined,
): number {
  const sourceLabels = sourceLabelsForBeat(beat, envelope);
  const candidateTokens = meaningfulTokenSet(text);
  const localTokens = meaningfulTokenSet(sourceLabels.join(" "));

  const worldTokens = meaningfulTokenSet(
    [
      envelope.subject,
      ...envelope.events.map((event) => event.label),
      ...envelope.suppliedPhrases,
      ...envelope.suppliedEntities,
      ...envelope.suppliedActions,
      ...envelope.suppliedStates,
      ...envelope.recurringSignals,
      ...envelope.sensorySignals,
      ...envelope.unresolvedTensions,
    ].join(" "),
  );

  const localAnchor = overlap(candidateTokens, localTokens);
  const worldAnchor = overlap(candidateTokens, worldTokens);
  const semanticDistance = metric(Math.max(0, 1 - localAnchor));

  const recognition = metric(
    Math.max(
      worldAnchor,
      legacy.supportedEventIds.length > 0 ? 0.55 : 0,
      legacy.supportedRelationPairs.length > 0 ? 0.35 : 0,
    ),
  );

  const lensFit = lensFitForCandidate(text, lensInput);
  const expressiveness = expressiveRealizationSignal(text, sourceLabels, beat);
  const safety = metric(
    1 -
      Math.max(
        legacy.inventionRisk,
        legacy.forbiddenMoveRisk,
        interpretation.unsupportedConcreteRisk,
      ),
  );

  return metric(
    semanticDistance * 0.19 +
      recognition * 0.24 +
      lensFit * 0.2 +
      expressiveness * 0.16 +
      (interpretation.accepted ? 0.16 : 0) +
      legacy.noveltyScore * 0.05 +
      safety * 0.02,
  );
}
function domainContextText(
  context: MouthCandidateGenerationInput["domainContext"],
): string {
  return context
    ? [
        context.category,
        context.businessType,
        context.businessName,
        context.businessDescription,
        context.serviceType,
        context.serviceName,
        context.subjectKind,
        ...(context.knownCapabilities ?? []),
        ...(context.contextualSignals ?? []),
      ]
        .map(clean)
        .filter(Boolean)
        .join(" | ")
    : "";
}
export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  for (const beat of input.beats) {
    activeLensByBeat.set(beat as object, clean(input.lens));
  }

  const messages = buildLegacyMessages(input);
  const contextText = domainContextText(input.domainContext);

  const domainContextInstruction = contextText
    ? [
        "DOMAIN CONTEXT IS CONTEXT, NOT FACT.",
        `DOMAIN CONTEXT: ${contextText}`,
        "Use this context to understand the service/world and discover better framing. Never convert an unstated service step into a new factual event.",
      ].join(" ")
    : "";

  const lens = classifyLens(input.lens);
  const character = buildCharacterProfile(input.envelope);

  const lensInstruction = [
    `ACTIVE LENS: ${lens.label || "custom"}.`,
    `LENS FRAMING BIASES: ${lens.framingBias.join(", ")}.`,
    `LENS REALIZATION PREFERENCES: ${lens.realizationPreferences.join(", ")}.`,
    `LENS INTENSITY: ${lens.intensity}.`,
    `SUBJECT POSTURE: ${character.statusPosture}.`,
    `EMOTIONAL POSTURE: ${character.emotionalPosture}.`,
    "Use the lens to discover an unexpectedly exact framing of supplied meaning.",
    "Do not stop at literal restatement of what happened.",
    "By default, realize the experience without forcing a narrator or point of view.",
"Do not force you, I, we, us, them, or their unless the supplied material or explicit user instruction naturally calls for it.",
"Prefer language that can be inhabited directly by the person who lived the memory and can still be felt by someone encountering it later.",
"Render the experience itself rather than explaining who feels it or what the experience means.",
    "Ask internally: what the fuck did that do to me?",
    "Then ask what it made newly felt, newly meaningful, newly familiar, newly strange, newly possible, newly difficult, newly connected, newly wanted, or newly important.",
    "Search for the deeper experiential consequence before choosing the final wording.",
    "RELATIONAL COMPRESSION: when the supplied reality establishes multiple participants sharing an interaction or experience, you may realize the felt consequence between them without naming the relationship.",
    "Do not explain the relationship. Let the shared state emerge through compressed experiential language.",
    "Relational language may imply an already-established shared field, rhythm, current, distance, ease, tension, pull, or other experiential consequence.",
    "Do not invent a participant, identity, relationship status, motive, or concrete event.",
    "Prefer implication over explanation when the shared consequence is earned by the supplied reality.",
    "The experiential consequence is interpretation of supplied reality, not a new factual event.",
    "UNIVERSAL GOLD: search for what the supplied reality became, not merely what happened.",
"Discover the smallest unexpected truth that the supplied sequence has already earned.",
"Let accumulated facts create the realization; do not intensify them.",
"Do not invent motive, conflict, physical sensation, environmental change, danger, romance, status, or emotional intensity merely to make the line feel powerful.",
"A surprising realization is valuable only when the supplied material makes it feel inevitable in retrospect.",
    "Do not explain the meaning of the experience. Make the meaning perceptible through the realization.",
    "An ordinary supplied event may become a distinctive identity, relationship, rhythm, attitude, recognition, transformation, or final residue.",
   "Prefer implication over explanation when both are grounded.",
   "A realization may compress several supplied facts into one line when their relationship is already earned.",
   "Do not name a relationship, emotion, lesson, or significance merely to summarize it; let the accumulated reality reveal it.",
   "Gold may be quiet, funny, strange, tender, fierce, absurd, stylish, social, observational, or unexpected. The supplied reality determines the direction.",
   "Never force emotionality, poetry, drama, humor, romance, menace, or profundity. Discover what is actually alive in the material.",
   "Treat the subject as capable of acquiring a recognizable identity through accumulated supplied events without inventing unsupported facts.",
   "Treat established participants as capable of acquiring a shared experiential state without inventing a relationship status.",
    "Do not merely paraphrase an unexpected event as a sentence about its unexpectedness; discover what the unexpectedness actually changed or revealed.",
    "Look for meaningful collisions between things already established in the sequence.",
    "A collision may join meanings that seem opposite, distant, repetitive, unexpectedly compatible, newly familiar, newly strange, or newly important.",
    "Do not manufacture a contradiction. Discover a relationship already earned by the supplied material.",
    "A strong realization may make two earlier meanings suddenly belong together without explaining the relationship.",
    "Search for materially different semantic angles of the approved beat; do not merely rewrite the same idea three ways.",
    "When the approved meaning contains a state change, a direct transformation is a strong realization form: nerves eased, tension gave way, words flowed, time dissolved. Discover the actual wording; do not copy these examples.",
    "Prefer active transformation, continuation, contrast, recognition, consequence, imageable abstraction, or compressed residue when one naturally expresses the approved meaning.",
    "Article-led forms such as A, An, and The are fully allowed. Do not avoid them mechanically; prefer a more direct or active realization only when it is genuinely stronger.",
    "Do not equate shortness with quality. A tiny line is valuable when accumulated context gives it force; a longer line is valuable when it earns the extra words.",
    "Obsessive repetition, fragments, questions, weird observations, and abrupt compression are allowed when they emerge naturally from the supplied world.",
    "Do not force a joke, metaphor, genre trope, dramatic flourish, tension, romance, ominousness, or lesson when the supplied material does not earn it.",
    "The lens may change attitude, framing, status, implication, rhythm, or emotional interpretation; it may not add concrete reality.",
    "Aim for grounded surprise: the wording can make the viewer think 'what the fuck was that?' and then immediately recognize why it fits.",
    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",
  ].join(" ");

  const beatInstructions = input.beats
    .map((beat) => {
      const shape = realityShapeForBeat(beat, input.envelope);
      const source = sourceLabelsForBeat(beat, input.envelope);

      return [
        `BEAT ${beat.order} REALITY SHAPE: ${shape}.`,
        `BEAT ${beat.order} SUPPLIED MATERIAL: ${source.join(" | ") || "none"}.`,
        shape === "stable"
          ? "This beat contains stable supplied world knowledge, preference, habit, or persistent material. You may compress it, repeat it, obsess over it, compare it, joke about it, or give it attitude. Do not turn it into a new encounter, physical event, environmental condition, sensory occurrence, or chronology."
          : shape === "state"
            ? "This beat contains a supplied state. You may realize the state experientially or show a supported transformation of it. Do not invent a new physical event."
            : shape === "event"
              ? "This beat contains supplied event material. You may realize what happened, compress it, reframe it, connect it to the sequence, or let it participate in an actual story."
              : "This beat contains supplied observational material. Keep the observation grounded while allowing expressive realization.",
      ].join(" ");
    })
    .join(" ");

  return messages.map((message) => ({
    ...message,
    content:
      `${message.content}\n${lensInstruction}\n${domainContextInstruction}\n${beatInstructions}`,
  }));
}

export function parseMouthCandidateBatch(
  raw: string,
): MouthCandidateBatch | undefined {
  return parseLegacyBatch(raw);
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  const legacy = scoreLegacyCandidate(input);
  const sourceLabels = sourceLabelsForBeat(input.beat, input.envelope);

  const interpretation = evaluateMouthInterpretation({
    text: input.text,
    sourceLabels,
    envelope: input.envelope,
    beat: input.beat,
  });

  const concreteRisk =
  unsupportedConcreteClaimRisk(
    input.text,
    input.beat,
    input.envelope,
  );

  const authorizedEventIds = [
    ...new Set(input.beat.eventIds ?? []),
  ].filter(Boolean);

  const lensInput =
    activeLensByBeat.get(input.beat as object) ||
    undefined;

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

    score: 0.05,

    reasons: [
      ...new Set([
        ...legacy.reasons,
        "unsupported-concrete-realization",
        "invention-risk",
      ]),
    ],
  };
}

  if (!interpretation.reasons.includes("semantic-compression")) {
    return legacy;
  }

  const lensFit = lensFitForCandidate(input.text, lensInput);
  const directTransformation = directTransformationSignal(input.text);
  const expressiveRealization = expressiveRealizationSignal(
    input.text,
    sourceLabels,
    input.beat,
  );
  const groundedSurprise = groundedSurpriseForCandidate(
    input.text,
    input.beat,
    input.envelope,
    legacy,
    interpretation,
    lensInput,
  );
  const experientialConsequence = experientialConsequenceSignal(
    input.text,
    sourceLabels,
    input.beat,
  );

  const strongExpressiveRealization =
    expressiveRealization >= 0.66 && groundedSurprise >= 0.6;

  const strongExperientialConsequence =
    experientialConsequence >= 0.58 && groundedSurprise >= 0.58;

  const reasons = [
    ...new Set([
      ...legacy.reasons,
      "semantic-compression",
      "semantic-turn-grounded",
      "bounded-creative-bet",
      ...(directTransformation >= 0.58
        ? ["direct-transformation"]
        : []),
      ...(strongExpressiveRealization
        ? ["expressive-realization", "grounded-surprise"]
        : []),
      ...(strongExperientialConsequence
        ? ["experiential-consequence"]
        : []),
    ]),
  ];

  const meaningLift = metric(
    interpretation.creativeFraming * 0.42 +
      expressiveRealization * 0.22 +
      experientialConsequence * 0.18 +
      lensFit * 0.08 +
      groundedSurprise * 0.1,
  );

  const transitionLift = metric(
    legacy.transitionScore * 0.42 +
      directTransformation * 0.16 +
      experientialConsequence * 0.18 +
      expressiveRealization * 0.1 +
      groundedSurprise * 0.1 +
      lensFit * 0.04,
  );

  const scoreLift = metric(
    legacy.score * 0.42 +
      groundedSurprise * 0.22 +
      expressiveRealization * 0.14 +
      experientialConsequence * 0.14 +
      lensFit * 0.08,
  );

  return {
    ...legacy,
    inventionRisk: Math.max(
  legacy.inventionRisk,
  interpretation.unsupportedConcreteRisk,
  concreteRisk,
),
    forbiddenMoveRisk: Math.max(
      legacy.forbiddenMoveRisk,
      concreteRisk,
    ),
    supportedEventIds:
      authorizedEventIds.length > 0
        ? authorizedEventIds
        : legacy.supportedEventIds,
    groundingScore: Math.max(legacy.groundingScore, 0.5),
    obligationCoverage: Math.max(legacy.obligationCoverage, 0.5),
    meaningScore: Math.max(legacy.meaningScore, meaningLift),
    transitionScore: Math.max(legacy.transitionScore, transitionLift),
    noveltyScore: Math.max(legacy.noveltyScore, 0.75),
    reasons,
    score: Math.max(
      legacy.score,
      scoreLift,
      0.68,
    ),
  };
}
