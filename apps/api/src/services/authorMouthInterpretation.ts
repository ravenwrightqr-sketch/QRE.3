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

/*
 * Compact semantic-risk vocabulary. This is not a domain rule or prop list;
 * it only catches common concrete-event claims so rhetorical creativity can
 * remain broad.
 */
const CONCRETE_CLAIM =
  /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared|paused?|pauses?|twitch(?:es|ed)?|flurry|vanished?|disappeared?|abandoned?|moved?|move|scurried?|bolted?)\b/i;

const CLAUSE_SUBJECT_MARKER =
  /^(?:she|he|they|it|we|you|i|someone|someone's|this|that|the\s+dog|the\s+girl|the\s+boy)\b/i;

/*
 * Generic framing signals. These describe rhetorical posture/abstraction,
 * not particular subjects or industries.
 */
const ABSTRACT_FRAMING =
  /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|mission|round|danger|victory|upgrade|boss|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|in\s+charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|finish|championship|joyous|dream|season|devotion|favorite|obsession|obsessed|fixation|thought|problem|wish|wonder)\b/i;

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
  const groundedConcreteFragment =
    wordCount <= 5 &&
    concreteClaim &&
    !CLAUSE_SUBJECT_MARKER.test(text) &&
    wholeSourceAnchor >= 0.45;

  const unsupportedConcreteRisk =
    concreteClaim &&
    !CONCRETE_CLAIM.test(wholeSourceText) &&
    !groundedConcreteFragment
      ? 1
      : 0;

  /*
   * Creative freedom deliberately stays broad. The source corpus supplies
   * grounding; the model supplies the particular attitude, joke, obsession,
   * dream, repetition, status play, metaphor, or payoff.
   *
   * Do not add example-specific prop, color, place, or industry rules here.
   */
  const frameSignal = ABSTRACT_FRAMING.test(text) || compactRhetoricalShape(text);
  const sourceExists = input.envelope.events.length > 0 || Boolean(wholeSourceText);
  const shortCreativeForm = wordCount <= 12;
  const derivedAnchor = Math.max(sourceAnchor, wholeSourceAnchor);
  const safeCreativeBet =
    Boolean(text) &&
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    shortCreativeForm &&
    sourceExists &&
    (derivedAnchor >= 0.08 || frameSignal || !CLAUSE_SUBJECT_MARKER.test(text));

  const groundingContribution = Math.min(0.45, derivedAnchor * 0.5);
  const framingContribution = frameSignal ? 0.3 : 0;
  const compressionContribution = shortCreativeForm ? 0.16 : 0;
  const creativeFraming = Number(
    Math.max(
      0,
      Math.min(
        1,
        groundingContribution +
          framingContribution +
          compressionContribution +
          (safeCreativeBet ? 0.18 : 0),
      ),
    ).toFixed(3),
  );

  const interpretive = Number(
    Math.max(
      0,
      Math.min(
        1,
        creativeFraming + wholeSourceAnchor * 0.2 + (frameSignal ? 0.08 : 0),
      ),
    ).toFixed(3),
  );

  const reasons: string[] = [];
  if (literalRestatement) reasons.push("literal-source-restatement");
  if (sourceAnchor >= 0.18) reasons.push("beat-source-anchored");
  if (wholeSourceAnchor >= 0.18) reasons.push("whole-reality-anchored");
  if (groundedConcreteFragment) reasons.push("grounded-concrete-fragment");
  if (frameSignal) reasons.push("viewer-facing-framing");
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
      (literalRestatement === 1 || safeCreativeBet),
    reasons,
  };
}
