/**
 * QRE MOUTH INTERPRETATION · CANONICAL
 *
 * The evaluator sits directly on the production Mouth path.
 *
 * Reality is immutable. Expression is flexible.
 * The evaluator therefore permits semantic compression and framing while
 * refusing unsupported concrete claims and premature temporal resolution.
 */

import type { MouthCandidateBeat } from "@qre/contracts";
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
  /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared|paused?|pauses?|twitch(?:es|ed)?|flurry|vanished?|disappeared?|abandoned?|moved?|move|scurried?|bolted?|gone|departed?|exited?)\b/i;

const TEMPORAL_RESOLUTION_CLAIM =
  /\b(?:gone|departed|departing|exited|left|away|finished|done|over|ended|complete|completed|cleared|wrapped|wrapped-up|wrapped up)\b/i;

const EXTERNAL_STATE_CLAIM =
  /\b(?:smell(?:s|ed|ing)?|sound(?:s|ed|ing)?|taste(?:s|d|ing)?|new\s+(?:scent|sound|look))\b/i;

const CLAUSE_SUBJECT_MARKER =
  /^(?:she|he|they|it|we|you|i|someone|someone's|this|that|the\s+dog|the\s+girl|the\s+boy)\b/i;

const ABSTRACT_FRAMING =
  /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|mission|round|danger|victory|upgrade|boss|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in\s+charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round|joyous|dream|season|devotion|seriousness|naturally|favorite|obsession|obsessed|fixation|thought|problem|wish|wonder|feeling|pull|current|pressure|warmth|silence|familiar|close|closer|distance|spark|gravity|drift|rush|calm|heat|cold|lightness|weight|connection|tension)\b/i;

const SEMANTIC_COMPRESSION_VERBS = new Set([
  "stay", "stayed", "stays", "remain", "remained", "remains",
  "keep", "kept", "keeps", "continued", "continue", "continues",
  "knew", "know", "knows", "felt", "feel", "feels",
  "waited", "wait", "waits",
]);

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "we", "us", "i", "you", "he", "she", "they",
  "it", "our", "my", "your", "their", "still", "just", "finally",
  "again", "already", "apparently",
]);

const INTERNAL_MACHINE_LANGUAGE =
  /\b(?:qre|compiler|cognition|meaning\s+spine|beat\s+graph|information\s+frontier|planner|planning|operator\s+mix|viewer\s+state|viewer\s+sees|audience\s+sees|writing\s+process|semantic\s+turn|semantic\s+trajectory|trajectory|realization\s+mode|information\s+gain|candidate\s+pool|candidate\s+sequence|sequence\s+arc|creative\s+lane|canonical\s+authority|approved\s+beat|beat\s+obligation|semantic\s+compression|grounding\s+score|novelty\s+score)\b/i;

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
  const value = clean(text);
  const count = value.split(/\s+/).filter(Boolean).length;
  if (!count || count > 12) return false;
  const terminal = /[.!?]$/.test(value);
  const fragment = !CLAUSE_SUBJECT_MARKER.test(value) && count <= 6;
  return terminal && (fragment || ABSTRACT_FRAMING.test(value));
}

function introducesUnsupportedPhysicalRelation(text: string, envelope: RealityEnvelope): boolean {
  const sourceCorpus = wholeSourceCorpus(envelope);
  const sourceTokens = tokens(sourceCorpus);
  const candidateTokens = tokens(text);

  if (/\b(?:between\s+(?:us|them|you)|with\s+(?:me|us|them|you)|among\s+us)\b/i.test(text) &&
      /\b(?:met|meet|meeting|talk|talked|talking|spoke|speaking|conversation|connected|shared|together|joined|visited|called|texted|messaged|worked|played|danced)\b/i.test(sourceCorpus)) {
    return false;
  }

  const physicalMarker =
    /\b(?:on|onto|under|beneath|above|over|behind|beside|inside|within|through|across|against|around|between|near|next\s+to|outside|into|out\s+of|from|with|without)\b/i.test(text);
  if (!physicalMarker) return false;

  const significant = [...candidateTokens].filter((token) => !FUNCTION_WORDS.has(token));
  if (significant.length < 2) return false;

  const grounded = significant.filter((token) => sourceTokens.has(token)).length;
  return grounded / Math.max(1, significant.length) < 0.5;
}

