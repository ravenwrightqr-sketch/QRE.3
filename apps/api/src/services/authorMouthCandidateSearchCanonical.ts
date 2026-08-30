/*
 * QRE CANONICAL MOUTH CANDIDATE ADAPTER
 *
 * The legacy candidate search remains responsible for generation and its
 * existing safety metrics. This adapter is the canonical bridge that lets a
 * grounded semantic compression survive lexical-overlap scoring.
 *
 * The distinction is intentional:
 *   source wording -> diagnostic evidence
 *   approved beat   -> semantic ownership
 *   final language  -> realization
 *
 * Semantic compression can therefore change every source word while still
 * being authorized by the approved beat. Unsupported concrete invention is
 * still rejected by the existing evaluator.
 *
 * UNIVERSAL REALITY-SHAPE RULE:
 *   stable supplied reality -> discovery / accumulation / recurrence / attitude
 *   supplied event           -> event realization / story movement
 *
 * Reality shape changes what the source has actually authorized.
 * It does NOT create a new domain-specific Author.
 *
 * DEEPER EXPERIENCE:
 *   what happened -> what did that do -> what did it make newly meaningful
 *   -> Mouth expresses that consequence without explaining it.
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

const activeLensByBeat =
  new WeakMap<object, string>();

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: readonly string[]): string[] {
  return [
    ...new Set(
      values
        .map(clean)
        .filter(Boolean),
    ),
  ];
}

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on",
  "at", "for", "with", "from", "by", "through", "after", "before",
  "then", "now", "very", "just", "still", "again", "this", "that",
  "it", "is", "are", "was", "were", "be", "been", "being", "as",
  "into", "my", "your", "our", "their", "his", "her", "its", "he",
  "she", "they", "them", "you", "we", "me",
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
    [...tokenSet(value)].filter(
      (token) => !FUNCTION_WORDS.has(token),
    ),
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
  return Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );
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
            envelope.events.find(
              (event) => event.id === id,
            )?.label ?? "",
        )
        .map(clean)
        .filter(Boolean),
    ),
  ];
}

/**
 * Universal supplied-reality shape.
 *
 * stable:
 *   likes squirrels / likes the park / walks / likes apples
 * event:
 *   went to the park / saw squirrels / walked 25 minutes
 * state:
 *   nervous / happy
 *
 * This is not a domain mode. It only determines what the source itself has
 * actually authorized.
 */
type MouthRealityShape =
  | "stable"
  | "event"
  | "state"
  | "observation";

