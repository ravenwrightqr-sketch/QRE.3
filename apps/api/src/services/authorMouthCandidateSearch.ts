/**
 * STATUS: CANONICAL
 * ROLE: Ask the model for viewer-facing wording for already-approved beats.
 *
 * CORE LAW:
 *
 * Reality is immutable. Expression is not.
 *
 * Mouth may compress, sharpen, reframe, surprise, imply, metaphorize,
 * contradict, fragment, or otherwise find stronger human expression of
 * already-approved material.
 *
 * The evaluator protects unsupported concrete reality directly.
 *
 * Candidate diversity is a search-space law, not a style template.
 */

import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
  ViewerStateCut,
} from "@qre/contracts";

import type { RealityEnvelope } from "./authorRealityEnvelope.js";

import {
  evaluateMouthInterpretation,
} from "./authorMouthInterpretation.js";

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
};

const clean = (
  value: unknown,
): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const unique = (
  values: readonly unknown[],
): string[] =>
  [...new Set(
    values
      .map(clean)
      .filter(Boolean),
  )];

const META =
  /\b(?:qre|compiler|cognition|meaning spine|beat graph|information frontier|planner|planning|operator mix|viewer sees|audience sees|writing process)\b/i;

const GENERIC =
  /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;

const BAD_INTERPRETIVE_EXPLANATION =
  /\b(?:the viewer|this reveals|this means|which means|in this context|is now transformed into|was a cover for|reveals? that|symbolizes?|represents?|the mystery|what does .* mean|why does .* mean|the final revelation|the punchline here)\b/i;

const PLANNING_RESIDUE =
  /\b(?:perform the approved semantic change|maintain forward movement|anchor the realization|allow later supplied evidence|preserve the source-derived endpoint|terminate on the supplied endpoint|do not merely restate|what relationship deserves|what becomes connected|what does this relationship make newly meaningful|what is now true at the supplied ending|the supplied endpoint lands|establish supplied evidence)\b/i;

const PHYSICAL_INVENTION =
  /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|enters?|approaches?|leaves?|returns?|turns?|steps?|swipes?|swiped|grips?|grabbed|throws?|threw|pulls?|pulled|pushes?|pushed|kicks?|kicked|touches?|touched|holds?|held|carries?|carried|opens?|opened|closes?|closed|drifts?|drifted|vanishes?|vanished)\b/i;

const INTERNAL_VIEWER_LANGUAGE =
  /\b(?:uncommitted|oriented|settled|disrupted|curious|pressurized|certain|reframed|engaged|breathing|expectant|resolved)\b/i;

const ABSTRACT_NOUNISH =
  /\b(?:warmth|connection|recognition|loosening|ease|momentum|lightness|relief|anticipation|possibility|opening|silence|current|pull|tension|distance|gravity|comfort|energy|rhythm|feeling|shift|bloom|flow|stillness|space|pressure|weight|closeness|uncertainty|quiet|heat|cold|spark|drift|rush|calm)\b/i;

const LOW_INFORMATION_PHRASE =
  /^(?:something(?:\s+\w+){0,3}|it was something|a moment|the moment|a feeling|the feeling|something changed|something shifted|everything changed)\.?$/i;

const CONTRAST_LANGUAGE =
  /\b(?:but|yet|still|almost|only|except|instead|rather|never|not|no|nothing|everything|suddenly|until|before|after|then)\b/i;

/**
 * Generic concrete-world signals rather than domain rules.
 *
 * These exist only to detect newly introduced factual-looking details
 * absent from the supplied corpus.
 *
 * Experiential language remains open.
 */
const CONCRETE_DETAIL_MARKER =
  /\b(?:footsteps?|room|rooms|street|streets|door|doors|window|windows|table|tables|chair|chairs|floor|floors|wall|walls|ceiling|bed|beds|car|cars|truck|trucks|road|roads|sidewalk|sidewalks|house|houses|building|buildings|garden|gardens|yard|yards|sky|cloud|clouds|rain|snow|sunlight|moonlight|lamp|lamps|lighting|lights|music|song|songs|voice|voices|skin|hand|hands|finger|fingers|eyes|eye|face|faces|hair|clothes|shirt|dress|phone|phones|coffee|cup|cups|glass|glasses|food|drink)\b/i;

const IDENTITY_DETAIL_MARKER =
  /\b(?:he|him|his|she|her|hers|the man|the woman|the boy|the girl|the guy|the lady|girlfriend|boyfriend|wife|husband|mother|father|daughter|son|sister|brother|partner)\b/i;
const normalizeToken = (
  token: string,
): string => {
  const lower =
    token.toLowerCase();

  if (
    lower.length > 6 &&
    lower.endsWith("ing")
  ) {
    return lower.slice(
      0,
      -3,
    );
  }

  if (
    lower.length > 5 &&
    lower.endsWith("ed")
  ) {
    return lower.slice(
      0,
      -2,
    );
  }

  if (
    lower.length > 4 &&
    lower.endsWith("es")
  ) {
    return lower.slice(
      0,
      -2,
    );
  }

  if (
    lower.length > 4 &&
    lower.endsWith("s")
  ) {
    return lower.slice(
      0,
      -1,
    );
  }

  return lower;
};

const tokenSet = (
  text: string,
): Set<string> =>
  new Set(
    clean(text)
      .toLowerCase()
      .split(
        /[^a-z0-9'-]+/i,
      )
      .filter(
        (token) =>
          token.length >= 3,
      )
      .map(
        normalizeToken,
      ),
  );

function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (
    !a.size ||
    !b.size
  ) {
    return 0;
  }

  let hits = 0;

  for (
    const token of a
  ) {
    if (
      b.has(token)
    ) {
      hits += 1;
    }
  }

  return (
    hits /
    Math.max(
      1,
      a.size,
    )
  );
}

function metric(
  value: number,
): number {
  return Number(
    Math.max(
      0,
      Math.min(
        1,
        value,
      ),
    ).toFixed(3),
  );
}

function phraseSupportedText(
  candidateText: string,
  label: string,
): boolean {
  const phrase =
    clean(
      label,
    ).toLowerCase();

  const candidate =
    clean(
      candidateText,
    ).toLowerCase();

  if (
    !phrase ||
    !candidate
  ) {
    return false;
  }

  return (
    candidate.includes(
      phrase,
    ) ||
    overlap(
      tokenSet(candidate),
      tokenSet(phrase),
    ) >= 0.5
  );
}

function eventLabel(
  envelope: RealityEnvelope,
  id: string,
): string {
  return clean(
    envelope.events.find(
      (event) =>
        event.id === id,
    )?.label,
  );
}

