/**
 * QRE MOUTH INTERPRETATION
 *
 * Distinguishes literal source restatement from viewer-facing interpretation.
 * Reality remains immutable. Interpretation may change attitude, status,
 * framing, implication, metaphor, or interface without creating a new event.
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

const ABSTRACT_FRAMING = /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|negotiations?|mission|round|danger|victory|upgrade|boss|royal|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|ready|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round)\b/i;

const CONCRETE_INVENTION = /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing)\b/i;

const INVENTED_FRAME_OBJECT = /\b(?:room|door|window|chair|table|floor|street|car|crowd|forest|castle|courtroom|office|hospital|bedroom|bathroom|kitchen)\b/i;
const FRAME_WORDS = /\b(?:mission|operation|round|boss|quest|game|speedrun|knockout|stun|finish|victory|championship|negotiations?|deal|terms?|case|verdict|heist|noir|royal|romance|rebel|pit\s*stop|upgrade|showtime|objective)\b/i;

export type MouthInterpretationEvaluation = {
  interpretive: number;
  sourceAnchor: number;
  frameSupport: number;
  literalRestatement: number;
  unsupportedConcreteRisk: number;
  accepted: boolean;
  reasons: string[];
};

export function evaluateMouthInterpretation(input: {
  text: string;
  sourceLabels: readonly string[];
  envelope: RealityEnvelope;
}): MouthInterpretationEvaluation {
  const text = clean(input.text);
  const sourceText = clean(input.sourceLabels.join(" "));
  const current = tokens(text);
  const source = tokens(sourceText);
  const sourceEventCount = input.envelope.events.length;
  const sourceHasAction = input.envelope.suppliedActions.length > 0;

  const sourceAnchor = overlap(current, source);
  const literalRestatement = input.sourceLabels.some((label) => {
    const a = text.replace(/[.!?]+$/g, "").toLowerCase();
    const b = clean(label).replace(/[.!?]+$/g, "").toLowerCase();
    return Boolean(a && b && a === b);
  }) ? 1 : 0;

  const frameSupport =
    FRAME_WORDS.test(text) && sourceEventCount >= 2 && sourceHasAction
      ? 0.85
      : 0;

  const unsupportedConcreteRisk =
    CONCRETE_INVENTION.test(text) &&
    !CONCRETE_INVENTION.test(sourceText)
      ? 1
      : INVENTED_FRAME_OBJECT.test(text) &&
          !INVENTED_FRAME_OBJECT.test(sourceText) &&
          !FRAME_WORDS.test(text)
        ? 0.8
        : 0;

  const framingSignal = ABSTRACT_FRAMING.test(text) ? 1 : 0;
  const interpretive = Math.max(
    0,
    Math.min(
      1,
      framingSignal * 0.3 +
        Math.max(0, sourceAnchor - 0.05) * 0.42 +
        frameSupport * 0.18 +
        (literalRestatement === 0 ? 0.1 : 0),
    ),
  );

  const reasons: string[] = [];
  if (literalRestatement) reasons.push("literal-source-restatement");
  if (sourceAnchor >= 0.18) reasons.push("source-anchored");
  if (frameSupport > 0) reasons.push("evidence-supported-frame");
  if (framingSignal) reasons.push("viewer-facing-framing");
  if (unsupportedConcreteRisk > 0) reasons.push("unsupported-concrete-invention");
  if (interpretive >= 0.45 && !literalRestatement) reasons.push("derivable-interpretation");

  return {
    interpretive: Number(interpretive.toFixed(3)),
    sourceAnchor: Number(sourceAnchor.toFixed(3)),
    frameSupport: Number(frameSupport.toFixed(3)),
    literalRestatement,
    unsupportedConcreteRisk,
    accepted:
      Boolean(text) &&
      (sourceAnchor >= 0.12 || frameSupport >= 0.8) &&
      literalRestatement === 0 &&
      unsupportedConcreteRisk === 0 &&
      interpretive >= 0.45,
    reasons,
  };
}
