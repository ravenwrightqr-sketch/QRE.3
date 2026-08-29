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
 * rhetorical, fragmentary, hyperbolic, metaphorical, or otherwise creative
 * when grounded in the approved beat and supplied corpus.
 */

import type { MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();

  if (
    lower.length > 6 &&
    lower.endsWith("ing")
  ) {
    return lower.slice(0, -3);
  }

  if (
    lower.length > 5 &&
    lower.endsWith("ed")
  ) {
    return lower.slice(0, -2);
  }

  if (
    lower.length > 4 &&
    lower.endsWith("es")
  ) {
    return lower.slice(0, -2);
  }

  if (
    lower.length > 4 &&
    lower.endsWith("s")
  ) {
    return lower.slice(0, -1);
  }

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

const overlap = (
  a: Set<string>,
  b: Set<string>,
): number => {
  if (!a.size || !b.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) {
      hits += 1;
    }
  }

  return hits / Math.max(1, a.size);
};

const CONCRETE_CLAIM =
  /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared|paused?|pauses?|twitch(?:es|ed)?|flurry|vanished?|disappeared?|abandoned?|moved?|move|scurried?|bolted?)\b/i;

const EXTERNAL_STATE_CLAIM =
  /\b(?:smell(?:s|ed|ing)?|sound(?:s|ed|ing)?|taste(?:s|d|ing)?|new\s+(?:scent|sound|look))\b/i;
  
const CLAUSE_SUBJECT_MARKER =
  /^(?:she|he|they|it|we|you|i|someone|someone's|this|that|the\s+dog|the\s+girl|the\s+boy)\b/i;

const ABSTRACT_FRAMING =
  /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|mission|round|danger|victory|upgrade|boss|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in\s+charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round|joyous|dream|season|devotion|seriousness|naturally|favorite|obsession|obsessed|fixation|thought|problem|wish|wonder|feeling|pull|current|pressure|warmth|silence|familiar|close|closer|distance|spark|gravity|drift|rush|calm|heat|cold|lightness|weight|connection|tension)\b/i;

const SEMANTIC_COMPRESSION_VERBS = new Set([
  "stay",
  "stayed",
  "stays",
  "remain",
  "remained",
  "remains",
  "keep",
  "kept",
  "keeps",
  "continued",
  "continue",
  "continues",
  "knew",
  "know",
  "knows",
  "felt",
  "feel",
  "feels",
  "waited",
  "wait",
  "waits",
]);

const FUNCTION_WORDS = new Set([
  "the",
  "a",
  "an",
  "we",
  "us",
  "i",
  "you",
  "he",
  "she",
  "they",
  "it",
  "our",
  "my",
  "your",
  "their",
  "still",
  "just",
  "finally",
  "again",
  "already",
  "apparently",
]);

/*
 * These are not "bad words" in the ordinary sense.
 *
 * They are machine-facing concepts that must never leak into the
 * viewer-facing realization.
 */
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

function wholeSourceCorpus(
  envelope: RealityEnvelope,
): string {
  return clean(
    [
      envelope.subject,
      ...envelope.events.map(
        (event) => event.label,
      ),
      ...envelope.suppliedPhrases,
      ...envelope.suppliedEntities,
      ...envelope.suppliedActions,
      ...envelope.suppliedStates,
      ...envelope.recurringSignals,
      ...envelope.sensorySignals,
      ...envelope.unresolvedTensions,
    ].join(" "),
  );
}

