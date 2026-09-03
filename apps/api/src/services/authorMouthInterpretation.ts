import type { MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

/**
 * CANONICAL MOUTH INTERPRETATION
 *
 * Cognition decides what the movie means. This layer only protects the
 * reality boundary and tests whether language performs an interpretation
 * rather than merely labeling an event.
 *
 * Reality freedom = low.
 * Framing freedom = high.
 */

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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalize = (value: string): string =>
  clean(value).replace(/[.!?]+$/g, "").toLowerCase();

const tokens = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'’-]+/g)
      .filter((token) => token.length >= 3),
  );

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by",
  "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are",
  "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her",
  "its", "he", "she", "they", "them", "you", "we", "me", "very", "really", "just", "already",
  "apparently", "anyway", "perhaps", "maybe",
]);

const INTERNAL = /\b(?:qre|cognition|planner|planning|beat|candidate|semantic|trajectory|viewer|audience|observer|objective|curiosity|prediction\s+error|state\s+shift|sequence|author|mouth|canonical|supplied\s+evidence|semantic\s+turn|relation\s+kind|payoff\s+dependency|memory\s+projection|future\s+thread|realization\s+mode|information\s+gain)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the relationship|the significance|this proves)\b/i;

/* These assert an occurrence rather than simply changing the frame. */
const ASSERTED_ACTION = /\b(?:walk(?:ed|s)?|run(?:s|ning)?|jump(?:ed|s|ing)?|grab(?:bed|s|bing)?|snatch(?:ed|es|ing)?|steal(?:s|ing)?|swip(?:ed|es|ing)?|kiss(?:ed|es|ing)?|hug(?:ged|s|ging)?|smil(?:ed|es|ing)?|laugh(?:ed|s|ing)?|cr(?:ied|ies|ying)|talk(?:ed|s|ing)?|sp(?:oke|eaks|eaking)|call(?:ed|s|ing)?|text(?:ed|s|ing)?|messag(?:ed|es|ing)?|touch(?:ed|es|ing)?|hold(?:s|ing)?|held|open(?:ed|s|ing)?|clos(?:ed|es|ing)?|enter(?:ed|s|ing)?|return(?:ed|s|ing)?|turn(?:ed|s|ing)?|watch(?:ed|es|ing)?|stare(?:d|s|ing)?|look(?:ed|s|ing)?|nod(?:ded|s|ding)?|shrug(?:ged|s|ging)?|bark(?:ed|s|ing)?|wag(?:ged|s|ging)?|sniff(?:ed|s|ing)?|sit(?:s|ting)?|sat|stand(?:s|ing)?|stood|move(?:d|s|ing)?|moved|throw|threw|catch|caught|dance(?:d|s|ing)?|drive|drove|push(?:ed|es|ing)?|pull(?:ed|s|ing)?|vanish(?:ed|es|ing)?|disappear(?:ed|s|ing)?)\b/i;

const PHYSICAL_RELATION = /\b(?:on|onto|under|beneath|above|over|behind|beside|inside|within|through|across|against|around|between|near|next\s+to|outside|into|out\s+of)\b/i;

/* Reject atmospheric noun-labels as "creative". */
const ATMOSPHERIC_NOMINAL = /^(?:a|an|the)\s+(?:weight|tremor|anticipation|beginning|cleansing|transformation|radiance|portrait|defiance|acquisition|joy|energy|silence|connection|tension|intensity|feeling|moment|presence|possibility|momentum|afterglow|resonance|lightness|stillness|softness)\b/i;

/* Interpretive universe terms are allowed when they function as frames. */
const FRAME_TERM = /\b(?:judge|judgment|inspection|review|case|verdict|evidence|mission|operation|negotiation|negotiations|level|boss|round|upgrade|status|clearance|peace|heist|extraction|trial|champion|championship|kingdom|official|final|reset|victory|winner|audit|showtime|knockout|secured|cleared|approved|reopened)\b/i;

const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};

function corpus(envelope: RealityEnvelope): string {
  return [
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].map(clean).filter(Boolean).join(" ");
}

function beatAuthorized(beat?: MouthCandidateBeat): boolean {
  return Boolean(
    beat && (
      beat.eventIds?.length ||
      beat.semanticRealization ||
      beat.relationKinds?.length ||
      beat.change ||
      beat.attentionFunction
    ),
  );
}