function identityEvidenceText(
  envelope: RealityEnvelope,
): string {
  return clean(
    [
      envelope.subject,
      ...envelope.events.map(
        (event) =>
          event.label,
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

/**
 * Candidate-specific identity compatibility.
 *
 * Important:
 *
 * Identity is not permitted merely because some identity exists somewhere
 * in the corpus. The candidate's actual identity-bearing language must be
 * supported by supplied evidence.
 */
function hasSupportedIdentityLanguage(
  text: string,
  envelope: RealityEnvelope,
): boolean {
  const candidate =
    clean(
      text,
    ).toLowerCase();

  if (
    !IDENTITY_DETAIL_MARKER.test(
      candidate,
    )
  ) {
    return true;
  }

  const evidence =
    identityEvidenceText(
      envelope,
    );

  const feminineEvidence =
    /\b(?:female|woman|girl|lady|wife|girlfriend|daughter|sister|she|her|hers)\b/i.test(
      evidence,
    );

  const masculineEvidence =
    /\b(?:male|man|boy|guy|husband|boyfriend|son|brother|he|him|his)\b/i.test(
      evidence,
    );

  const relationalEvidence =
    /\b(?:partner|mother|father|daughter|son|sister|brother|wife|husband|girlfriend|boyfriend)\b/i.test(
      evidence,
    );

  if (
    /\b(?:she|her|hers|the woman|the girl|the lady|my girlfriend|her girlfriend|his girlfriend|my wife)\b/i.test(
      candidate,
    )
  ) {
    return feminineEvidence;
  }

  if (
    /\b(?:he|him|his|the man|the boy|the guy|my boyfriend|her boyfriend|his boyfriend|my husband)\b/i.test(
      candidate,
    )
  ) {
    return masculineEvidence;
  }

  if (
    /\b(?:my partner|their partner|the partner|partner)\b/i.test(
      candidate,
    )
  ) {
    return relationalEvidence;
  }

  if (
    /\b(?:mother|father|daughter|son|sister|brother|wife|husband|girlfriend|boyfriend)\b/i.test(
      candidate,
    )
  ) {
    return relationalEvidence;
  }

  return true;
}

/**
 * HARD PROVENANCE BOUNDARY:
 * Only event IDs resolve into source labels.
 * Planning metadata never becomes source truth.
 */
function sourceForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return unique(
    (beat.eventIds ?? [])
      .map(
        (id) =>
          eventLabel(
            envelope,
            id,
          ),
      )
      .filter(Boolean),
  );
}

function supportedEventsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): Array<{
  id: string;
  label: string;
}> {
  return (
    beat.eventIds ?? []
  )
    .map(
      (id) => ({
        id,
        label:
          eventLabel(
            envelope,
            id,
          ),
      }),
    )
    .filter(
      (event) =>
        Boolean(
          event.label,
        ),
    );
}

function relationPairsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const ids =
    new Set(
      beat.eventIds ?? [],
    );

  return unique(
    envelope.relations
      .filter(
        (relation) =>
          ids.has(
            relation.from,
          ) &&
          ids.has(
            relation.to,
          ),
      )
      .map(
        (relation) =>
          `${relation.from}:${relation.kind}:${relation.to}`,
      ),
  );
}

function endpointExactForBeat(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): boolean {
  const labels =
    supportedEventsForBeat(
      beat,
      envelope,
    ).map(
      (event) =>
        event.label,
    );

  const normalized =
    clean(text)
      .replace(
        /[.!?]+$/g,
        "",
      )
      .toLowerCase();

  return labels.some(
    (label) =>
      normalized ===
      clean(label)
        .replace(
          /[.!?]+$/g,
          "",
        )
        .toLowerCase(),
  );
}

function matchesInternalViewerState(
  text: string,
  viewerState?: ViewerStateCut,
): boolean {
  if (!viewerState) {
    return false;
  }

  return (
    INTERNAL_VIEWER_LANGUAGE.test(
      text,
    ) &&
    overlap(
      tokenSet(text),
      tokenSet(
        `${viewerState.beforeState} ${viewerState.afterState}`,
      ),
    ) >= 0.75
  );
}

/**
 * Protects against new factual-looking world details.
 *
 * Identity is deliberately handled separately so candidate-specific identity
 * compatibility becomes part of the same final concrete-risk boundary.
 *
 * This function therefore handles:
 * - unsupported generic physical/environmental detail
 * - unsupported physical action
 *
 * while leaving metaphor, attitude, compression, and experiential language
 * available to Mouth.
 */
function introducesUnsupportedConcreteDetail(
  text: string,
  wholeSourceText: string,
): boolean {
  const value =
    clean(text);

  if (!value) {
    return false;
  }

  const source =
    clean(
      wholeSourceText,
    );

  if (
    CONCRETE_DETAIL_MARKER.test(
      value,
    )
  ) {
    const abstractOnly =
      ABSTRACT_NOUNISH.test(
        value,
      ) &&
      !/\b(?:the|a|an|my|your|our|their|his|her|this|that)\s+\w+/i.test(
        value,
      );

    if (!abstractOnly) {
      const sourceTokens =
        tokenSet(source);

      const matchedConcreteToken =
        value
          .toLowerCase()
          .match(
            CONCRETE_DETAIL_MARKER,
          )?.[0];

      if (
        matchedConcreteToken
      ) {
        const normalized =
          normalizeToken(
            matchedConcreteToken,
          );

        if (
          !sourceTokens.has(
            normalized,
          )
        ) {
          return true;
        }
      }
    }
  }

  return (
    PHYSICAL_INVENTION.test(
      value,
    ) &&
    !PHYSICAL_INVENTION.test(
      source,
    )
  );
}
export function deriveViewerStateCut(
  beat: MouthCandidateBeat,
  index: number,
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): ViewerStateCut {
  const currentIds =
    unique(
      beat.eventIds ?? [],
    );

  const priorBeats =
    beats.slice(
      0,
      index,
    );

  const priorIds =
    new Set(
      priorBeats.flatMap(
        (item) =>
          item.eventIds ?? [],
      ),
    );

  const newEventCount =
    currentIds.filter(
      (id) =>
        !priorIds.has(id),
    ).length;

  const newEventRatio =
    currentIds.length
      ? metric(
          newEventCount /
            currentIds.length,
        )
      : 0;

  /*
   * ONLY SOURCE MATERIAL enters the cognitive state.
   *
   * attentionFunction is deliberately excluded because it may contain
   * authoring instructions for Mouth.
   *
   * We also do not treat `next` as the current state. It is future
   * expectation pressure.
   */
  const currentSource =
    sourceForBeat(
      beat,
      envelope,
    ).join(" ");

  const priorSource =
    priorBeats
      .flatMap(
        (item) =>
          sourceForBeat(
            item,
            envelope,
          ),
      )
      .join(" ");

  const cleanSemanticText = (
    value: string,
  ): string =>
    clean(value)
      .replace(
        /\b(?:establish|another|the supplied sequence|make this supplied material|this supplied sequence)\b[^:]{0,80}:\s*/gi,
        "",
      )
      .replace(
        /\b(?:canonical semantic thesis|canonical semantic turn|canonical relation|canonical before|canonical after|canonical payoff dependency)\b[^.]*\.?\s*/gi,
        "",
      )
      .trim();

  const currentChange =
    cleanSemanticText(
      clean(
        beat.change,
      ),
    );

  const usableCurrentMeaning =
    currentChange ||
    currentSource ||
    "new material";

  const priorMeanings =
    priorBeats
      .map(
        (item) =>
          cleanSemanticText(
            clean(
              item.change,
            ),
          ) ||
          sourceForBeat(
            item,
            envelope,
          ).join(" "),
      )
      .filter(Boolean);

  const priorMeaning =
    priorMeanings.length
      ? priorMeanings[
          priorMeanings.length - 1
        ]
      : "";

  /*
   * Lexical continuity is used only as evidence of whether this cut
   * continues an existing thread or introduces a different one.
   *
   * It is NOT treated as attention itself.
   */
  const continuity =
    priorSource &&
    currentSource
      ? metric(
          overlap(
            tokenSet(
              currentSource,
            ),
            tokenSet(
              priorSource,
            ),
          ),
        )
      : 0;

  const relationPresence =
    Boolean(
      beat.relationKinds?.length,
    );

  const semanticDifference =
    priorMeaning &&
    usableCurrentMeaning
      ? metric(
          1 -
            overlap(
              tokenSet(
                usableCurrentMeaning,
              ),
              tokenSet(
                priorMeaning,
              ),
            ),
        )
      : index === 0
        ? 0.55
        : 0.35;

  /*
   * New evidence plus semantic difference produces an information
   * transition. Neither signal alone is sufficient.
   */
  const informationTurn =
    metric(
      newEventRatio * 0.42 +
        semanticDifference * 0.33 +
        (
          relationPresence
            ? 0.15
            : 0
        ) +
        (
          continuity < 0.35
            ? 0.10
            : 0
        ),
    );

  /*
   * Contrast is the amount of meaningful change between the current
   * material and the accumulated material.
   */
  const contrast =
    metric(
      informationTurn * 0.58 +
        (
          continuity < 0.45
            ? 0.22
            : 0
        ) +
        (
          relationPresence
            ? 0.20
            : 0
        ),
    );

  /*
   * Interruption means the current cut changes the trajectory the
   * observer was following.
   *
   * We deliberately do not derive this from rhetorical words like
   * "but" or "suddenly".
   */
  const interruption =
    metric(
      informationTurn * 0.46 +
        contrast * 0.31 +
        (
          index === 0
            ? 0.08
            : 0
        ) +
        (
          continuity < 0.3
            ? 0.15
            : 0
        ),
    );

  /*
   * Curiosity is unresolved semantic pressure.
   *
   * A future question contributes to curiosity, but does not define
   * the present viewer state.
   */
  const futurePressure =
    clean(
      beat.next ||
      beat.frontier ||
      "",
    );

  const curiosityPressure =
    metric(
      (
        beat.paysOff?.length
          ? 0.10
          : index >=
              beats.length - 1
            ? 0.18
            : 0.42
      ) +
        (
          futurePressure
            ? 0.28
            : 0
        ) +
        informationTurn * 0.20 +
        (
          relationPresence
            ? 0.12
            : 0
        ),
    );

  const payoffPressure =
    metric(
      beat.paysOff?.length
        ? 1
        : index ===
            beats.length - 2
          ? 0.82
          : Math.min(
              0.68,
              0.22 +
                index * 0.09,
            ),
    );

  /*
   * State shift is the central signal.
   *
   * This represents how much the observer's interpretation has moved,
   * not how different the words look.
   */
  const stateShift =
    metric(
      informationTurn * 0.32 +
        contrast * 0.20 +
        interruption * 0.16 +
        curiosityPressure * 0.12 +
        semanticDifference * 0.10 +
        (
          relationPresence
            ? 0.10
            : 0
        ),
    );

  const predictionError =
    metric(
      informationTurn * 0.34 +
        interruption * 0.28 +
        contrast * 0.20 +
        (
          futurePressure
            ? 0.10
            : 0
        ) +
        (
          relationPresence
            ? 0.08
            : 0
        ),
    );

  /*
   * Attention move is a cognitive classification only.
   * It does not tell Mouth what words to use.
   */
  let attentionMove:
    ViewerStateCut["attentionMove"];

  if (
    beat.paysOff?.length
  ) {
    attentionMove =
      "land";
  } else if (
    stateShift >= 0.76 &&
    relationPresence
  ) {
    attentionMove =
      "recontextualize";
  } else if (
    interruption >= 0.76
  ) {
    attentionMove =
      "interrupt";
  } else if (
    contrast >= 0.70
  ) {
    attentionMove =
      "recontextualize";
  } else if (
    curiosityPressure >= 0.78
  ) {
    attentionMove =
      "tighten";
  } else if (
    stateShift >= 0.60
  ) {
    attentionMove =
      "escalate";
  } else {
    attentionMove =
      "release";
  }

  /*
   * These strings describe cognitive state, not authoring instructions.
   *
   * They deliberately avoid:
   * - viewer
   * - audience
   * - sequence
   * - planner
   * - supplied evidence
   * - "what should happen next?"
   *
   * The state is allowed to remain compact and somewhat abstract because
   * it is an internal semantic representation, not viewer-facing prose.
   */
  const beforeState =
    index === 0
      ? "The encounter is newly present."
      : priorMeaning
        ? `What was already established: ${priorMeaning}.`
        : "The established meaning continues.";

  const afterState =
    relationPresence
      ? `The meaning now includes ${usableCurrentMeaning}. A meaningful relation is active.`
      : `The meaning now includes ${usableCurrentMeaning}.`;

  return {
    beforeState,
    afterState,
    attentionMove,

    curiosityPressure,

    contrast,

    interruption,

    accumulation:
      metric(
        continuity * 0.52 +
          (1 - newEventRatio) *
            0.22 +
          (
            relationPresence
              ? 0.16
              : 0
          ) +
          informationTurn *
            0.10,
      ),

    tempo:
      metric(
        0.34 +
          interruption * 0.34 +
          stateShift * 0.32,
      ),

    payoffPressure,

    stateShift,

    predictionError,

    evidenceEventIds:
      currentIds,
  };
}
function rhetoricalForm(
  value: string,
): string {
  const text =
    clean(value);

  if (
    /[?]$/.test(
      text,
    )
  ) {
    return "question";
  }

  if (
    /^(?:a|an|the)\b/i.test(
      text,
    )
  ) {
    return "article-fragment";
  }

  if (
    text
      .split(/\s+/)
      .filter(Boolean)
      .length === 1
  ) {
    return "single-word";
  }

  if (
    /^(?:almost|still|suddenly|finally|then|and then|just)\b/i.test(
      text,
    )
  ) {
    return "adverb-led";
  }

  if (
    /^(?:felt|feel|feels|kept|keep|continued|continue|found|noticed|remember|forgot|forgotten|stayed|stay|remain|remains|became|becomes|was|were|is|it's|it was)\b/i.test(
      text,
    )
  ) {
    return "verb-led";
  }

  if (
    CONTRAST_LANGUAGE.test(
      text,
    )
  ) {
    return "contrastive";
  }

  return "free";
}

function realizationMode(
  value: string,
): string {
  const text =
    clean(value);

  const words =
    text
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const form =
    rhetoricalForm(
      text,
    );

  if (
    LOW_INFORMATION_PHRASE.test(
      text,
    )
  ) {
    return "generic-abstract";
  }

  if (
    PHYSICAL_INVENTION.test(
      text,
    )
  ) {
    return "physical-action";
  }

  if (
    form ===
    "single-word"
  ) {
    return "compressed-hit";
  }

  if (
    form ===
    "question"
  ) {
    return "question";
  }

  if (
    CONTRAST_LANGUAGE.test(
      text,
    )
  ) {
    return "contrast";
  }

  if (
    ABSTRACT_NOUNISH.test(
      text,
    ) &&
    words <= 5
  ) {
    return "experiential-nominal";
  }

  if (
    form ===
    "verb-led"
  ) {
    return "experiential-verb";
  }

  if (
    form ===
    "article-fragment"
  ) {
    return "compressed-fragment";
  }

  if (
    words <= 5
  ) {
    return "compressed-expression";
  }

  return "sentence-expression";
}

function genericAbstractionRisk(
  value: string,
): number {
  const text =
    clean(value);

  if (!text) {
    return 1;
  }

  if (
    LOW_INFORMATION_PHRASE.test(
      text,
    )
  ) {
    return 1;
  }

  const words =
    text
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const abstractWords =
    text.match(
      /\b(?:something|everything|feeling|moment|connection|warmth|ease|recognition|lightness|relief|possibility|shift|opening|momentum|flow|current|pull|tension|silence)\b/gi,
    )?.length ?? 0;

  const concreteWords =
    text.match(
      /\b(?:conversation|talking|words|walk|house|wedding|music|laugh|voice|name|dog|cat|home|door|car|business|work|friend|family)\b/gi,
    )?.length ?? 0;

  return metric(
    (
      abstractWords /
      Math.max(
        1,
        words,
      )
    ) *
      0.65 +
      (
        concreteWords === 0
          ? 0.25
          : 0
      ) +
      (
        words <= 2
          ? 0.1
          : 0
      ),
  );
}

/**
 * Measures expressive diversity without deciding that one form is always
 * better than another.
 */
function candidateDiversityValue(
  value: string,
): number {
  const form =
    rhetoricalForm(
      value,
    );

  const mode =
    realizationMode(
      value,
    );

  const formValue:
    Record<string, number> = {
      question: 1,
      contrastive: 0.96,
      "single-word": 0.94,
      "verb-led": 0.9,
      "adverb-led": 0.84,
      "article-fragment": 0.62,
      free: 0.74,
    };

  const modeValue:
    Record<string, number> = {
      "compressed-hit": 1,
      question: 0.96,
      contrast: 0.98,
      "experiential-verb": 0.92,
      "experiential-nominal": 0.68,
      "compressed-expression": 0.82,
      "compressed-fragment": 0.74,
      "sentence-expression": 0.76,
      "generic-abstract": 0.18,
      "physical-action": 0.08,
    };

  return metric(
    (
      formValue[form] ??
      0.7
    ) *
      0.42 +
      (
        modeValue[mode] ??
        0.7
      ) *
        0.58 -
      genericAbstractionRisk(
        value,
      ) *
        0.2,
  );
}

function semanticContrastPotential(
  value: string,
  sourceText: string,
  wholeSourceText: string,
): number {
  const text =
    clean(value);

  if (!text) {
    return 0;
  }

  const current =
    tokenSet(text);

  const source =
    tokenSet(
      sourceText,
    );

  const whole =
    tokenSet(
      wholeSourceText,
    );

  const localAnchor =
    overlap(
      current,
      source,
    );

  const worldAnchor =
    overlap(
      current,
      whole,
    );

  const contradiction =
    CONTRAST_LANGUAGE.test(
      text,
    );

  const experiential =
    ABSTRACT_NOUNISH.test(
      text,
    );

  const relational =
    /\b(?:close|closer|distance|between|toward|towards|with|together|apart|us|me|you|them)\b/i.test(
      text,
    );

  const tension =
    /\b(?:tension|pressure|edge|danger|uneasy|wrong|strange|sharp|heavy|quiet|silence)\b/i.test(
      text,
    );

  const warmth =
    /\b(?:warm|warmth|ease|soft|soften|light|close|comfort|gentle|easy)\b/i.test(
      text,
    );

  return metric(
    localAnchor *
      0.4 +
      worldAnchor *
        0.25 +
      (
        contradiction
          ? 0.15
          : 0
      ) +
      (
        experiential
          ? 0.08
          : 0
      ) +
      (
        relational
          ? 0.06
          : 0
      ) +
      (
        tension ||
        warmth
          ? 0.06
          : 0
      ),
  );
}

function semanticContrastLabel(
  value: string,
): string {
  const text =
    clean(value);

  if (
    /\b(?:but|yet|instead|rather|never|not|no|nothing)\b/i.test(
      text,
    )
  ) {
    return "reversal";
  }

  if (
    /\b(?:danger|uneasy|wrong|strange|tension|edge|heavy)\b/i.test(
      text,
    )
  ) {
    return "tension";
  }

  if (
    /\b(?:warm|warmth|ease|soft|soften|light|comfort|gentle)\b/i.test(
      text,
    )
  ) {
    return "warmth";
  }

  if (
    /\b(?:close|closer|between|toward|towards|together)\b/i.test(
      text,
    )
  ) {
    return "connection";
  }

  if (
    /\b(?:distance|apart|space|silence|away)\b/i.test(
      text,
    )
  ) {
    return "distance";
  }

  if (
    /\b(?:recognized|recognition|noticed|remember)\b/i.test(
      text,
    )
  ) {
    return "recognition";
  }

  if (
    rhetoricalForm(text) ===
    "single-word"
  ) {
    return "compressed-hit";
  }

  if (
    rhetoricalForm(text) ===
    "question"
  ) {
    return "question";
  }

  if (
    rhetoricalForm(text) ===
    "verb-led"
  ) {
    return "movement";
  }

  return "neutral";
}

function evaluateCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[] = [],
): MouthCandidate {
  const value =
    clean(text);

  const sourceLabels =
    sourceForBeat(
      beat,
      envelope,
    );

  const sourceText =
    sourceLabels.join(
      " ",
    );

  const wholeSourceText = [
    envelope.subject,
    ...envelope.events.map(
      (event) =>
        event.label,
    ),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].join(" ");

  const currentTokens =
    tokenSet(value);

  const sourceTokens =
    tokenSet(
      sourceText,
    );

  const wholeSourceTokens =
    tokenSet(
      wholeSourceText,
    );

  const groundingScore =
    metric(
      overlap(
        currentTokens,
        sourceTokens,
      ),
    );

  const wholeSourceAnchor =
    metric(
      overlap(
        currentTokens,
        wholeSourceTokens,
      ),
    );

  const supportedEvents =
    supportedEventsForBeat(
      beat,
      envelope,
    );

  const supportedEventIds =
    supportedEvents
      .filter(
        (event) =>
          phraseSupportedText(
            value,
            event.label,
          ) ||
          overlap(
            currentTokens,
            tokenSet(
              event.label,
            ),
          ) >= 0.25,
      )
      .map(
        (event) =>
          event.id,
      );

  const supportedRelationPairs =
    relationPairsForBeat(
      beat,
      envelope,
    );

  const endpointExactness =
    endpointExactForBeat(
      value,
      beat,
      envelope,
    )
      ? 1
      : 0;

  const semanticBeat =
    Boolean(
      beat.relationKinds?.length ||
      beat.attentionFunction ||
      beat.role,
    );

  /**
   * Interpretation happens before special realization lanes.
   */
  const interpretation =
    evaluateMouthInterpretation({
      text: value,
      sourceLabels,
      envelope,
      beat,
    });

  const reasons: string[] =
    [];

  const repetitionSet =
    new Set(
      priorTexts.flatMap(
        (item) =>
          [
            ...tokenSet(
              item,
            ),
          ],
      ),
    );

  const repetitionRisk =
    priorTexts.length
      ? metric(
          overlap(
            currentTokens,
            repetitionSet,
          ),
        )
      : 0;

  const noveltyScore =
    metric(
      1 -
        Math.min(
          1,
          repetitionRisk *
            1.25,
        ),
    );

  const wordCount =
    value
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const compressionScore =
    wordCount <= 4
      ? 1
      : wordCount <= 8
        ? 0.98
        : wordCount <= 12
          ? 0.94
          : wordCount <= 20
            ? 0.88
            : wordCount <= 30
              ? 0.76
              : wordCount <= 40
                ? 0.62
                : 0.48;

  const viewerState =
    beat.viewerState ??
    deriveViewerStateCut(
      beat,
      0,
      [beat],
      envelope,
    );

  const internalViewerStateLeak =
    matchesInternalViewerState(
      value,
      viewerState,
    );

  /**
   * Identity is candidate-specific and now feeds the actual concrete
   * safety boundary below.
   */
  const unsupportedIdentityLanguage =
    !hasSupportedIdentityLanguage(
      value,
      envelope,
    );

  const beatCoverage =
    sourceLabels.length
      ? metric(
          overlap(
            currentTokens,
            sourceTokens,
          ),
        )
      : 0;

  const beatHasConcreteEvidence =
    Boolean(
      beat.eventIds?.length,
    );

  const approvedSemanticRealization =
    interpretation.accepted &&
    interpretation.unsupportedConcreteRisk ===
      0 &&
    semanticBeat &&
    (
      interpretation.creativeFraming >=
        0.38 ||
      interpretation.reasons.includes(
        "semantic-compression",
      ) ||
      interpretation.reasons.includes(
        "grounded-creative-interpretation",
      )
    );

  const concreteDetailRisk =
    introducesUnsupportedConcreteDetail(
      value,
      wholeSourceText,
    )
      ? 1
      : 0;

  /**
   * CANONICAL CONCRETE SAFETY BOUNDARY.
   *
   * Every unsupported concrete claim feeds the same risk:
   *
   * interpretation risk
   * + unsupported identity
   * + unsupported world detail/action
   *
   * That single boundary then controls forbiddenMoveRisk,
   * creativeLane, inventionRisk, and ultimately Beam authorization.
   */
  const unsupportedConcreteRisk =
    Math.max(
      interpretation.unsupportedConcreteRisk,
      unsupportedIdentityLanguage
        ? 1
        : 0,
      concreteDetailRisk,
    );

  const forbiddenMoveRisk =
    metric(
      unsupportedConcreteRisk,
    );

  /**
   * An approved semantic beat may authorize a safe experiential realization
   * even when lexical overlap is zero.
   */
  const beatObligation =
    beatHasConcreteEvidence
      ? metric(
          beatCoverage *
            0.62 +
            (
              supportedEventIds.length
                ? 0.18
                : 0
            ) +
            (
              approvedSemanticRealization
                ? 0.20
                : 0
            ),
        )
      : metric(
          wholeSourceAnchor *
            0.35 +
            (
              interpretation.creativeFraming ??
              0.5
            ) *
              0.65,
        );

  const associativeLift =
    metric(
      Math.min(
        1,
        wholeSourceAnchor *
          0.55 +
          (
            interpretation.creativeFraming ??
            0.5
          ) *
            0.45,
      ),
    );

  const contrastPotential =
    semanticContrastPotential(
      value,
      sourceText,
      wholeSourceText,
    );

  const meaningScore =
    metric(
      (
        viewerState.stateShift ??
        0.5
      ) *
        0.19 +
        (
          viewerState.curiosityPressure ??
          0.5
        ) *
          0.14 +
        (
          viewerState.contrast ??
          0.5
        ) *
          0.13 +
        (
          interpretation.creativeFraming ??
          0.5
        ) *
          0.18 +
        beatObligation *
          0.18 +
        (
          semanticBeat
            ? 0.08
            : 0
        ) +
        contrastPotential *
          0.10,
    );

  const transitionScore =
    metric(
      (
        viewerState.predictionError ??
        0.4
      ) *
        0.48 +
        (
          viewerState.interruption ??
          0.4
        ) *
          0.27 +
        (
          viewerState.accumulation ??
          0.5
        ) *
          0.25,
    );

  const obligationCoverage =
    metric(
      beatObligation *
        0.78 +
        (
          supportedEventIds.length
            ? Math.min(
                0.22,
                supportedEventIds.length *
                  0.11,
              )
            : 0
        ),
    );

  const relationContractScore =
    metric(
      supportedRelationPairs.length
        ? 0.8
        : semanticBeat
          ? 0.35
          : 0.2,
    );

  /**
   * Creative realization may enter the expressive lane only when:
   *
   * - interpretation accepts it
   * - it is not a literal restatement
   * - the concrete safety boundary permits it
   * - it is grounded by the beat, endpoint, approved semantic realization,
   *   or whole-source evidence
   * - it is not internal viewer-state language
   */
  const creativeLane =
    interpretation.accepted &&
    literalRestatementFor(
      value,
      sourceLabels,
    ) === 0 &&
    forbiddenMoveRisk < 0.9 &&
    !internalViewerStateLeak &&
    (
      beatCoverage >= 0.12 ||
      endpointExactness === 1 ||
      approvedSemanticRealization ||
      (
        !beatHasConcreteEvidence &&
        wholeSourceAnchor >= 0.2
      )
    );

  const effectiveGrounding =
    metric(
      Math.max(
        groundingScore,
        creativeLane
          ? Math.min(
              0.72,
              beatObligation *
                0.62 +
                associativeLift *
                  0.18 +
                (
                  approvedSemanticRealization
                    ? 0.18
                    : 0
                ),
            )
          : 0,
      ),
    );

  const cohesionScore =
    metric(
      0.55 +
        (
          1 -
          repetitionRisk
        ) *
          0.25 +
        effectiveGrounding *
          0.2,
    );

  const inventionRisk =
    forbiddenMoveRisk > 0.35
      ? Math.max(
          0.72,
          forbiddenMoveRisk,
        )
      : metric(
          Math.max(
            0,
            0.22 -
              effectiveGrounding *
                0.18,
          ),
        );

  const collageRisk =
    value
      .split(
        /[.!?]+/,
      )
      .filter(Boolean)
      .length > 2 &&
    wordCount > 22
      ? 0.35
      : 0;

  const startsWithArticle =
    /^(?:a|an|the)\b/i.test(
      value,
    );

  const singleWord =
    wordCount === 1;

  const questionForm =
    /[?]$/.test(
      value,
    );

  const contrastiveForm =
    CONTRAST_LANGUAGE.test(
      value,
    ) &&
    /[.!?]$/.test(
      value,
    );

  const experientialForm =
    startsWithArticle
      ? "article-fragment"
      : singleWord
        ? "single-word"
        : questionForm
          ? "question"
          : contrastiveForm
            ? "contrastive"
            : rhetoricalForm(
                value,
              );

  const recentForms =
    priorTexts
      .slice(-2)
      .map(
        rhetoricalForm,
      );

  const repeatedFormCount =
    recentForms.filter(
      (form) =>
        form ===
        experientialForm,
    ).length;

  const articleRepetitionCount =
    recentForms.filter(
      (form) =>
        form ===
        "article-fragment",
    ).length;

  const articleRepetitionPenalty =
    startsWithArticle
      ? articleRepetitionCount *
        0.05
      : 0;

  const formDiversityPenalty =
    repeatedFormCount *
    0.08;

  const candidateDiversity =
    candidateDiversityValue(
      value,
    );

  const genericRisk =
    genericAbstractionRisk(
      value,
    );

  const distinctiveRealization =
    metric(
      (
        interpretation.creativeFraming ??
        0
      ) *
        0.25 +
        meaningScore *
          0.18 +
        transitionScore *
          0.13 +
        noveltyScore *
          0.12 +
        compressionScore *
          0.09 +
        candidateDiversity *
          0.10 +
        contrastPotential *
          0.13,
    );

  /**
   * Experiential realization remains creatively open.
   *
   * Unsupported concrete risk blocks it; expressive language itself does not.
   */
  const experientialRealization =
    interpretation.accepted &&
    (
      supportedEventIds.length > 0 ||
      approvedSemanticRealization
    ) &&
    endpointExactness === 0 &&
    literalRestatementFor(
      value,
      sourceLabels,
    ) === 0 &&
    unsupportedConcreteRisk === 0 &&
    (
      interpretation.reasons.includes(
        "semantic-compression",
      ) ||
      interpretation.reasons.includes(
        "grounded-creative-interpretation",
      ) ||
      interpretation.creativeFraming >=
        0.38 ||
      approvedSemanticRealization
    ) &&
    !internalViewerStateLeak;

  const experientialStrength =
    experientialRealization
      ? metric(
          (
            interpretation.creativeFraming
          ) *
            0.30 +
            distinctiveRealization *
              0.21 +
            compressionScore *
              0.14 +
            transitionScore *
              0.10 +
            candidateDiversity *
              0.11 +
            contrastPotential *
              0.14,
        )
      : 0;

  const semanticSpecificity =
    metric(
      meaningScore *
        0.26 +
        transitionScore *
          0.16 +
        (
          1 -
          genericRisk
        ) *
          0.20 +
        noveltyScore *
          0.11 +
        candidateDiversity *
          0.10 +
        contrastPotential *
          0.17,
    );

  const abstractionPenalty =
    genericRisk >= 0.8
      ? 0.14
      : genericRisk >= 0.6
        ? 0.08
        : genericRisk >= 0.4
          ? 0.04
          : 0;

  const experientialFormNovelty =
    experientialRealization
      ? metric(
          repeatedFormCount === 0
            ? 1
            : repeatedFormCount === 1
              ? 0.55
              : 0.2,
        )
      : 0;

  if (!value) {
    reasons.push(
      "missing-text",
    );
  }

  if (
    unsupportedIdentityLanguage
  ) {
    reasons.push(
      "unsupported-identity-language",
    );
  }

  if (
    META.test(value)
  ) {
    reasons.push(
      "meta-language",
    );
  }

  if (
    internalViewerStateLeak
  ) {
    reasons.push(
      "internal-viewer-state-language",
    );
  }

  if (
    GENERIC.test(value)
  ) {
    reasons.push(
      "generic-summary",
    );
  }

  if (
    LOW_INFORMATION_PHRASE.test(
      value,
    )
  ) {
    reasons.push(
      "low-information-abstraction",
    );
  }

  if (
    PLANNING_RESIDUE.test(
      value,
    )
  ) {
    reasons.push(
      "planning-residue",
    );
  }

  if (
    BAD_INTERPRETIVE_EXPLANATION.test(
      value,
    )
  ) {
    reasons.push(
      "interpretive-explanation",
    );
  }

  if (
    wordCount > 24
  ) {
    reasons.push(
      "too-long",
    );
  }

  if (
    !sourceLabels.length
  ) {
    reasons.push(
      "missing-grounding",
    );
  }

  if (
    beatHasConcreteEvidence &&
    beatObligation < 0.16 &&
    !endpointExactness &&
    !creativeLane
  ) {
    reasons.push(
      "weak-beat-obligation",
    );
  }

  if (
    effectiveGrounding < 0.08 &&
    !endpointExactness &&
    !creativeLane
  ) {
    reasons.push(
      "weak-grounding",
    );
  }

  if (
    repetitionRisk >
    0.75
  ) {
    reasons.push(
      "repetition",
    );
  }

  if (
    forbiddenMoveRisk >=
    0.9
  ) {
    reasons.push(
      "invention-risk",
    );
  }

  if (
    concreteDetailRisk > 0
  ) {
    reasons.push(
      "unsupported-concrete-detail",
    );
  }

  if (
    supportedEventIds.length
  ) {
    reasons.push(
      "event-grounded",
    );
  }

  if (
    supportedRelationPairs.length
  ) {
    reasons.push(
      "relation-grounded",
    );
  }

  if (
    beatObligation >=
    0.45
  ) {
    reasons.push(
      "beat-grounded",
    );
  }

  if (
    approvedSemanticRealization
  ) {
    reasons.push(
      "approved-semantic-realization",
    );
  }

  if (
    creativeLane
  ) {
    reasons.push(
      "bounded-creative-bet",
      "semantic-turn-grounded",
    );
  } else if (
    semanticBeat &&
    beatObligation >= 0.16 &&
    effectiveGrounding >= 0.16
  ) {
    reasons.push(
      "semantic-turn-grounded",
    );
  }

  if (
    experientialRealization
  ) {
    reasons.push(
      "experiential-realization",
    );
  }

  if (
    interpretation.accepted &&
    distinctiveRealization >=
      0.68 &&
    (
      interpretation.reasons.includes(
        "semantic-compression",
      ) ||
      creativeLane ||
      approvedSemanticRealization
    )
  ) {
    reasons.push(
      "distinctive-realization",
    );
  }

  if (
    contrastPotential >=
    0.55
  ) {
    reasons.push(
      "semantic-contrast",
    );
  }

  const contrastLabel =
    semanticContrastLabel(
      value,
    );

  if (
    contrastLabel !==
    "neutral"
  ) {
    reasons.push(
      `contrast:${contrastLabel}`,
    );
  }

  const score =
    metric(
      effectiveGrounding *
        0.12 +
        beatObligation *
          0.13 +
        meaningScore *
          0.15 +
        transitionScore *
          0.11 +
        obligationCoverage *
          0.08 +
        relationContractScore *
          0.04 +
        cohesionScore *
          0.05 +
        noveltyScore *
          0.06 +
        compressionScore *
          0.05 +
        (
          1 -
          inventionRisk
        ) *
          0.08 +
        (
          creativeLane
            ? 0.06
            : 0
        ) +
        distinctiveRealization *
          0.05 +
        experientialStrength *
          0.06 +
        semanticSpecificity *
          0.08 +
        experientialFormNovelty *
          0.02 +
        candidateDiversity *
          0.03 +
        contrastPotential *
          0.05 -
        articleRepetitionPenalty -
        formDiversityPenalty *
          0.5 -
        abstractionPenalty -
        collageRisk *
          0.025,
    );

  return {
    text: value,

    beatOrder:
      beat.order,

    supportedEventIds,

    supportedRelationPairs,

    groundingScore:
      effectiveGrounding,

    meaningScore,

    observerDiscoveryScore: 0,

    transitionScore,

    obligationCoverage,

    relationContractScore,

    forbiddenMoveRisk,

    cohesionScore,

    noveltyScore,

    compressionScore,

    inventionRisk,

    repetitionRisk,

    collageRisk,

    endpointExactness,

    score,

    reasons,
  };
}