function compactRhetoricalShape(
  text: string,
): boolean {
  const wordCount = text
    .split(/\s+/)
    .filter(Boolean).length;

  if (
    !wordCount ||
    wordCount > 12
  ) {
    return false;
  }

  const terminal = /[.!?]$/.test(text);

  const fragment =
    !CLAUSE_SUBJECT_MARKER.test(text) &&
    wordCount <= 6;

  const framing =
    ABSTRACT_FRAMING.test(text);

  return (
    terminal &&
    (fragment || framing)
  );
}
function introducesUnsupportedPhysicalRelation(
  text: string,
  envelope: RealityEnvelope,
): boolean {
  const sourceCorpus =
    wholeSourceCorpus(
      envelope,
    );

  const sourceTokens =
    tokens(sourceCorpus);

  const candidateTokens =
    tokens(text);

  /*
   * Physical relation language is structural rather than
   * domain-specific. These markers describe an asserted relation
   * between entities, locations, surfaces, bodies, environments,
   * or physical effects.
   *
   * This is intentionally NOT a list of physical nouns such as
   * "sun", "skin", "rain", etc.
   */
  const physicalRelationMarker =
    /\b(?:on|onto|under|beneath|above|over|behind|beside|inside|within|through|across|against|around|between|near|next\s+to|inside|outside|into|out\s+of|from|with|without)\b/i.test(
      text,
    );

  if (
    !physicalRelationMarker
  ) {
    return false;
  }

  /*
   * A relation marker by itself is insufficient. We need at least
   * two meaningful lexical units around which a physical relation
   * could be asserted.
   */
  const significant =
    [...candidateTokens].filter(
      (token) =>
        !FUNCTION_WORDS.has(
          token,
        ),
    );

  if (
    significant.length < 2
  ) {
    return false;
  }

  /*
   * Count how much of the asserted material is actually represented
   * in the supplied reality.
   *
   * A transformed expression may use new language freely, but a
   * physical relation cannot introduce unsupported concrete entities.
   */
  const grounded =
    significant.filter(
      (token) =>
        sourceTokens.has(token),
    ).length;

  return (
    grounded /
      Math.max(
        1,
        significant.length,
      ) <
    0.5
  );
}
/**
 * Semantic realization is not lexical substitution.
 *
 * Historically this function required overlap with source vocabulary.
 * That was too strict for approved semantic realizations such as:
 *
 *   "started nervous" -> "Nerves. Then..."
 *   "talked until close" -> "A dangerous current."
 *
 * The approved beat now owns the semantic territory.
 *
 * This function still protects against pure atmosphere and detached
 * cinematic labels when no beat-local evidence exists.
 */
function semanticCompressionShape(
  text: string,
  sourceLabels: readonly string[],
  beat?: MouthCandidateBeat,
): boolean {
  const wordCount = text
    .split(/\s+/)
    .filter(Boolean)
    .length;

  if (
    wordCount === 0 ||
    wordCount > 14
  ) {
    return false;
  }

  if (
    CONCRETE_CLAIM.test(text) ||
    EXTERNAL_STATE_CLAIM.test(text)
  ) {
    return false;
  }

  if (
    INTERNAL_MACHINE_LANGUAGE.test(text)
  ) {
    return false;
  }

  const current = tokens(text);

  const source = tokens(
    sourceLabels.join(" "),
  );

  const significant = [
    ...current,
  ].filter(
    (token) =>
      !FUNCTION_WORDS.has(token),
  );

  const compressionVerb =
    significant.some(
      (token) =>
        SEMANTIC_COMPRESSION_VERBS.has(
          token,
        ),
    );

  const framing =
    ABSTRACT_FRAMING.test(text) ||
    compactRhetoricalShape(text);

  if (
    !compressionVerb &&
    !framing
  ) {
    return false;
  }

  const beatOverlap =
    overlap(
      current,
      source,
    );
  


/*
 * Existing lexical path.
 *
 * When the realization clearly belongs to the source wording,
 * keep the stricter existing behavior.
 */
if (
  beatOverlap >= 0.12
) {

  
    const unknown =
      significant.filter(
        (token) =>
          !source.has(token) &&
          !SEMANTIC_COMPRESSION_VERBS.has(
            token,
          ) &&
          !ABSTRACT_FRAMING.test(
            token,
          ),
      );

    return (
      unknown.length <=
      Math.max(
        1,
        Math.floor(
          significant.length / 3,
        ),
      )
    );
  }

  /*
   * Canonical semantic ownership path.
   *
   * The beat has already been approved upstream by Cognition/Brain.
   * Therefore lexical overlap is NOT required for a transformed
   * realization.
   *
   * A short fragment may be a completely valid realization even when
   * it shares no literal vocabulary with the beat.
   */
  const hasApprovedBeat =
    Boolean(
      beat &&
      (
        beat.eventIds?.length ||
        beat.attentionFunction ||
        beat.change ||
        beat.role ||
        beat.relationKinds?.length
      ),
    );

  if (
    !hasApprovedBeat
  ) {
    return false;
  }

  /*
   * Machine-like abstract labels remain disallowed.
   *
   * Human-facing fragments remain allowed.
   *
   * Examples of valid expression:
   *   "The pull."
   *   "A familiar tremor."
   *   "Almost."
   *   "Love."
   *
   * Examples of machine residue:
   *   "The tightening."
   *   "The deepening."
   *   "The afterglow."
   *   "Oriented."
   */
  const bareNominalLabel =
    /^(?:the|a|an)\s+[a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2}\.?$/i.test(
      text,
    );

  const machineLikeNominalLabel =
    /^(?:the|a|an)\s+(?:tightening|deepening|afterglow|orientation|oriented|reframed|pressurized|resolved|disrupted|release)\.?$/i.test(
      text,
    );

  if (
    bareNominalLabel &&
    machineLikeNominalLabel
  ) {
    return false;
  }

  /*
   * Approved beats may authorize:
   *
   *   "Nerves. Then..."
   *   "A dangerous current."
   *   "Felt the pull towards us."
   *   "Almost."
   *   "Love."
   *   "Nothing happened. Everything changed."
   *
   * without requiring those lines to reuse source vocabulary.
   */
  return true;
}