function realityShapeForLabel(
  label: string,
): MouthRealityShape {
  const value = clean(label).toLowerCase();
  if (!value) return "observation";

  if (
    /\b(?:went|came|arrived|left|returned|saw|met|found|lost|got|stole|took|gave|made|finished|started|opened|closed|walked|ran|drove|ate|drank|kissed|married|celebrated|played|visited|bought|sold|built|fixed|painted|wrote|called|laughed|cried|looked|felt|became|changed|did)\b/i.test(value)
  ) {
    return "event";
  }

  if (
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

function stableRealityEscalationRisk(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const realityShape = realityShapeForBeat(beat, envelope);

  if (realityShape !== "stable" && realityShape !== "state") return 0;

  const sourceLabels = sourceLabelsForBeat(beat, envelope);
  const wholeReality = [
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
  ].join(" ");

  const candidateTokens = meaningfulTokenSet(text);
  const sourceTokens = meaningfulTokenSet(
    [...sourceLabels, wholeReality].join(" "),
  );

  const meaningfulOverlap = overlap(candidateTokens, sourceTokens);
  const transformation = directTransformationSignal(text);

  if (
    transformation >= 0.58 &&
    (meaningfulOverlap >= 0.08 || expressiveVocabulary(text) || figurativeExpression(text))
  ) {
    return 0;
  }

  const words = clean(text).split(/\s+/).filter(Boolean);
  const lower = clean(text).toLowerCase();

  if (
    words.length <= 2 &&
    (
      meaningfulOverlap >= 0.08 ||
      expressiveVocabulary(text) ||
      /\b(?:almost|still|finally|again|then|before|after|nothing|everything|only|yet|never|no|already|somehow)\b/i.test(lower)
    )
  ) {
    return 0;
  }

  if (figurativeExpression(text)) return 0;
  if (meaningfulOverlap >= 0.18) return 0;

  const assertedClause =
    /\b(?:someone|something|someone's|the|a|an)\b.+\b(?:is|are|was|were|shifted|moved|ran|walked|went|came|left|looked|felt|smelled|sounded|tasted|appeared|disappeared|arrived|returned|stood|sat|held|carried|opened|closed|turned|drifted|bled|bloomed|danced|laughed|cried|talked|spoke|called|entered|exited)\b/i.test(text);

  const externalClaim =
    /\b(?:scent|smell|sound|taste|air|sky|cloud|rain|sunlight|moonlight|shadow|light|room|street|door|window|floor|wall|table|chair|car|road|house|building|garden|yard)\b/i.test(text);

  if (assertedClause || externalClaim) return 1;

  // Novel vocabulary is allowed. It is not, by itself, invention.
  return 0;
}

function directTransformationSignal(text: string): number {
  const value = clean(text);
  if (!value) return 0;

  const transformationVerb =
    /\b(?:became|becomes|turned|turns|faded|fade|eased|ease|lifted|lifts|softened|softens|opened|opens|gave|give|flowed|flows|dissolved|dissolve|bled|bleed|released|releases|settled|settles|loosened|loosens|lightened|lightens|changed|changes|shifted|shifts|broke|breaks|melted|melts)\b/i;

  const transformationStructure =
    /\b(?:\w+(?:ness)?\s+(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted)\b|\b(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted)\b)/i.test(value);

  if (!transformationVerb.test(value)) return 0;

  const words = value.split(/\s+/).filter(Boolean).length;
  const concise = words <= 7 ? 0.2 : words <= 11 ? 0.1 : 0;

  return metric(
    0.58 +
      (transformationStructure ? 0.2 : 0) +
      concise,
  );
}

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

  const compressed =
    words <= 8 ? 0.12 : words <= 12 ? 0.06 : 0;

  const semanticDeparture =
    sourceOverlap < 0.65 ? 0.1 : 0;

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
  const experientialConsequence = experientialConsequenceSignal(value, sourceLabels, beat);

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
    1 - Math.max(
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

function lensFitForCandidate(
  text: string,
  lensInput: string | undefined,
): number {
  const lens = classifyLens(lensInput);
  const candidateTokens = tokenSet(text);
  const framingTokens = tokenSet(lens.framingBias.join(" "));
  const preferenceTokens = tokenSet(lens.realizationPreferences.join(" "));
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

  const domainContextInstruction = domainContextText(input.domainContext)
    ? [
        "DOMAIN CONTEXT IS CONTEXT, NOT FACT.",
        `DOMAIN CONTEXT: ${domainContextText(input.domainContext)}`,
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
    "Ask internally: what the fuck did that do to me?",
    "Then ask: what did it make newly felt, newly meaningful, newly familiar, newly strange, newly possible, newly difficult, newly connected, newly wanted, or newly important?",
    "Search for the deeper experiential consequence of the supplied reality before choosing the final wording.",
    "The experiential consequence is an interpretation of supplied reality, not a new event or factual claim.",
    "Do not merely paraphrase when the accumulated material supports a deeper consequence.",
    "Let the realization express what changed inside the experience rather than explaining that change to the viewer.",
    "Look for meaningful collisions between things already established in the sequence.",
    "A collision may join meanings that seem opposite, distant, repetitive, unexpectedly compatible, newly familiar, newly strange, or newly important.",
    "Do not manufacture a contradiction. Discover a relationship already earned by the supplied material.",
    "A strong realization may make two earlier meanings suddenly belong together without explaining the relationship.",
    "Search for materially different semantic angles of the approved beat; do not merely rewrite the same idea three ways.",
    "When the approved meaning contains a state change, a direct transformation is a strong realization form: nerves eased, tension gave way, words flowed, time dissolved. Discover the actual wording; do not copy these examples.",
    "Prefer active transformation, continuation, contrast, recognition, consequence, imageable abstraction, or compressed residue when one naturally expresses the approved meaning.",
    "Article-led forms such as A, An, and The are fully allowed. Do not avoid them mechanically; prefer a more direct or active realization only when it is genuinely stronger.",
    "Avoid bare conceptual labels that merely name an interpretation without making the experience newly observable.",
    "Aim for grounded surprise: the wording can make the viewer think 'what the fuck was that?' and then immediately recognize why it fits.",
    "Do not force a joke, metaphor, genre trope, or dramatic flourish when the supplied material does not earn it.",
    "The lens may change attitude, framing, status, implication, rhythm, or emotional interpretation; it may not add concrete reality.",
    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",
  ].join(" ");

  return messages.map((message) => {
    const beatLines = input.beats
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

    return {
      ...message,
      content:
        `${message.content}\n${lensInstruction}\n${domainContextInstruction}\n${beatLines}`,
    };
  });
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

  const realityEscalationRisk = stableRealityEscalationRisk(
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

  if (realityEscalationRisk >= 0.9) {
    return {
      ...legacy,
      inventionRisk: Math.max(
        1,
        legacy.inventionRisk,
      ),
      forbiddenMoveRisk: 1,
      supportedEventIds: [],
      groundingScore: Math.min(legacy.groundingScore, 0),
      obligationCoverage: Math.min(legacy.obligationCoverage, 0),
      meaningScore: Math.min(legacy.meaningScore, 0.2),
      transitionScore: Math.min(legacy.transitionScore, 0.2),
      score: Math.min(legacy.score, 0.15),
      reasons: [
        ...new Set([
          ...legacy.reasons,
          "stable-reality-escalation",
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

  const strongExpressiveRealization =
    expressiveRealization >= 0.66 &&
    groundedSurprise >= 0.6;

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
        ? [
            "expressive-realization",
            "grounded-surprise",
          ]
        : []),
    ]),
  ];

  const meaningLift = metric(
    interpretation.creativeFraming * 0.5 +
      expressiveRealization * 0.24 +
      lensFit * 0.1 +
      groundedSurprise * 0.16,
  );

  const transitionLift = metric(
    legacy.transitionScore * 0.48 +
      directTransformation * 0.18 +
      expressiveRealization * 0.12 +
      groundedSurprise * 0.14 +
      lensFit * 0.08,
  );

  const scoreLift = metric(
    legacy.score * 0.48 +
      groundedSurprise * 0.24 +
      expressiveRealization * 0.18 +
      lensFit * 0.1,
  );

  return {
    ...legacy,
    inventionRisk: Math.min(
      legacy.inventionRisk,
      interpretation.unsupportedConcreteRisk,
      realityEscalationRisk,
    ),
    forbiddenMoveRisk: Math.max(
      legacy.forbiddenMoveRisk,
      realityEscalationRisk,
    ),
    supportedEventIds:
      authorizedEventIds.length > 0
        ? authorizedEventIds
        : legacy.supportedEventIds,
    groundingScore: Math.max(
      legacy.groundingScore,
      0.5,
    ),
    obligationCoverage: Math.max(
      legacy.obligationCoverage,
      0.5,
    ),
    meaningScore: Math.max(
      legacy.meaningScore,
      meaningLift,
    ),
    transitionScore: Math.max(
      legacy.transitionScore,
      transitionLift,
    ),
    noveltyScore: Math.max(
      legacy.noveltyScore,
      0.75,
    ),
    reasons,
    score: Math.max(
      legacy.score,
      scoreLift,
      0.68,
    ),
  };
}
