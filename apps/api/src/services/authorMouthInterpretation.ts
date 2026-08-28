/**
 * QRE MOUTH INTERPRETATION
 *
 * QRE CANONICAL AUTHOR LAW:
 * Reality is immutable. Expression is not.
 * QRE may surprise us.
 *
 * UNIVERSALITY LAW:
 * Examples are evidence of desired behavior, never domain rules.
 * Do not hard-code subjects, industries, props, colors, locations, or example
 * phrases merely because an edge case exposed them. Every rule must generalize.
 * Prefer a small number of strong principles over exception lists.
 *
 * The evaluator protects one thing directly: unsupported concrete world claims.
 * Everything else may be compressed, strange, funny, sharp, emotional,
 * rhetorical, fragmentary, hyperbolic, or otherwise creative when grounded in
 * the supplied corpus.
 */

import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokens = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3)
      .map(normalizeToken),
  );

const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};

const CONCRETE_CLAIM =
  /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared|paused?|pauses?|twitch(?:es|ed)?|flurry|vanished?|disappeared?|abandoned?|moved?|move|scurried?|bolted?)\b/i;

const EXTERNAL_STATE_CLAIM =
  /\b(?:smell(?:s|ed|ing)?|sound(?:s|ed|ing)?|taste(?:s|d|ing)?|look(?:s|ed|ing)?|changed|change|shifted|shift|different|new\s+(?:scent|sound|look|feeling))\b/i;

const CLAUSE_SUBJECT_MARKER =
  /^(?:she|he|they|it|we|you|i|someone|someone's|this|that|the\s+dog|the\s+girl|the\s+boy)\b/i;

const ABSTRACT_FRAMING =
  /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|mission|round|danger|victory|upgrade|boss|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|complimentary|sharp|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in\s+charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round|joyous|dream|season|devotion|seriousness|naturally|favorite|obsession|obsessed|fixation|thought|problem|wish|wonder)\b/i;

const SEMANTIC_COMPRESSION_VERBS = new Set([
  "stay", "stayed", "stays", "remain", "remained", "remains",
  "keep", "kept", "keeps", "continued", "continue", "continues",
  "knew", "know", "knows", "felt", "feel", "feels",
  "waited", "wait", "waits",
]);

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "we", "us", "i", "you", "he", "she", "they", "it",
  "our", "my", "your", "their", "still", "just", "finally", "again", "already", "apparently",
]);

const SEMANTIC_COMPRESSION_FRAMING = new Set(["fabulous", "complimentary"]);

export type MouthInterpretationEvaluation = {
  interpretive: number;
  sourceAnchor: number;
  wholeSourceAnchor: number;
  frameSupport: number;
  literalRestatement: number;
  creativeFraming: number;
  unsupportedConcreteRisk: number;
  accepted: boolean;
  reasons: string[];
};