export function evaluateMouthInterpretation(input: {
  text: string;
  sourceLabels: readonly string[];
  envelope: RealityEnvelope;
  beat?: MouthCandidateBeat;
}): MouthInterpretationEvaluation {
  const text = clean(input.text);

  const beatSourceText =
    clean(
      input.sourceLabels.join(" "),
    );

  const wholeSourceText =
    wholeSourceCorpus(
      input.envelope,
    );

  const current = tokens(text);

  const beatSource =
    tokens(
      beatSourceText,
    );

  const wholeSource =
    tokens(
      wholeSourceText,
    );

  const sourceAnchor =
    overlap(
      current,
      beatSource,
    );

  const wholeSourceAnchor =
    overlap(
      current,
      wholeSource,
    );

  const literalRestatement =
    input.sourceLabels.some(
      (label) => {
        const a =
          text
            .replace(
              /[.!?]+$/g,
              "",
            )
            .toLowerCase();

        const b =
          clean(label)
            .replace(
              /[.!?]+$/g,
              "",
            )
            .toLowerCase();

        return Boolean(
          a &&
          b &&
          a === b,
        );
      },
    )
      ? 1
      : 0;

  const wordCount =
    text
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const concreteClaim =
    CONCRETE_CLAIM.test(
      text,
    );

  const externalStateClaim =
    EXTERNAL_STATE_CLAIM.test(
      text,
    );
   const unsupportedPhysicalRelation =
  introducesUnsupportedPhysicalRelation(
    text,
    input.envelope,
  );
  const groundedConcreteFragment =
    wordCount <= 5 &&
    concreteClaim &&
    !CLAUSE_SUBJECT_MARKER.test(
      text,
    ) &&
    wholeSourceAnchor >= 0.45;

  /*
   * A candidate that is concrete or externally sensory must have actual
   * support somewhere in the supplied corpus. We deliberately do not
   * maintain a domain-specific forbidden-word list.
   */
  const concreteOrExternalClaim =
    concreteClaim ||
    externalStateClaim;

  const concreteSourceSupport =
    concreteOrExternalClaim &&
    wholeSourceAnchor >= 0.45;

  let unsupportedConcreteRisk =
  concreteOrExternalClaim &&
  !concreteSourceSupport
    ? 1
    : 0;

if (
  unsupportedPhysicalRelation
) {
  unsupportedConcreteRisk =
    Math.max(
      unsupportedConcreteRisk,
      1,
    );
}

  /*
   * Machine-facing language is never viewer-facing language.
   */
  if (
    INTERNAL_MACHINE_LANGUAGE.test(
      text,
    )
  ) {
    unsupportedConcreteRisk =
      Math.max(
        unsupportedConcreteRisk,
        1,
      );
  }

  const frameSignal =
    ABSTRACT_FRAMING.test(text) ||
    compactRhetoricalShape(text);

  const sourceExists =
    input.envelope.events.length > 0 ||
    Boolean(
      wholeSourceText,
    );

  const shortCreativeForm =
    wordCount <= 12;

  const hasBeatSource =
    input.sourceLabels.length > 0;

  const beatTouchesLanguage =
    sourceAnchor >= 0.08;

  const semanticCompression =
    semanticCompressionShape(
      text,
      input.sourceLabels,
      input.beat,
    );

  /*
   * The approved beat is the semantic authority.
   * It may authorize transformed expression without requiring lexical
   * overlap with the supplied wording.
   */
  const approvedSemanticBeat =
    Boolean(
      input.beat &&
      (
        input.beat.eventIds?.length ||
        input.beat.attentionFunction ||
        input.beat.change ||
        input.beat.role ||
        input.beat.relationKinds?.length
      ),
    );

  const semanticBeatSupport =
    hasBeatSource
      ? (
          beatTouchesLanguage ||
          literalRestatement === 1 ||
          semanticCompression ||
          (
            approvedSemanticBeat &&
            frameSignal &&
            unsupportedConcreteRisk === 0
          )
        )
      : (
          wholeSourceAnchor >= 0.08 ||
          frameSignal
        );

  const associativeWorldSupport =
    Math.max(
      0,
      Math.min(
        1,
        wholeSourceAnchor * 0.55 +
          sourceAnchor * 0.45,
      ),
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
        : associativeWorldSupport >= 0.08 ||
          frameSignal
    );

  const groundingContribution =
    hasBeatSource
      ? Math.min(
          0.45,
          sourceAnchor * 0.5,
        )
      : Math.min(
          0.45,
          wholeSourceAnchor * 0.5,
        );

  /*
   * Approved semantic beats receive a bounded grounding floor even when
   * lexical overlap is zero. This is authorization from Cognition/Brain,
   * not invented source evidence.
   */
  const approvedBeatGrounding =
    approvedSemanticBeat &&
    semanticCompression
      ? 0.36
      : approvedSemanticBeat &&
          semanticBeatSupport &&
          frameSignal
        ? 0.28
        : 0;

  const framingContribution =
    frameSignal
      ? 0.36
      : 0;

  const compressionContribution =
    shortCreativeForm
      ? 0.14
      : 0;

  const beatOwnershipContribution =
    hasBeatSource
      ? Math.min(
          0.3,
          sourceAnchor * 0.6,
        )
      : 0;

  const creativeFraming =
    Number(
      Math.max(
        0,
        Math.min(
          1,
          groundingContribution +
            approvedBeatGrounding +
            framingContribution +
            compressionContribution +
            beatOwnershipContribution +
            (
              safeCreativeBet
                ? 0.2
                : 0
            ),
        ),
      ).toFixed(3),
    );

  const interpretive =
    Number(
      Math.max(
        0,
        Math.min(
          1,
          creativeFraming +
            (
              hasBeatSource
                ? sourceAnchor
                : wholeSourceAnchor
            ) * 0.22 +
            (
              frameSignal
                ? 0.1
                : 0
            ),
        ),
      ).toFixed(3),
    );

  const reasons: string[] = [];

  if (
    literalRestatement
  ) {
    reasons.push(
      "literal-source-restatement",
    );
  }

  if (
    sourceAnchor >= 0.18
  ) {
    reasons.push(
      "beat-source-anchored",
    );
  }

  if (
    wholeSourceAnchor >= 0.18
  ) {
    reasons.push(
      "whole-reality-anchored",
    );
  }

  if (
    groundedConcreteFragment
  ) {
    reasons.push(
      "grounded-concrete-fragment",
    );
  }

  if (
    frameSignal
  ) {
    reasons.push(
      "viewer-facing-framing",
    );
  }

  if (
    approvedSemanticBeat
  ) {
    reasons.push(
      "approved-beat-authority",
    );
  }

  if (
    hasBeatSource &&
    semanticBeatSupport
  ) {
    reasons.push(
      "beat-obligation-satisfied",
    );
  }

  if (
    semanticCompression
  ) {
    reasons.push(
      "semantic-compression",
    );
  }

  if (
    safeCreativeBet
  ) {
    reasons.push(
      "bounded-creative-bet",
    );
  }

  if (
    unsupportedConcreteRisk > 0
  ) {
    reasons.push(
      "unsupported-concrete-invention",
    );
  }

  if (
    interpretive >= 0.45 &&
    !literalRestatement
  ) {
    reasons.push(
      "grounded-creative-interpretation",
    );
  }

  return {
    interpretive,

    sourceAnchor:
      Number(
        sourceAnchor.toFixed(3),
      ),

    wholeSourceAnchor:
      Number(
        wholeSourceAnchor.toFixed(3),
      ),

    frameSupport:
      Number(
        (
          frameSignal
            ? 0.8
            : 0
        ).toFixed(3),
      ),

    literalRestatement,

    creativeFraming,

    unsupportedConcreteRisk,

    accepted:
      Boolean(text) &&
      unsupportedConcreteRisk < 0.9 &&
      (
        literalRestatement === 1 ||
        safeCreativeBet ||
        (
          !hasBeatSource &&
          (
            frameSignal ||
            wholeSourceAnchor >= 0.08
          )
        )
      ),

    reasons,
  };
}
