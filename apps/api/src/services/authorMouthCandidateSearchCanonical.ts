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

function tokenSet(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );
}

function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (!a.size || !b.size) {
    return 0;
  }

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) {
      hits += 1;
    }
  }

  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(
    Math.max(
      0,
      Math.min(1, value),
    ).toFixed(3),
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
 * Measures whether the candidate realizes the active lens rather than merely
 * being compatible with it by name.
 *
 * These are deliberately soft signals. Safety and semantic authorization
 * remain hard boundaries elsewhere.
 */
function lensFitForCandidate(
  text: string,
  lensInput: string | undefined,
): number {
  const lens = classifyLens(lensInput);
  const candidateTokens = tokenSet(text);

  const framingTokens = tokenSet(
    lens.framingBias.join(" "),
  );

  const preferenceTokens = tokenSet(
    lens.realizationPreferences.join(" "),
  );

  const framingFit = overlap(
    candidateTokens,
    framingTokens,
  );

  const preferenceFit = overlap(
    candidateTokens,
    preferenceTokens,
  );

  const antiGeneric =
    /\b(?:beautiful|magical|special|incredible|perfect|amazing|wonderful|journey|moment)\b/i.test(
      clean(text),
    )
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

/**
 * A direct state transformation makes change visible without requiring a
 * new concrete event.
 *
 * Examples of the desired shape:
 *   nerves eased
 *   nervousness faded
 *   tension gave way
 *   words flowed
 *   time dissolved
 *
 * This is intentionally structural rather than lexical: it does not ban
 * articles and it does not enumerate preferred phrases.
 */
function directTransformationSignal(
  text: string,
): number {
  const value = clean(text);

  if (!value) {
    return 0;
  }

  const transformationVerb =
    /\b(?:became|becomes|turned|turns|faded|fade|eased|ease|lifted|lifts|softened|softens|opened|opens|gave|give|flowed|flows|dissolved|dissolve|bled|bleed|released|releases|settled|settles|loosened|loosens|lightened|lightens|changed|changes|shifted|shifts|broke|breaks|melted|melts)\b/i;

  const transformationStructure =
    /\b(?:\w+(?:ness)?\s+(?:became|became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted)\b|\b(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted)\b)/i.test(value);

  if (!transformationVerb.test(value)) {
    return 0;
  }

  const words = value.split(/\s+/).filter(Boolean).length;
  const concise = words <= 7 ? 0.2 : words <= 11 ? 0.1 : 0;

  return metric(
    0.58 +
      (transformationStructure ? 0.2 : 0) +
      concise,
  );
}

/**
 * Distinguishes an expressive realization from a bare conceptual label.
 *
 * This is not a ban on abstract nouns or article-led forms. The question is
 * whether the line creates a felt/imageable/active realization rather than
 * simply naming a concept.
 */
function expressiveRealizationSignal(
  text: string,
  sourceLabels: readonly string[],
  beat: MouthCandidateBeat,
): number {
  const value = clean(text);
  if (!value) return 0;

  const words = value.split(/\s+/).filter(Boolean).length;
  const current = tokenSet(value);
  const source = tokenSet(sourceLabels.join(" "));
  const localOverlap = overlap(current, source);

  const directTransformation =
    directTransformationSignal(value);

  const activeVerb =
    /\b(?:became|turned|faded|eased|lifted|softened|opened|gave|flowed|dissolved|bled|released|settled|loosened|lightened|changed|shifted|broke|melted|stayed|keep|kept|continued|continued|waited|felt|feel)\b/i.test(value)
      ? 0.2
      : 0;

  const compressed =
    words <= 6 ? 0.14 : words <= 10 ? 0.06 : 0;

  const contrastive =
    /\b(?:but|yet|still|almost|only|except|instead|rather|never|not|nothing|everything|then|before|after|until)\b/i.test(value)
      ? 0.12
      : 0;

  const imageableAbstraction =
    /\b(?:current|pull|weight|spark|rush|drift|heat|cold|light|shadow|gravity|rumble|vibration|flow|quiet|tremor|pressure|edge|space|wave|fire|supernova|echo)\b/i.test(value)
      ? 0.18
      : 0;

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
  const candidateTokens = tokenSet(text);
  const localTokens = tokenSet(sourceLabels.join(" "));

  const worldTokens = tokenSet(
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
      legacy.noveltyScore * 0.05,
  );
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

  return messages.map((message) => ({
    ...message,
    content:
      `${message.content}\n${lensInstruction}\n${domainContextInstruction}`,
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

  if (!interpretation.reasons.includes("semantic-compression")) {
    return legacy;
  }

  const authorizedEventIds = [
    ...new Set(input.beat.eventIds ?? []),
  ].filter(Boolean);

  const lensInput =
    activeLensByBeat.get(input.beat as object) ||
    undefined;

  const lensFit = lensFitForCandidate(
    input.text,
    lensInput,
  );

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
        ? ["expressive-realization", "grounded-surprise"]
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
