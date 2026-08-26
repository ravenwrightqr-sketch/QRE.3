/**
 * QRE MOUTH INTERPRETATION
 *
 * Reality is immutable, but viewer-facing language may interpret the supplied
 * reality. This evaluator distinguishes:
 * - direct source restatement
 * - grounded creative interpretation
 * - unsupported concrete world invention
 *
 * The entire supplied reality corpus is available for interpretation. A beat
 * may therefore derive meaning from other supplied facts without pretending
 * those facts belong to the current beat.
 */

import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const tokens = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );

const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};

const ABSTRACT_FRAMING = /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|negotiations?|mission|round|danger|victory|upgrade|boss|royal|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round|joyous|dream|season)\b/i;

const STRONG_STATUS_FRAMING = /\b(?:own|owns|owned|belongs|belonged|in charge|control|controls|controlled|mine|master|boss|victory|won|win|winner|defeat|defeated|negotiations?|deal|terms?|verdict|guilty|innocent|case|mission|operation|round|quest|game|heist|royal|noir|romance|rebel|upgrade|showtime|pit\s*stop|speedrun|knockout|stun|finish|dream|season)\b/i;

/* Concrete verbs that normally assert a new world event rather than merely frame existing reality. */
const CONCRETE_INVENTION = /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared)\b/i;

const INVENTED_FRAME_OBJECT = /\b(?:room|door|window|chair|table|floor|street|car|crowd|forest|castle|courtroom|office|hospital|bedroom|bathroom|kitchen|spotlight|stage)\b/i;
const FRAME_WORDS = /\b(?:mission|operation|round|boss|quest|game|speedrun|knockout|stun|finish|victory|championship|negotiations?|deal|terms?|case|verdict|heist|noir|royal|romance|rebel|pit\s*stop|upgrade|showtime|objective)\b/i;
const HYPERBOLIC_FRAMING = /\b(?:everywhere|always|never|best|ultimate|dream|season|serious|finally|apparently|naturally|clearly|of course|nothing but|all|entire)\b/i;

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

  let unsupportedConcreteRisk = 0;

  if (
    CONCRETE_INVENTION.test(text) &&
    !CONCRETE_INVENTION.test(wholeSourceText)
  ) {
    unsupportedConcreteRisk = 1;
  } else if (
    INVENTED_FRAME_OBJECT.test(text) &&
    !INVENTED_FRAME_OBJECT.test(wholeSourceText) &&
    !FRAME_WORDS.test(text)
  ) {
    unsupportedConcreteRisk = 0.8;
  }

  /*
   * A grounded creative interpretation may use the entire supplied world,
   * not just the event currently being realized. This is the distinction that
   * lets "An apple, finally." and "A joyous tumble." survive without allowing
   * arbitrary scene invention.
   */
  const derivedInterpretationAnchor = Math.max(
    sourceAnchor,
    wholeSourceAnchor,
  );

  const creativeFraming = Math.max(
    0,
    Math.min(
      1,
      (1 - literalRestatement) * 0.28 +
        Math.max(0, derivedInterpretationAnchor - 0.08) * 0.42 +
        framingSignal * 0.18 +
        frameSupport * 0.12,
    ),
  );

  const interpretive = Math.max(
    0,
    Math.min(
      1,
      creativeFraming +
        wholeSourceAnchor * 0.18 +
        hyperbolicFraming * 0.08,
    ),
  );

  if (
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    derivedInterpretationAnchor < 0.05 &&
    frameSupport < 0.8 &&
    !strongStatusFraming
  ) {
    unsupportedConcreteRisk = 0.72;
  }

  const reasons: string[] = [];
  if (literalRestatement) reasons.push("literal-source-restatement");
  if (sourceAnchor >= 0.18) reasons.push("beat-source-anchored");
  if (wholeSourceAnchor >= 0.18) reasons.push("whole-reality-anchored");
  if (frameSupport > 0) reasons.push("evidence-supported-frame");
  if (framingSignal) reasons.push("viewer-facing-framing");
  if (strongStatusFraming) reasons.push("strong-status-framing");
  if (hyperbolicFraming) reasons.push("bounded-hyperbole");
  if (unsupportedConcreteRisk > 0) reasons.push("unsupported-concrete-invention");
  if (interpretive >= 0.45 && !literalRestatement) reasons.push("grounded-creative-interpretation");

  return {
    interpretive: Number(interpretive.toFixed(3)),
    sourceAnchor: Number(sourceAnchor.toFixed(3)),
    wholeSourceAnchor: Number(wholeSourceAnchor.toFixed(3)),
    frameSupport: Number(frameSupport.toFixed(3)),
    literalRestatement,
    creativeFraming: Number(creativeFraming.toFixed(3)),
    unsupportedConcreteRisk: Number(unsupportedConcreteRisk.toFixed(3)),
    accepted:
      Boolean(text) &&
      unsupportedConcreteRisk < 0.9 &&
      (derivedInterpretationAnchor >= 0.12 || frameSupport >= 0.8 || strongStatusFraming) &&
      (literalRestatement === 1 || interpretive >= 0.45),
    reasons,
  };
}
