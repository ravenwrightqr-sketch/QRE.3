/**
 * QRE MOUTH INTERPRETATION
 *
 * Reality is immutable, but viewer-facing language may interpret the supplied
 * reality. This evaluator distinguishes direct source restatement, grounded
 * creative interpretation, and unsupported concrete world invention.
 *
 * The entire supplied reality corpus is available for interpretation. A beat
 * may therefore derive meaning from other supplied facts without pretending
 * those facts belong to the current beat.
 *
 * QRE CANONICAL AUTHOR LAW:
 * ROLE: protect source truth while leaving the realization layer expressive.
 * LAW: QRE may surprise us.
 * Creative freedom is a scoring preference, not a stylistic cage.
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

const ABSTRACT_FRAMING = /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|negotiations?|mission|round|danger|victory|upgrade|boss|royal|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round|joyous|dream|season|devotion|seriousness|naturally|favorite|obsession|obsessed|fixation|thought|problem|wish|wonder)\b/i;

const STRONG_STATUS_FRAMING = /\b(?:own|owns|owned|belongs|belonged|in charge|control|controls|controlled|mine|master|boss|victory|won|win|winner|defeat|defeated|negotiations?|deal|terms?|verdict|guilty|innocent|case|mission|operation|round|quest|game|heist|royal|noir|romance|rebel|upgrade|showtime|pit\s*stop|speedrun|knockout|stun|finish|dream|season|devotion)\b/i;

/* Concrete verbs/actions that normally assert a new world event. */
const CONCRETE_INVENTION = /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared|paused?|pauses?|twitch(?:es|ed)?|flurry|vanished?|disappeared?|abandoned?)\b/i;

const INVENTED_FRAME_OBJECT = /\b(?:room|door|window|chair|table|floor|street|car|crowd|forest|castle|courtroom|office|hospital|bedroom|bathroom|kitchen|spotlight|stage|sidewalk|road|house)\b/i;
const FRAME_WORDS = /\b(?:mission|operation|round|boss|quest|game|speedrun|knockout|stun|finish|victory|championship|negotiations?|deal|terms?|case|verdict|heist|noir|royal|romance|rebel|pit\s*stop|upgrade|showtime|objective)\b/i;
const HYPERBOLIC_FRAMING = /\b(?:everywhere|always|never|best|ultimate|dream|season|serious|finally|apparently|naturally|clearly|of course|nothing but|all|entire|only|so many)\b/i;

/* Universal inner-life framing licensed by supplied preference/affinity facts. */
const PREFERENCE_SOURCE = /\b(?:like|likes|liked|love|loves|loved|adore|adores|adored|enjoy|enjoys|enjoyed|prefer|prefers|preferred|favorite|fond of|care about|cares about|cared about)\b/i;
const INNER_FRAMING = /\b(?:favorite|obsession|obsessed|fixation|devotion|thought|dream|dreaming|wish|wonder|problem)\b/i;

/*
 * A short nominal fragment can compress an explicitly supplied action without
 * asserting that the action newly happened here. Example: "Squirrel chase."
 * A clause with a subject and tense remains an event claim and stays guarded.
 */