function literalRestatementFor(
  value: string,
  labels: readonly string[],
): number {
  const normalized =
    clean(value)
      .replace(
        /[.!?]+$/g,
        "",
      )
      .toLowerCase();

  return labels.some(
    (label) =>
      normalized ===
      clean(label)
        .replace(
          /[.!?]+$/g,
          "",
        )
        .toLowerCase(),
  )
    ? 1
    : 0;
}

function buildGoldRealizationDoctrine(): string {
  return [
    "FIND THE GOLD before you write.",
    "Reality is immutable. Expression is not.",
    "The upstream Author already chose the reality, movie, beats, and semantic trajectory. Mouth realizes them; it does not rewrite them.",
    "Search the whole supplied material for the most alive meaning already present: attitude, contradiction, relationship meaning, irony, implication, status, coincidence, callback, humor, tenderness, tension, experiential quality, or memorable detail.",
    "FIND THE EXPERIENCE INSIDE THE EVENT. When an existing occurrence carries a felt quality, express that quality without creating a second occurrence.",
    "Experiential realization may be more vivid than the source wording while remaining faithful to what actually happened.",
    "Do not add factual specificity merely to create impact.",
    "A supplied laugh may become a rumble, vibration, warmth, sharpness, weight, rhythm, or another expressive quality when the supplied occurrence supports it.",
    "A supplied conversation may become still talking, words flowing, a current, ease, awkwardness, pause, tension, rhythm, or another earned expression.",
    "A supplied relationship may become warmth, tension, gravity, recognition, distance, pull, ease, uncertainty, or another supported quality.",
    "FORM VARIATION MATTERS. Do not repeatedly produce a/an + noun.",
    "Do not turn every feeling into a noun.",
    "Prefer the sharpest form, not the most poetic form.",
    "A one-word cut can be the hit.",
    "A fragment can beat a sentence.",
    "A sentence can beat a fragment.",
    "Short often penetrates harder, but brevity is not a law.",
    "SEMANTIC CONTRAST: search for materially different pressures when the supplied material permits them.",
    "Contrast may be warmth versus tension, closeness versus distance, recognition versus uncertainty, continuation versus interruption, ordinary versus ominous, humor versus seriousness, directness versus implication, relief versus lingering pressure, or simplicity versus status.",
    "Contrast is a search direction, not a fixed template.",
    "Do not force a contrast the material does not earn.",
    "UNKNOWN STAYS OPEN. Never resolve identity, gender, age, relationship, ownership, location, history, or motivation unless supplied.",
    "Do not turn met someone into her, him, my girlfriend, the woman, or the man unless that identity exists in supplied reality.",
    "Do not infer identity from grammatical convenience.",
    "Do not turn a state into a new physical action.",
    "Do not turn an event into a new environmental fact.",
    "Do not manufacture time, weather, lighting, scenery, objects, sounds, wardrobe, body position, gestures, dialogue, or outcomes.",
    "A new concrete world detail is not the same thing as experiential language. Keep the former grounded and leave the latter creatively open.",
    "IMPLICATION OVER EXPLANATION.",
    "ATTITUDE IS A PRIMARY CREATIVE TOOL.",
    "TWIST THE FRAMING, NOT THE REALITY.",
    "LOOK FOR STATUS.",
    "LOOK FOR THE INCONGRUITY.",
    "UNDERPLAY THE TWIST.",
    "SURPRISE is allowed when an older supplied detail can return and change its meaning.",
    "FIRE IS DISTINCTIVENESS, NOT DRAMA.",
    "No beat position is reserved for literal language, abstraction, or fire.",
    "Let the supplied sequence decide.",
    "No internal machinery language.",
  ].join(
    " ",
  );
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{
  role: "system" | "user";
  content: string;
}> {
  const evidence =
    unique([
      ...input.envelope.suppliedPhrases,
      ...input.envelope.events.map(
        (event) =>
          event.label,
      ),
      ...input.envelope.suppliedEntities,
      ...input.envelope.suppliedActions,
      ...input.envelope.suppliedStates,
      ...input.envelope.recurringSignals,
      ...input.envelope.sensorySignals,
      ...input.envelope.unresolvedTensions,
    ])
      .filter(
        (value) =>
          !PLANNING_RESIDUE.test(
            value,
          ),
      )
      .slice(
        0,
        50,
      );
    const viewerBeats =
  input.beats.map(
    (beat) => {
      const state =
        beat.viewerState ??
        deriveViewerStateCut(
          beat,
          0,
          [beat],
          input.envelope,
        );

      return {
        order:
          beat.order,

        eventIds:
          beat.eventIds,

        sourceLabels:
          sourceForBeat(
            beat,
            input.envelope,
          ),

        change:
          clean(
            beat.change,
          ),

        /*
         * Viewer-state data is now explicit input to Mouth.
         *
         * Mouth can realize the transition rather than guessing what
         * transition the beat is supposed to produce.
         */
        viewerState: {
          beforeState:
            state.beforeState,

          afterState:
            state.afterState,

          attentionMove:
            state.attentionMove,

          curiosityPressure:
            state.curiosityPressure,

          contrast:
            state.contrast,

          interruption:
            state.interruption,

          accumulation:
            state.accumulation,

          payoffPressure:
            state.payoffPressure,

          stateShift:
            state.stateShift,

          predictionError:
            state.predictionError,
        },

        role:
          clean(
            beat.role,
          ),

        relationKinds:
          beat.relationKinds,

        terminal:
          Boolean(
            beat.paysOff?.length,
          ),
      };
    },
  );

  const recent =
    input.priorTexts ??
    [];

  const system = [
    "QRE CANONICAL MOUTH · VIEWER-FACING CUT REALIZATION.",
    "The upstream Author already chose the reality, movie, beats, and semantic trajectory. Your job is language realization only.",
    "Write for the viewer's felt experience, not for the planner.",
    "Each beat includes a cognitive before-state and after-state.",
    "Use that state transition to find the expression; do not repeat the state description literally.",
    "The before-state and after-state are internal semantic guidance, not text to expose to the viewer.",
    "Do not write 'the viewer', 'the audience', or any internal state label.",
    "Ask implicitly: what changed in meaning, feeling, expectation, recognition, tension, closeness, distance, or possibility?",
    "Prefer language that lets the observer experience the change rather than explaining the change.",
    buildGoldRealizationDoctrine(),
    "Every candidate must preserve supplied reality.",
    "Never invent identity, behavior, environment, chronology, dialogue, objects, sounds, wardrobe, body position, or outcome.",
    "A candidate may be concrete only when that concrete fact is already supported.",
    "A candidate may be abstract, metaphorical, compressed, funny, strange, sharp, intimate, ominous, or fragmentary when that expression is grounded.",
    "Generate exactly three meaningfully different candidate possibilities for each beat when the material permits.",
    "Do not make three synonyms.",
    "Do not make three versions of the same A + noun construction.",
    "Search different semantic pressures when possible: recognition, experience, contrast, interruption, callback, status, implication, compressed hit, or another materially different realization.",
    "These are flexible search directions, not required slots.",
    "Prefer a direct verb or phrase when it hits harder than a nominal abstraction.",
    "Do not overuse A, AN, or THE.",
    "Do not turn every feeling into a noun.",
    "Short often penetrates harder. One-word lines are valid. Full sentences are valid.",
    "A new world detail such as footsteps, a room, a street, a hand, a sound, weather, or lighting is not authorized merely because it makes the line cinematic.",
    "Experiential language such as tension, warmth, current, pull, rhythm, pressure, closeness, or release may remain expressive when it does not create a new factual event.",
    "No beat position is reserved for literal language, abstraction, or fire.",
    "Let the sequence decide.",
    "Do not resolve unknown identity.",
    "Never use internal viewer-state labels in the output.",
    "OUTPUT CONTRACT: Return exactly one JSON object with exactly one key: variantsByBeat.",
    "variantsByBeat must contain exactly one object for every supplied beat, in ascending order.",
    "Each beat object must contain exactly two keys: order and variants.",
    "order must match the supplied beat order exactly.",
    "variants must contain exactly 3 unique strings.",
    "Never output fewer than 3 variants. Never output more than 3 variants.",
    "Do not duplicate variants within a beat.",
    "Do not duplicate beat objects.",
    "Every variant must be viewer-facing language.",
    "Every variant must belong to the approved beat.",
    "Every variant must preserve the supplied reality boundary.",
    "Return JSON only.",
    'Return JSON only: {"variantsByBeat":[{"order":1,"variants":["...","...","..."]},{"order":2,"variants":["...","...","..."]}]}',
  ].join(
    "\n",
  );

  const user =
    JSON.stringify({
      task:
        "realize_viewer_state_cuts",

      subject:
        input.envelope.subject,

      lens:
        clean(
          input.lens,
        ),

      suppliedEvidence:
        evidence,

      priorTexts:
        recent,

      beats:
        viewerBeats,

      generationGuidance: {
        objective:
          "maximize meaningful experiential and semantic diversity without changing supplied reality",

        searchDirections: [
          "recognition",
          "experiential realization",
          "semantic contrast",
          "distinctive interruption",
          "callback",
          "status",
          "implication",
          "compressed hit",
          "unexpectedly exact phrasing",
        ],

        avoid: [
          "three synonyms",
          "repeated article-led fragments",
          "generic emotional nouns",
          "unsupported identity",
          "unsupported physical behavior",
          "unsupported environmental detail",
          "unsupported concrete world detail",
          "internal viewer-state language",
          "planning language",
        ],
      },
    });

  return [
    {
      role:
        "system",
      content:
        system,
    },

    {
      role:
        "user",
      content:
        user,
    },
  ];
}

export function parseMouthCandidateBatch(
  raw: string,
): MouthCandidateBatch | undefined {
  try {
    const parsed =
      JSON.parse(
        clean(raw),
      ) as {
        variantsByBeat?: Array<{
          order?: unknown;
          variants?: unknown;
        }>;
      };

    if (
      !parsed ||
      !Array.isArray(
        parsed.variantsByBeat,
      ) ||
      !parsed.variantsByBeat.length
    ) {
      return undefined;
    }

    const variantsByBeat =
      parsed.variantsByBeat.map(
        (item) => ({
          order:
            Number(
              item.order,
            ),

          variants:
            Array.isArray(
              item.variants,
            )
              ? item.variants
                  .map(String)
                  .map(clean)
                  .filter(Boolean)
              : [],
        }),
      );

    if (
      variantsByBeat.some(
        (item) =>
          !Number.isFinite(
            item.order,
          ) ||
          item.variants.length !==
            3,
      )
    ) {
      return undefined;
    }

    const orders =
      variantsByBeat
        .map(
          (item) =>
            item.order,
        )
        .sort(
          (a, b) =>
            a - b,
        );

    for (
      let index = 0;
      index <
      orders.length;
      index += 1
    ) {
      if (
        orders[index] !==
        index + 1
      ) {
        return undefined;
      }
    }

    if (
      variantsByBeat.some(
        (item) =>
          new Set(
            item.variants.map(
              (value) =>
                value.toLowerCase(),
            ),
          ).size !==
          item.variants.length,
      )
    ) {
      return undefined;
    }

    return {
      variantsByBeat:
        variantsByBeat.sort(
          (a, b) =>
            a.order -
            b.order,
        ),
    };
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(
  input: {
    text: string;
    beat: MouthCandidateBeat;
    envelope: RealityEnvelope;
    priorTexts?: readonly string[];
  },
): MouthCandidate {
  return evaluateCandidate(
    input.text,
    input.beat,
    input.envelope,
    input.priorTexts ??
      [],
  );
}