function semanticCompressionShape(
  text: string,
  sourceLabels: readonly string[],
  beat?: MouthCandidateBeat,
): boolean {
  const value = clean(text);
  const count = value.split(/\s+/).filter(Boolean).length;
  if (!count || count > 14) return false;
  if (CONCRETE_CLAIM.test(value) || EXTERNAL_STATE_CLAIM.test(value)) return false;
  if (TEMPORAL_RESOLUTION_CLAIM.test(value)) return false;
  if (INTERNAL_MACHINE_LANGUAGE.test(value)) return false;

  const current = tokens(value);
  const source = tokens(sourceLabels.join(" "));
  const significant = [...current].filter((token) => !FUNCTION_WORDS.has(token));
  const compressionVerb = significant.some((token) => SEMANTIC_COMPRESSION_VERBS.has(token));
  const framing = ABSTRACT_FRAMING.test(value) || compactRhetoricalShape(value);
  if (!compressionVerb && !framing) return false;

  const beatOverlap = overlap(current, source);
  if (beatOverlap >= 0.12) {
    const unknown = significant.filter(
      (token) =>
        !source.has(token) &&
        !SEMANTIC_COMPRESSION_VERBS.has(token) &&
        !ABSTRACT_FRAMING.test(token),
    );
    return unknown.length <= Math.max(1, Math.floor(significant.length / 3));
  }

  return Boolean(
    beat &&
    (beat.eventIds?.length || beat.attentionFunction || beat.change || beat.role || beat.relationKinds?.length),
  );
}

function temporalResolutionRisk(text: string, sourceLabels: readonly string[], beat?: MouthCandidateBeat): number {
  if (!beat || beat.paysOff?.length) return 0;
  if (!beat.next && !beat.frontier && beat.role === undefined) return 0;
  if (!TEMPORAL_RESOLUTION_CLAIM.test(text)) return 0;

  const localSource = sourceLabels.join(" ");
  const normalizedText = tokens(text);
  const normalizedSource = tokens(localSource);
  const localOverlap = overlap(normalizedText, normalizedSource);

  // A temporal endpoint is legitimate only when this beat's own approved
  // evidence actually contains that endpoint language.
  if (localOverlap >= 0.45 && TEMPORAL_RESOLUTION_CLAIM.test(localSource)) return 0;

  // Otherwise this is an early closure of information reserved for a later cut.
  return 1;
}