const GROUNDED_ACTION_NOUN = /\b(?:chase|attack|kiss|hug|dance|run|walk|jump|snatch|grab|swipe|stare|smile|laugh|cry|whisper|scream|hold|carry|open|close|enter|leave|return|turn|kick|push|pull|throw|catch|pause|tumble|roll|wiggle|wriggle|wobble)\b/i;
const CLAUSE_SUBJECT_MARKER = /^(?:she|he|they|it|we|you|i|coco|someone|someone's|the\s+dog|the\s+girl|the\s+boy)\b/i;

/*
 * ATTITUDE / RHETORICAL FRAMING
 *
 * This is intentionally about linguistic posture, not domain templates.
 * Short rhetorical moves can introduce an imagined social frame, mock
 * authority, melodrama, irony, or status without asserting that the framed
 * prop/event exists in the world. Concrete subject facts still require source
 * evidence.
 *
 * Examples of the class, not mandatory outputs:
 *   "Already call the lawyer."
 *   "Absolutely not."
 *   "Fabulous exit."
 *   "Peace is temporary."
 *
 * Optional subject props remain source-bound: a bow, color, object, person,
 * location, or specific event may not become a subject fact merely because it
 * is common in the surrounding domain.
 */
const RHETORICAL_ATTITUDE = /\b(?:already\s+call|call\s+(?:the|my|a)\s+lawyer|call\s+the\s+law|your\s+honor|case\s+closed|absolutely\s+not|no+[,!]?|yes+[,!]?|please|seriously|of\s+course|fabulous|legendary|ridiculous|peace\s+is\s+temporary|temporary\s+peace|we\s+have\s+a\s+problem|problem\s+solved|disaster|crisis|emergency|negotiations|negotiation|officially|respectfully|excuse\s+me|excuse\s+this|well\s+then|there\s+it\s+is|game\s+over|showtime|enough|fine|fantastic|perfectly\s+acceptable|what\s+a\s+mistake|not\s+today|good\s+luck|plot\s+twist|fabulous\s+exit|mic\s+drop)\b/i;

const UNSUPPORTED_NEGATED_PROP = /\bno+\s+(?:the\s+)?([a-z][a-z'-]{2,})\b/i;
const COMMON_COLOR = /\b(?:red|blue|green|pink|purple|yellow|orange|brown|black|white|gray|grey|silver|gold)\b/i;
const ABSTRACT_NEGATION_SAFE = /^(?:problem|way|matter|idea|time|need|reason|chance|hope|fear|peace|luck|sense|joke|question|story|issue|deal|case)$/i;

function attitudeFramingSupport(beatSourceText: string, wholeSourceText: string): number {
  if (!RHETORICAL_ATTITUDE.test(beatSourceText) && !RHETORICAL_ATTITUDE.test(wholeSourceText)) {
    return 0;
  }
  return 0.88;
}

function unsupportedConcretePropRisk(text: string, wholeSourceText: string, wholeSource: Set<string>): number {
  const negated = UNSUPPORTED_NEGATED_PROP.exec(text)?.[1];
  if (negated && !ABSTRACT_NEGATION_SAFE.test(negated) && !wholeSource.has(normalizeToken(negated))) {
    return 0.92;
  }

  if (COMMON_COLOR.test(text) && !COMMON_COLOR.test(wholeSourceText)) {
    return 0.92;
  }

  return 0;
}

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
  const sourceEventCount = input.envelope.events.length;
  const sourceHasAction = input.envelope.suppliedActions.length > 0;
  const sourceHasState = input.envelope.suppliedStates.length > 0;

  const sourceAnchor = overlap(current, beatSource);
  const wholeSourceAnchor = overlap(current, wholeSource);
  const literalRestatement = input.sourceLabels.some((label) => {
    const a = text.replace(/[.!?]+$/g, "").toLowerCase();
    const b = clean(label).replace(/[.!?]+$/g, "").toLowerCase();
    return Boolean(a && b && a === b);
  }) ? 1 : 0;

  const frameSupport =
    FRAME_WORDS.test(text) && sourceEventCount >= 2 && sourceHasAction
      ? 0.85
      : 0;

  const framingSignal = ABSTRACT_FRAMING.test(text) ? 1 : 0;
  const strongStatusFraming = STRONG_STATUS_FRAMING.test(text);
  const hyperbolicFraming = HYPERBOLIC_FRAMING.test(text) ? 1 : 0;
  const preferenceFrameSupport =
    PREFERENCE_SOURCE.test(beatSourceText || wholeSourceText) && INNER_FRAMING.test(text)
      ? 0.9
      : 0;
  const attitudeSupport = attitudeFramingSupport(beatSourceText, wholeSourceText);

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const groundedActionFragment =
    wordCount <= 4 &&
    GROUNDED_ACTION_NOUN.test(text) &&
    !CLAUSE_SUBJECT_MARKER.test(text) &&
    overlap(current, wholeSource) >= 0.5;

  let unsupportedConcreteRisk = Math.max(
    0,
    unsupportedConcretePropRisk(text, wholeSourceText, wholeSource),
  );

  if (
    CONCRETE_INVENTION.test(text) &&
    !CONCRETE_INVENTION.test(wholeSourceText) &&
    !groundedActionFragment
  ) {
    unsupportedConcreteRisk = Math.max(unsupportedConcreteRisk, 1);
  } else if (
    INVENTED_FRAME_OBJECT.test(text) &&
    !INVENTED_FRAME_OBJECT.test(wholeSourceText) &&
    !FRAME_WORDS.test(text)
  ) {
    unsupportedConcreteRisk = Math.max(unsupportedConcreteRisk, 0.8);
  }

  /*
   * A grounded creative interpretation may use the entire supplied world,
   * not just the event currently being realized. This is the creative-bet
   * lane: allowed when the source itself contains action/state material and
   * the line remains short and free of unsupported concrete events.
   *
   * Preference/affinity facts also license inner-life framing. This is not a
   * pet rule: any supplied like/love/preference may become a favorite thought,
   * obsession, fixation, dream, devotion, or similarly compressed framing,
   * without implying a new physical event.
   *
   * Rhetorical attitude is its own lane. It may add invented posture or comic
   * framing, but never upgrades an optional subject prop or concrete event into
   * source truth.
   */
  const sourceShapeSupport = sourceHasAction || sourceHasState || sourceEventCount >= 1;
  const derivedInterpretationAnchor = Math.max(sourceAnchor, wholeSourceAnchor);
  const shortInterpretation = wordCount <= 8;
  const safeCreativeBet =
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    shortInterpretation &&
    (sourceShapeSupport || preferenceFrameSupport >= 0.8 || attitudeSupport >= 0.8);

  const creativeFraming = Math.max(
    0,
    Math.min(
      1,
      (1 - literalRestatement) * 0.24 +
        Math.max(0, derivedInterpretationAnchor - 0.05) * 0.34 +
        framingSignal * 0.16 +
        frameSupport * 0.1 +
        preferenceFrameSupport * 0.12 +
        attitudeSupport * 0.16 +
        (safeCreativeBet ? 0.1 : 0),
    ),
  );

  const interpretive = Math.max(
    0,
    Math.min(
      1,
      creativeFraming +
        wholeSourceAnchor * 0.18 +
        hyperbolicFraming * 0.08 +
        attitudeSupport * 0.08,
    ),
  );

  if (
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    !safeCreativeBet &&
    derivedInterpretationAnchor < 0.05 &&
    frameSupport < 0.8 &&
    preferenceFrameSupport < 0.8 &&
    attitudeSupport < 0.8 &&
    !strongStatusFraming
  ) {
    unsupportedConcreteRisk = 0.72;
  }

  const reasons: string[] = [];
  if (literalRestatement) reasons.push("literal-source-restatement");
  if (sourceAnchor >= 0.18) reasons.push("beat-source-anchored");
  if (wholeSourceAnchor >= 0.18) reasons.push("whole-reality-anchored");
  if (frameSupport > 0) reasons.push("evidence-supported-frame");
  if (preferenceFrameSupport >= 0.8) reasons.push("preference-supported-inner-framing");
  if (attitudeSupport >= 0.8) reasons.push("attitude-supported-framing");
  if (groundedActionFragment) reasons.push("grounded-action-fragment");
  if (framingSignal) reasons.push("viewer-facing-framing");
  if (strongStatusFraming) reasons.push("strong-status-framing");
  if (hyperbolicFraming) reasons.push("bounded-hyperbole");
  if (safeCreativeBet) reasons.push("bounded-creative-bet");
  if (unsupportedConcreteRisk > 0) reasons.push("unsupported-concrete-invention");
  if (interpretive >= 0.45 && !literalRestatement) reasons.push("grounded-creative-interpretation");

  return {
    interpretive: Number(interpretive.toFixed(3)),
    sourceAnchor: Number(sourceAnchor.toFixed(3)),
    wholeSourceAnchor: Number(wholeSourceAnchor.toFixed(3)),
    frameSupport: Number(Math.max(frameSupport, preferenceFrameSupport, attitudeSupport).toFixed(3)),
    literalRestatement,
    creativeFraming: Number(creativeFraming.toFixed(3)),
    unsupportedConcreteRisk: Number(unsupportedConcreteRisk.toFixed(3)),
    accepted:
      Boolean(text) &&
      unsupportedConcreteRisk < 0.9 &&
      (derivedInterpretationAnchor >= 0.12 || frameSupport >= 0.8 || preferenceFrameSupport >= 0.8 || attitudeSupport >= 0.8 || strongStatusFraming || safeCreativeBet) &&
      (literalRestatement === 1 || (safeCreativeBet ? interpretive >= 0.28 : interpretive >= 0.38)),
    reasons,
  };
}