function isLegibleFrame(text: string, beat?: MouthCandidateBeat): boolean {
  const value = clean(text);
  if (!value || ATMOSPHERIC_NOMINAL.test(value)) return false;
  if (FRAME_TERM.test(value)) return true;
  const status = /\b(?:done|ready|fabulous|fierce|sharp|cool|temporary|apparently|finally|again|already|for now|peace)\b/i.test(value);
  return status && beatAuthorized(beat);
}

function concreteRisk(text: string, sourceText: string, beat?: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 1;
  if (INTERNAL.test(value) || EXPLANATION.test(value)) return 1;

  const source = tokens(sourceText);
  const candidate = tokens(value);
  const sourceOverlap = overlap(candidate, source);
  const firstPerson = /^(?:I|we|my|our|us)\b/i.test(value);
  const frame = isLegibleFrame(value, beat);

  /* A non-source action is factual unless it is clearly being used as a frame. */
  if (ASSERTED_ACTION.test(value) && sourceOverlap < 0.55 && !firstPerson && !frame) return 1;

  /* New physical relations are forbidden unless the relation is supported. */
  if (PHYSICAL_RELATION.test(value)) {
    const significant = [...candidate].filter((token) => !FUNCTION_WORDS.has(token));
    const grounded = significant.filter((token) => source.has(token)).length;
    if (significant.length >= 2 && grounded / significant.length < 0.5) return 1;
  }

  return 0;
}

export function evaluateMouthInterpretation(input: {
  text: string;
  sourceLabels: readonly string[];
  envelope: RealityEnvelope;
  beat?: MouthCandidateBeat;
}): MouthInterpretationEvaluation {
  const text = clean(input.text);
  const localSourceText = clean(input.sourceLabels.join(" "));
  const wholeSourceText = corpus(input.envelope);
  const candidate = tokens(text);
  const localSource = tokens(localSourceText);
  const wholeSource = tokens(wholeSourceText);

  const sourceAnchor = overlap(candidate, localSource);
  const wholeSourceAnchor = overlap(candidate, wholeSource);
  const literalRestatement = input.sourceLabels.some((label) => normalize(label) === normalize(text)) ? 1 : 0;
  const frame = isLegibleFrame(text, input.beat);
  const risk = concreteRisk(text, wholeSourceText, input.beat);
  const authorized = beatAuthorized(input.beat);
  const nonLabelRelationship = !ATMOSPHERIC_NOMINAL.test(text) && (
    sourceAnchor >= 0.14 ||
    (frame && authorized) ||
    /\b(?:but|yet|still|then|again|already|until|for now|temporary|only|just|why|what)\b/i.test(text)
  );

  const creativeFraming = Math.max(0, Math.min(1,
    (frame ? 0.42 : 0) +
      (nonLabelRelationship ? 0.34 : 0) +
      Math.min(0.16, wholeSourceAnchor * 0.16) +
      (authorized ? 0.08 : 0),
  ));

  const interpretive = Math.max(0, Math.min(1,
    creativeFraming +
      Math.min(0.2, sourceAnchor * 0.2) +
      (literalRestatement ? 0 : 0.05),
  ));

  const reasons: string[] = [];
  if (sourceAnchor >= 0.14) reasons.push("source-anchored");
  if (wholeSourceAnchor >= 0.14) reasons.push("whole-reality-anchored");
  if (frame) reasons.push("creative-frame");
  if (nonLabelRelationship) reasons.push("relationship-realization");
  if (literalRestatement) reasons.push("literal-restatement");
  if (ATMOSPHERIC_NOMINAL.test(text)) reasons.push("atmospheric-label");
  if (risk >= 0.9) reasons.push("unsupported-concrete");

  const accepted = Boolean(
    text &&
    risk < 0.9 &&
    !INTERNAL.test(text) &&
    !EXPLANATION.test(text) &&
    (literalRestatement || nonLabelRelationship || sourceAnchor >= 0.14),
  );

  return {
    interpretive: Number(interpretive.toFixed(3)),
    sourceAnchor: Number(sourceAnchor.toFixed(3)),
    wholeSourceAnchor: Number(wholeSourceAnchor.toFixed(3)),
    frameSupport: frame ? 1 : 0,
    literalRestatement,
    creativeFraming: Number(creativeFraming.toFixed(3)),
    unsupportedConcreteRisk: risk,
    accepted,
    reasons,
  };
}