function wholeSourceCorpus(envelope: RealityEnvelope): string {
  return clean([
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
}

function compactRhetoricalShape(text: string): boolean {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (!wordCount || wordCount > 12) return false;
  const terminal = /[.!?]$/.test(text);
  const fragment = !CLAUSE_SUBJECT_MARKER.test(text) && wordCount <= 6;
  const framing = ABSTRACT_FRAMING.test(text);
  return terminal && (fragment || framing);
}

function semanticCompressionShape(text: string, sourceLabels: readonly string[]): boolean {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0 || wordCount > 7) return false;
  if (CONCRETE_CLAIM.test(text) || EXTERNAL_STATE_CLAIM.test(text)) return false;

  const current = tokens(text);
  const source = tokens(sourceLabels.join(" "));
  const significant = [...current].filter((token) => !FUNCTION_WORDS.has(token));
  const compressionVerb = significant.some((token) => SEMANTIC_COMPRESSION_VERBS.has(token));
  const framing = ABSTRACT_FRAMING.test(text) ||
    significant.some((token) => SEMANTIC_COMPRESSION_FRAMING.has(token));

  if (!compressionVerb && !framing) return false;

  const unknown = significant.filter(
    (token) =>
      !source.has(token) &&
      !SEMANTIC_COMPRESSION_VERBS.has(token) &&
      !ABSTRACT_FRAMING.test(token) &&
      !SEMANTIC_COMPRESSION_FRAMING.has(token),
  );

  const touchesBeat = overlap(current, source) >= 0.04;

  // Do not let an unsupported property piggyback on a supplied noun.
  if (touchesBeat) return unknown.length === 0;

  // Permit one rhetorical noun for compact framing, while still rejecting
  // unrelated concrete reuse such as "Free mud." on a "feeling good" beat.
  return unknown.length <= 1;
}

export function evaluateMouthInterpretation(input: {
  text: string;
  sourceLabels: readonly string[];
  envelope: RealityEnvelope;
}): MouthInterpretationEvaluation {
  const text = clean(input.text);
  const beatSourceText = clean(input.sourceLabels.join(" "));
  const wholeSourceText = wholeSourceCorpus(input.envelope);
  const current = tokens(text);
  const beatSource = tokens(beatSourceText);
  const wholeSource = tokens(wholeSourceText);

  const sourceAnchor = overlap(current, beatSource);
  const wholeSourceAnchor = overlap(current, wholeSource);

  const literalRestatement = input.sourceLabels.some((label) => {
    const a = text.replace(/[.!?]+$/g, "").toLowerCase();
    const b = clean(label).replace(/[.!?]+$/g, "").toLowerCase();
    return Boolean(a && b && a === b);
  }) ? 1 : 0;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const concreteClaim = CONCRETE_CLAIM.test(text);
  const externalStateClaim = EXTERNAL_STATE_CLAIM.test(text);

  const groundedConcreteFragment =
    wordCount <= 5 &&
    concreteClaim &&
    !CLAUSE_SUBJECT_MARKER.test(text) &&
    wholeSourceAnchor >= 0.45;

  let unsupportedConcreteRisk = 0;
  if (
    concreteClaim &&
    !CONCRETE_CLAIM.test(wholeSourceText) &&
    !groundedConcreteFragment
  ) {
    unsupportedConcreteRisk = 1;
  }

  if (
    externalStateClaim &&
    !EXTERNAL_STATE_CLAIM.test(wholeSourceText)
  ) {
    unsupportedConcreteRisk = Math.max(unsupportedConcreteRisk, 1);
  }

  const frameSignal =
    ABSTRACT_FRAMING.test(text) ||
    compactRhetoricalShape(text);

  const sourceExists = input.envelope.events.length > 0 || Boolean(wholeSourceText);
  const shortCreativeForm = wordCount <= 12;
  const hasBeatSource = input.sourceLabels.length > 0;
  const beatTouchesLanguage = sourceAnchor >= 0.08;
  const semanticCompression = semanticCompressionShape(text, input.sourceLabels);

  /*
   * Lexical overlap is diagnostic, not the definition of semantic ownership.
   * The approved beat may be realized by a compact non-concrete compression
   * whose words do not occur in the source.
   */
  const semanticBeatSupport = hasBeatSource
    ? (
        beatTouchesLanguage ||
        literalRestatement === 1 ||
        semanticCompression ||
        (frameSignal && sourceAnchor >= 0.04)
      )
    : (
        wholeSourceAnchor >= 0.08 ||
        frameSignal
      );

  const associativeWorldSupport = Math.max(
    0,
    Math.min(1, wholeSourceAnchor * 0.55 + sourceAnchor * 0.45),
  );

  const safeCreativeBet =
    Boolean(text) &&
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    shortCreativeForm &&
    sourceExists &&
    semanticBeatSupport &&
    (
      hasBeatSource
        ? true
        : associativeWorldSupport >= 0.08 || frameSignal
    );

  const groundingContribution = hasBeatSource
    ? Math.min(0.45, sourceAnchor * 0.5)
    : Math.min(0.45, wholeSourceAnchor * 0.5);

  const framingContribution = frameSignal ? 0.36 : 0;
  const compressionContribution = shortCreativeForm ? 0.14 : 0;
  const beatOwnershipContribution = hasBeatSource
    ? Math.min(0.3, sourceAnchor * 0.6)
    : 0;

  const creativeFraming = Number(
    Math.max(
      0,
      Math.min(
        1,
        groundingContribution +
          framingContribution +
          compressionContribution +
          beatOwnershipContribution +
          (safeCreativeBet ? 0.2 : 0),
      ),
    ).toFixed(3),
  );

  const interpretive = Number(
    Math.max(
      0,
      Math.min(
        1,
        creativeFraming +
          (hasBeatSource ? sourceAnchor : wholeSourceAnchor) * 0.22 +
          (frameSignal ? 0.1 : 0),
      ),
    ).toFixed(3),
  );

  const reasons: string[] = [];
  if (literalRestatement) reasons.push("literal-source-restatement");
  if (sourceAnchor >= 0.18) reasons.push("beat-source-anchored");
  if (wholeSourceAnchor >= 0.18) reasons.push("whole-reality-anchored");
  if (groundedConcreteFragment) reasons.push("grounded-concrete-fragment");
  if (frameSignal) reasons.push("viewer-facing-framing");
  if (hasBeatSource && semanticBeatSupport) reasons.push("beat-obligation-satisfied");
  if (semanticCompression) reasons.push("semantic-compression");
  if (safeCreativeBet) reasons.push("bounded-creative-bet");
  if (unsupportedConcreteRisk > 0) reasons.push("unsupported-concrete-invention");
  if (interpretive >= 0.45 && !literalRestatement) reasons.push("grounded-creative-interpretation");

  return {
    interpretive,
    sourceAnchor: Number(sourceAnchor.toFixed(3)),
    wholeSourceAnchor: Number(wholeSourceAnchor.toFixed(3)),
    frameSupport: Number((frameSignal ? 0.8 : 0).toFixed(3)),
    literalRestatement,
    creativeFraming,
    unsupportedConcreteRisk,
    accepted:
      Boolean(text) &&
      unsupportedConcreteRisk < 0.9 &&
      (
        literalRestatement === 1 ||
        safeCreativeBet ||
        (!hasBeatSource && (frameSignal || wholeSourceAnchor >= 0.08))
      ),
    reasons,
  };
}