export function evaluateMouthInterpretation(input: {
  text: string;
  sourceLabels: readonly string[];
  envelope: RealityEnvelope;
  beat?: MouthCandidateBeat;
}): MouthInterpretationEvaluation {
  const text = clean(input.text);
  const sourceText = clean(input.sourceLabels.join(" "));
  const wholeText = wholeSourceCorpus(input.envelope);
  const current = tokens(text);
  const beatSource = tokens(sourceText);
  const wholeSource = tokens(wholeText);

  const sourceAnchor = overlap(current, beatSource);
  const wholeSourceAnchor = overlap(current, wholeSource);
  const literalRestatement = input.sourceLabels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === text.replace(/[.!?]+$/g, "").toLowerCase()) ? 1 : 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const concreteClaim = CONCRETE_CLAIM.test(text);
  const temporalClaim = TEMPORAL_RESOLUTION_CLAIM.test(text);
  const externalStateClaim = EXTERNAL_STATE_CLAIM.test(text);
  const unsupportedPhysicalRelation = introducesUnsupportedPhysicalRelation(text, input.envelope);
  const localTemporalRisk = temporalResolutionRisk(text, input.sourceLabels, input.beat);

  let unsupportedConcreteRisk =
    concreteClaim || externalStateClaim
      ? wholeSourceAnchor >= 0.45
        ? 0
        : 1
      : 0;

  if (temporalClaim && localTemporalRisk > 0) {
    unsupportedConcreteRisk = Math.max(unsupportedConcreteRisk, localTemporalRisk);
  }

  if (unsupportedPhysicalRelation || INTERNAL_MACHINE_LANGUAGE.test(text)) {
    unsupportedConcreteRisk = Math.max(unsupportedConcreteRisk, 1);
  }

  const sourceExists = Boolean(wholeText) || input.envelope.events.length > 0;
  const shortCreativeForm = wordCount > 0 && wordCount <= 12;
  const hasBeatSource = input.sourceLabels.length > 0;
  const beatTouchesLanguage = sourceAnchor >= 0.08;
  const semanticCompression = semanticCompressionShape(text, input.sourceLabels, input.beat);
  const frameSignal = ABSTRACT_FRAMING.test(text) || compactRhetoricalShape(text);
  const approvedSemanticBeat = Boolean(
    input.beat &&
    (input.beat.eventIds?.length || input.beat.attentionFunction || input.beat.change || input.beat.role || input.beat.relationKinds?.length),
  );

  const semanticBeatSupport = hasBeatSource
    ? beatTouchesLanguage || literalRestatement === 1 || semanticCompression ||
      (approvedSemanticBeat && frameSignal && unsupportedConcreteRisk === 0)
    : wholeSourceAnchor >= 0.08 || frameSignal;

  const associativeWorldSupport = Math.max(0, Math.min(1, wholeSourceAnchor * 0.55 + sourceAnchor * 0.45));
  const safeCreativeBet = Boolean(
    text &&
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    shortCreativeForm &&
    sourceExists &&
    semanticBeatSupport &&
    (hasBeatSource ? true : associativeWorldSupport >= 0.08 || frameSignal),
  );

  const groundingContribution = hasBeatSource
    ? Math.min(0.45, sourceAnchor * 0.5)
    : Math.min(0.45, wholeSourceAnchor * 0.5);
  const approvedBeatGrounding = approvedSemanticBeat && semanticCompression
    ? 0.36
    : approvedSemanticBeat && semanticBeatSupport && frameSignal
      ? 0.28
      : 0;
  const framingContribution = frameSignal ? 0.36 : 0;
  const compressionContribution = shortCreativeForm ? 0.14 : 0;
  const beatOwnershipContribution = hasBeatSource ? Math.min(0.3, sourceAnchor * 0.6) : 0;
  const creativeFraming = Number(Math.max(0, Math.min(1,
    groundingContribution +
    approvedBeatGrounding +
    framingContribution +
    compressionContribution +
    beatOwnershipContribution +
    (safeCreativeBet ? 0.2 : 0),
  )).toFixed(3));

  const interpretive = Number(Math.max(0, Math.min(1,
    creativeFraming +
    (hasBeatSource ? sourceAnchor : wholeSourceAnchor) * 0.22 +
    (frameSignal ? 0.1 : 0),
  )).toFixed(3));

  const reasons: string[] = [];
  if (literalRestatement) reasons.push("literal-source-restatement");
  if (sourceAnchor >= 0.18) reasons.push("beat-source-anchored");
  if (wholeSourceAnchor >= 0.18) reasons.push("whole-reality-anchored");
  if (wordCount <= 5 && concreteClaim && wholeSourceAnchor >= 0.45) reasons.push("grounded-concrete-fragment");
  if (frameSignal) reasons.push("viewer-facing-framing");
  if (approvedSemanticBeat) reasons.push("approved-beat-authority");
  if (hasBeatSource && semanticBeatSupport) reasons.push("beat-obligation-satisfied");
  if (semanticCompression) reasons.push("semantic-compression");
  if (safeCreativeBet) reasons.push("bounded-creative-bet");
  if (localTemporalRisk > 0) reasons.push("premature-temporal-resolution");
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
    accepted: Boolean(
      text &&
      unsupportedConcreteRisk < 0.9 &&
      (literalRestatement === 1 || safeCreativeBet || (!hasBeatSource && (frameSignal || wholeSourceAnchor >= 0.08))),
    ),
    reasons,
  };
}
