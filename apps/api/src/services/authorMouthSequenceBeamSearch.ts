
/**
 * STATUS: CANONICAL COMPATIBILITY
 * ROLE: Select one already-authorized language candidate per approved beat.
 *
 * MUST NOT:
 * - invent language
 * - create story beats
 * - reinterpret reality
 * - bypass candidate authorization
 *
 * The historical "beam" name remains for compatibility with the master Author.
 *
 * SELECTION AUTHORITY:
 *   1. candidate safety
 *   2. candidate authorization / provenance
 *   3. semantic execution
 *   4. sequence meaning
 *   5. experiential realization
 *   6. transition / interruption
 *   7. grounding
 *   8. compression
 *   9. novelty / cohesion
 *   10. sequence continuity
 *   11. endpoint exactness
 *
 * CORE SEQUENCE LAW:
 *
 * A good line is not necessarily the best line.
 *
 * The best line is the line whose relationship to the surrounding cuts
 * creates the strongest useful change in meaning, feeling, rhythm,
 * attention, recognition, interruption, or anticipation.
 *
 * Gold is emergent.
 *
 * No beat is assigned a fire position.
 * No candidate is guaranteed to become the fire line.
 * The sequence discovers where exceptional realization belongs.
 */

import type { MouthCandidate } from "./authorMouthCandidateSearch.js";

export type MouthCandidatePool = {
  order: number;
  candidates: MouthCandidate[];
};

export type MouthSequencePath = {
  candidates: MouthCandidate[];
  texts: string[];
  score: number;
};

export type MouthBeamOptions = {
  width?: number;
  candidatesPerBeat?: number;
};

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const clamp01 = (value: number): number =>
  Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  );

const tokenSet = (
  value: string,
): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(
        /[^a-z0-9'-]+/i,
      )
      .filter(
        (token) =>
          token.length >= 3,
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

/**
 * Candidate authorization is a hard boundary.
 *
 * The Beam never turns an unsafe candidate into a safe candidate.
 */

function authorized(
  candidate: MouthCandidate,
): boolean {
  const text =
    clean(
      candidate.text,
    );

  if (!text) {
    return false;
  }

  /*
   * HARD SAFETY FLOOR.
   *
   * The Beam never repairs or overrides an unsafe candidate.
   * Candidate Search must already have established that the line
   * remains inside the permitted reality boundary.
   */
  if (
    candidate.inventionRisk >=
      0.35 ||
    candidate.forbiddenMoveRisk >=
      0.35
  ) {
    return false;
  }

  /*
   * Viewer-facing language must never expose internal viewer-state
   * machinery.
   */
  if (
    candidate.reasons.includes(
      "internal-viewer-state-language",
    )
  ) {
    return false;
  }

  /*
   * Identity provenance is a hard boundary.
   *
   * Candidate Search decides whether identity-bearing language is
   * actually supported by supplied reality.
   *
   * Therefore:
   *
   *   "met someone" -> "she"
   *
   * is rejected unless upstream reality authorized that identity.
   *
   * This does NOT ban "she", "he", "her", "him", etc. when the supplied
   * material genuinely establishes the identity.
   */
  if (
    candidate.reasons.includes(
      "unsupported-identity-language",
    )
  ) {
    return false;
  }
   if (
  candidate.reasons.includes(
    "unsupported-concrete-detail",
  )
) {
  return false;
}
  /*
   * Authorization signals.
   *
   * The Beam chooses among candidates that already have provenance
   * or semantic authorization. It never creates authorization itself.
   */
  const hasGrounding =
    candidate.groundingScore >=
    0.5;

  const hasSupportedEvents =
    candidate.supportedEventIds
      .length > 0;

  const hasEndpoint =
    candidate.endpointExactness >=
    0.999;

  const hasSemanticAuthorization =
    candidate.reasons.includes(
      "semantic-turn-grounded",
    );

  const hasCreativeAuthorization =
    candidate.reasons.includes(
      "bounded-creative-bet",
    );

  const hasExperientialAuthorization =
    candidate.reasons.includes(
      "experiential-realization",
    );

  const hasApprovedSemanticRealization =
    candidate.reasons.includes(
      "approved-semantic-realization",
    );

  return Boolean(
    hasGrounding ||
    hasSupportedEvents ||
    hasEndpoint ||
    hasSemanticAuthorization ||
    hasCreativeAuthorization ||
    hasExperientialAuthorization ||
    hasApprovedSemanticRealization,
  );
}


/**
 * General semantic quality.
 *
 * Provenance remains primary.
 * This function cannot override safety.
 */
function semanticQuality(
  candidate: MouthCandidate,
): number {
  const reasons =
    candidate.reasons;

  const creative =
    reasons.includes(
      "bounded-creative-bet",
    );

  const semanticGold =
    reasons.includes(
      "semantic-compression",
    );

  const experiential =
    reasons.includes(
      "experiential-realization",
    );

  const distinctive =
    reasons.includes(
      "distinctive-realization",
    );

  const semanticContrast =
    reasons.includes(
      "semantic-contrast",
    );

  const base =
    candidate.meaningScore * 0.22 +
    candidate.transitionScore * 0.15 +
    candidate.groundingScore * 0.12 +
    candidate.obligationCoverage * 0.10 +
    candidate.compressionScore * 0.08 +
    candidate.cohesionScore * 0.05 +
    candidate.noveltyScore * 0.07;

  const experientialLift =
    experiential
      ? 0.1
      : 0;

  const compressionLift =
    semanticGold
      ? 0.08
      : 0;

  const distinctiveLift =
    distinctive
      ? 0.08
      : 0;

  const creativeLift =
    creative
      ? 0.05
      : 0;

  const contrastLift =
    semanticContrast
      ? 0.05
      : 0;

  return clamp01(
    base +
      experientialLift +
      compressionLift +
      distinctiveLift +
      creativeLift +
      contrastLift,
  );
}

/**
 * Provenance strength, not lexical similarity alone.
 */
function authorizationQuality(
  candidate: MouthCandidate,
): number {
  let value = 0;

  if (
    candidate.supportedEventIds.length >
    0
  ) {
    value += 0.32;
  }

  if (
    candidate.supportedRelationPairs.length >
    0
  ) {
    value += 0.24;
  }

  if (
    candidate.groundingScore >=
    0.8
  ) {
    value += 0.2;
  } else if (
    candidate.groundingScore >=
    0.5
  ) {
    value += 0.1;
  }

  if (
    candidate.reasons.includes(
      "semantic-turn-grounded",
    )
  ) {
    value += 0.18;
  }

  if (
    candidate.reasons.includes(
      "bounded-creative-bet",
    )
  ) {
    value += 0.12;
  }

  if (
    candidate.reasons.includes(
      "experiential-realization",
    )
  ) {
    value += 0.08;
  }

  return clamp01(
    value,
  );
}

function isSemanticGold(
  candidate: MouthCandidate,
): boolean {
  return candidate.reasons.includes(
    "semantic-compression",
  );
}

function isCreativeGold(
  candidate: MouthCandidate,
): boolean {
  return candidate.reasons.includes(
    "bounded-creative-bet",
  );
}

function isDistinctiveGold(
  candidate: MouthCandidate,
): boolean {
  return candidate.reasons.includes(
    "distinctive-realization",
  );
}

function isExperientialGold(
  candidate: MouthCandidate,
): boolean {
  return candidate.reasons.includes(
    "experiential-realization",
  );
}

function isSafe(
  candidate: MouthCandidate,
): boolean {
  return (
    candidate.inventionRisk <
      0.35 &&
    candidate.forbiddenMoveRisk <
      0.35
  );
}

/**
 * Dynamic semantic-gold potential.
 *
 * This is deliberately NOT a fixed "fire" flag.
 *
 * It asks:
 *   - Does the candidate carry meaning?
 *   - Does it move the sequence?
 *   - Does it feel distinctive?
 *   - Does it realize experience?
 *   - Does it create contrast?
 *   - Is it compact?
 *   - Is it novel?
 *
 * A quiet line can therefore become gold.
 * A dramatic line can fail to become gold.
 */
function semanticGoldPotential(
  candidate: MouthCandidate,
): number {
  const explicitSignals =
    (
      isDistinctiveGold(candidate)
        ? 0.24
        : 0
    ) +
    (
      isExperientialGold(candidate)
        ? 0.18
        : 0
    ) +
    (
      isSemanticGold(candidate)
        ? 0.12
        : 0
    ) +
    (
      isCreativeGold(candidate)
        ? 0.08
        : 0
    );

  const semanticSignals =
    candidate.meaningScore * 0.18 +
    candidate.transitionScore * 0.12 +
    candidate.noveltyScore * 0.08 +
    candidate.compressionScore * 0.06 +
    candidate.cohesionScore * 0.04 +
    (
      candidate.reasons.includes(
        "semantic-contrast",
      )
        ? 0.1
        : 0
    );

  return clamp01(
    explicitSignals +
      semanticSignals,
  );
}

/**
 * Gold emergence is sequence-relative.
 *
 * A candidate becomes more interesting when it materially exceeds the
 * average quality of the current beat's alternatives.
 */
function relativeGoldPotential(
  candidate: MouthCandidate,
  beatPoolMax: number,
): number {
  const potential =
    semanticGoldPotential(
      candidate,
    );

  if (
    beatPoolMax <= 0
  ) {
    return potential;
  }

  return clamp01(
    potential /
    Math.max(
      0.25,
      beatPoolMax,
    ),
  );
}

/**
 * Identifies rhetorical arrival form.
 *
 * No form is inherently good or bad.
 */
function rhetoricalShape(
  text: string,
): string {
  const value =
    clean(text);

  const words =
    value
      .split(/\s+/)
      .filter(Boolean)
      .length;

  if (
    /^(?:a|an)\s+/i.test(
      value,
    )
  ) {
    return "article-fragment";
  }

  if (
    /^the\s+/i.test(
      value,
    )
  ) {
    return "the-fragment";
  }

  if (
    words === 1
  ) {
    return "single-word";
  }

  if (
    /[?]$/.test(
      value,
    )
  ) {
    return "question";
  }

  if (
    /^(?:almost|still|suddenly|finally|then|and then|just)\b/i.test(
      value,
    )
  ) {
    return "adverb-led";
  }

  if (
    /^(?:felt|feel|feels|kept|keep|continued|continue|found|noticed|remember|forgot|forgotten|stayed|stay|remain|remains|became|becomes|was|were|is|it's|it was)\b/i.test(
      value,
    )
  ) {
    return "verb-led";
  }

  if (
    /\b(?:but|yet|still|almost|nothing|everything|never|not|no|then)\b/i.test(
      value,
    ) &&
    /[.!?]/.test(
      value,
    )
  ) {
    return "contrastive";
  }

  return "free";
}

/**
 * Sequence effect asks what this line DOES to what came before.
 */
function sequenceEffect(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
): number {
  if (
    !priorTexts.length
  ) {
    return 0.5;
  }

  const current =
    tokenSet(
      candidate.text,
    );

  const previous =
    priorTexts.map(
      tokenSet,
    );

  const latest =
    previous[
      previous.length - 1
    ];

  const latestOverlap =
    overlap(
      current,
      latest,
    );

  const older =
    previous.slice(
      0,
      -1,
    );

  const olderMaxOverlap =
    older.length
      ? Math.max(
          ...older.map(
            (text) =>
              overlap(
                current,
                text,
              ),
          ),
        )
      : 0;

  const olderReturn =
    older.length &&
    olderMaxOverlap >= 0.18 &&
    latestOverlap < 0.55
      ? clamp01(
          olderMaxOverlap -
            latestOverlap +
            0.35,
        )
      : 0;

  const freshTerritory =
    clamp01(
      1 -
        Math.max(
          latestOverlap,
          olderMaxOverlap,
        ),
    );

  const meaningfulCallback =
    older.length &&
    olderMaxOverlap >= 0.18 &&
    latestOverlap < 0.62 &&
    olderMaxOverlap >
      latestOverlap
      ? 0.22
      : 0;

  const connectiveTurn =
    latestOverlap >= 0.12 &&
    latestOverlap <= 0.58
      ? 0.18
      : 0;

  const contradictionShape =
    /\b(?:but|yet|still|almost|neither|nothing|everything|never|not|no|then)\b/i.test(
      candidate.text,
    ) &&
    /[.!?]/.test(
      candidate.text,
    )
      ? 0.16
      : 0;

  const distinctive =
    isDistinctiveGold(candidate)
      ? 0.18
      : 0;

  const experiential =
    isExperientialGold(candidate)
      ? 0.2
      : 0;

  const compression =
    isSemanticGold(candidate)
      ? 0.12
      : 0;

  const compressionStrength =
    candidate.compressionScore >=
    0.94
      ? 0.1
      : candidate.compressionScore >=
          0.88
        ? 0.06
        : 0;

  const sequenceNovelty =
    candidate.noveltyScore *
    0.16;

  const currentShape =
    rhetoricalShape(
      candidate.text,
    );

  const recentShapes =
    priorTexts
      .slice(-2)
      .map(
        rhetoricalShape,
      );

  const formBreak =
    recentShapes.length > 0 &&
    recentShapes.every(
      (shape) =>
        shape !==
        currentShape,
    )
      ? 0.16
      : 0;

  const attentionInterrupt =
    freshTerritory > 0.58 &&
    formBreak > 0
      ? 0.18
      : 0;

  const recontextualizingReturn =
    latestOverlap >= 0.12 &&
    latestOverlap <= 0.58 &&
    formBreak > 0 &&
    (
      isExperientialGold(candidate) ||
      isDistinctiveGold(candidate) ||
      contradictionShape > 0
    )
      ? 0.18
      : 0;

  const experientialContext =
    isExperientialGold(candidate) &&
    priorTexts.length >= 2 &&
    latestOverlap < 0.75
      ? 0.12
      : 0;

  const rhythmBreak =
    formBreak > 0 &&
    freshTerritory > 0.42
      ? 0.1
      : 0;

  const semanticReturn =
    older.length >= 2 &&
    olderMaxOverlap >= 0.18 &&
    latestOverlap < 0.58 &&
    (
      isSemanticGold(candidate) ||
      isExperientialGold(candidate)
    )
      ? 0.12
      : 0;

  return clamp01(
    freshTerritory * 0.16 +
      connectiveTurn +
      meaningfulCallback +
      olderReturn * 0.18 +
      contradictionShape +
      distinctive +
      experiential +
      compression +
      compressionStrength +
      sequenceNovelty +
      formBreak +
      attentionInterrupt +
      recontextualizingReturn +
      experientialContext +
      rhythmBreak +
      semanticReturn,
  );
}

/**
 * Sequence continuity.
 */
function sequenceFit(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
): number {
  if (
    !priorTexts.length
  ) {
    return 0.64;
  }

  const current =
    tokenSet(
      candidate.text,
    );

  const previous =
    priorTexts.map(
      tokenSet,
    );

  const latest =
    previous[
      previous.length - 1
    ];

  const latestOverlap =
    overlap(
      current,
      latest,
    );

  const maxOverlap =
    Math.max(
      ...previous.map(
        (text) =>
          overlap(
            current,
            text,
          ),
      ),
    );

  const exactRepeat =
    previous.some(
      (text) =>
        clean(
          text,
        ).toLowerCase() ===
        clean(
          candidate.text,
        ).toLowerCase(),
    );

  if (
    exactRepeat
  ) {
    return candidate.reasons.includes(
      "semantic-turn-grounded",
    )
      ? 0.3
      : 0;
  }

  const restatementPenalty =
    latestOverlap >= 0.78
      ? 0.44
      : latestOverlap >= 0.62
        ? 0.24
        : maxOverlap >= 0.82
          ? 0.2
          : 0;

  const callbackSweetSpot =
    latestOverlap >= 0.12 &&
    latestOverlap <= 0.52
      ? 0.16
      : 0;

  const semanticTurn =
    candidate.reasons.includes(
      "semantic-turn-grounded",
    ) &&
    latestOverlap < 0.75
      ? 0.12
      : 0;

  const creativeTurn =
    isCreativeGold(candidate) &&
    latestOverlap < 0.75
      ? 0.1
      : 0;

  const distinctiveTurn =
    isDistinctiveGold(candidate)
      ? 0.14
      : 0;

  const experientialTurn =
    isExperientialGold(candidate)
      ? 0.15
      : 0;

  const currentShape =
    rhetoricalShape(
      candidate.text,
    );

  const recentShapes =
    priorTexts
      .slice(-2)
      .map(
        rhetoricalShape,
      );

  const formRepetitionCount =
    recentShapes.filter(
      (shape) =>
        shape ===
        currentShape,
    ).length;

  const formRepetitionPenalty =
    formRepetitionCount *
    0.12;

  const formBreakBonus =
    recentShapes.length > 0 &&
    recentShapes.every(
      (shape) =>
        shape !==
        currentShape,
    )
      ? 0.12
      : 0;

  const experientialContextBonus =
    isExperientialGold(candidate) &&
    priorTexts.length >= 2 &&
    latestOverlap < 0.75
      ? 0.1
      : 0;

  const effect =
    sequenceEffect(
      candidate,
      priorTexts,
    );

  const penetrationBonus =
    priorTexts.length >= 1
      ? candidate.compressionScore >= 0.94
        ? 0.08
        : candidate.compressionScore >= 0.88
          ? 0.04
          : 0
      : 0;

  return clamp01(
    0.5 +
      callbackSweetSpot +
      semanticTurn +
      creativeTurn +
      distinctiveTurn +
      experientialTurn +
      experientialContextBonus +
      formBreakBonus +
      penetrationBonus +
      effect * 0.32 -
      restatementPenalty -
      formRepetitionPenalty,
  );
}

/**
 * Path-level scoring.
 *
 * Gold is dynamic:
 *
 * - no fixed beat gets the fire role
 * - a candidate earns extra weight when it is materially stronger
 *   than its alternatives
 * - sequence context changes the value
 * - multiple gold moments remain possible
 * - repeated gold intensity gets diminishing returns
 */
function pathCandidateScore(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
  hasLiteralAlternative: boolean,
  previousGoldCount: number,
  beatPoolMaxGold: number,
): number {
  const fit =
    sequenceFit(
      candidate,
      priorTexts,
    );

  const effect =
    sequenceEffect(
      candidate,
      priorTexts,
    );

  const candidateGold =
    semanticGoldPotential(
      candidate,
    );

  const relativeGold =
    relativeGoldPotential(
      candidate,
      beatPoolMaxGold,
    );

  const hasContext =
    priorTexts.length >= 2;

  /*
   * Contextual gold is stronger after the sequence has established enough
   * material for a realization to suddenly mean more.
   */
  const contextualGoldLift =
    hasContext
      ? candidateGold *
        0.1
      : candidateGold *
        0.04;

  /*
   * Relative strength is the crucial dynamic mechanism.
   *
   * A merely decent candidate does not get "fire" because it carries a
   * distinctive label. It must actually stand out among alternatives.
   */
  const emergenceLift =
    relativeGold >= 0.92 &&
    candidateGold >= 0.62
      ? 0.12
      : relativeGold >= 0.78 &&
          candidateGold >= 0.58
        ? 0.07
        : 0;

  /*
   * Diminishing returns prevent the sequence from becoming six consecutive
   * fireworks without imposing a hard single-fire rule.
   */
  const goldDiminishing =
    previousGoldCount === 0
      ? 1
      : previousGoldCount === 1
        ? 0.58
        : previousGoldCount === 2
          ? 0.28
          : 0.12;

  const dynamicGold =
    candidateGold *
      0.08 *
      goldDiminishing +
    contextualGoldLift *
      goldDiminishing +
    emergenceLift *
      goldDiminishing;

  const candidateIsDistinctive =
    isDistinctiveGold(
      candidate,
    );

  const candidateIsExperiential =
    isExperientialGold(
      candidate,
    );

  const candidateIsSemantic =
    isSemanticGold(
      candidate,
    );

  const firePriority =
    candidateIsDistinctive &&
    previousGoldCount === 0
      ? 0.06
      : 0;

  const experientialPriority =
    candidateIsExperiential
      ? 0.06
      : 0;

  const semanticPriority =
    candidateIsSemantic &&
    hasLiteralAlternative
      ? 0.16
      : 0;

  const distinctivePriority =
    candidateIsDistinctive
      ? 0.07
      : 0;

  const currentShape =
    rhetoricalShape(
      candidate.text,
    );

  const recentShapes =
    priorTexts
      .slice(-2)
      .map(
        rhetoricalShape,
      );

  const formNovelty =
    recentShapes.length > 0 &&
    recentShapes.every(
      (shape) =>
        shape !==
        currentShape,
    )
      ? 0.08
      : 0;

  const experientialFormBreak =
    candidateIsExperiential &&
    formNovelty > 0
      ? 0.07
      : 0;

  return clamp01(
    rank(candidate) * 0.34 +
      fit * 0.2 +
      effect * 0.3 +
      dynamicGold +
      experientialPriority +
      experientialFormBreak +
      semanticPriority +
      distinctivePriority +
      firePriority +
      formNovelty,
  );
}

/**
 * Base candidate rank.
 *
 * This is deliberately less dominant than sequence-level scoring.
 */
function rank(
  candidate: MouthCandidate,
): number {
  const inventionSafety =
    1 -
    Math.max(
      candidate.inventionRisk,
      candidate.forbiddenMoveRisk,
    );

  const authorization =
    authorizationQuality(
      candidate,
    );

  const semantic =
    semanticQuality(
      candidate,
    );

  const semanticGold =
    isSemanticGold(candidate)
      ? 1
      : 0;

  const experientialGold =
    isExperientialGold(candidate)
      ? 1
      : 0;

  const distinctiveGold =
    isDistinctiveGold(candidate)
      ? 1
      : 0;

  const creativeGold =
    isCreativeGold(candidate)
      ? 1
      : 0;

  return clamp01(
    inventionSafety * 0.2 +
      authorization * 0.15 +
      semantic * 0.22 +
      semanticGold * 0.08 +
      experientialGold * 0.09 +
      distinctiveGold * 0.08 +
      creativeGold * 0.05 +
      candidate.meaningScore * 0.05 +
      candidate.transitionScore * 0.08,
  );
}

function compareCandidates(
  a: MouthCandidate,
  b: MouthCandidate,
): number {
  const aSafe =
    isSafe(a);

  const bSafe =
    isSafe(b);

  if (
    aSafe &&
    bSafe
  ) {
    const aGold =
      semanticGoldPotential(
        a,
      );

    const bGold =
      semanticGoldPotential(
        b,
      );

    if (
      aGold !== bGold
    ) {
      return bGold - aGold;
    }
  }

  const rankDelta =
    rank(b) -
    rank(a);

  if (
    rankDelta !== 0
  ) {
    return rankDelta;
  }

  if (
    a.endpointExactness !==
    b.endpointExactness
  ) {
    return (
      b.endpointExactness -
      a.endpointExactness
    );
  }

  if (
    a.supportedEventIds.length !==
    b.supportedEventIds.length
  ) {
    return (
      b.supportedEventIds.length -
      a.supportedEventIds.length
    );
  }

  if (
    a.groundingScore !==
    b.groundingScore
  ) {
    return (
      b.groundingScore -
      a.groundingScore
    );
  }

  const aWords =
    clean(a.text)
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const bWords =
    clean(b.text)
      .split(/\s+/)
      .filter(Boolean)
      .length;

  if (
    aWords !==
    bWords
  ) {
    return aWords - bWords;
  }

  return clean(
    a.text,
  ).localeCompare(
    clean(
      b.text,
    ),
  );
}

function dedupeCandidates(
  candidates: readonly MouthCandidate[],
): MouthCandidate[] {
  const seen =
    new Set<string>();

  const result:
    MouthCandidate[] = [];

  for (
    const candidate of
      candidates
  ) {
    const text =
      clean(
        candidate.text,
      );

    if (!text) {
      continue;
    }

    const key =
      text.toLowerCase();

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(
      key,
    );

    result.push(
      candidate,
    );
  }

  return result;
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered =
    [...pools].sort(
      (a, b) =>
        a.order -
        b.order,
    );

  if (
    !ordered.length
  ) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  const width =
    Math.max(
      1,
      Math.floor(
        options.width ??
        12,
      ),
    );

  const candidatesPerBeat =
    Math.max(
      1,
      Math.floor(
        options.candidatesPerBeat ??
        8,
      ),
    );

  type Path = {
    candidates:
      MouthCandidate[];
    score:
      number;
  };

  let paths:
    Path[] = [
      {
        candidates: [],
        score: 0,
      },
    ];

  for (
    let index = 0;
    index <
    ordered.length;
    index += 1
  ) {
    const pool =
      ordered[index];

    const eligible =
      dedupeCandidates(
        pool.candidates,
      )
        .filter(
          authorized,
        )
        .sort(
          compareCandidates,
        )
        .slice(
          0,
          Math.max(
            candidatesPerBeat,
            width,
          ),
        );

    if (
      !eligible.length
    ) {
      return {
        candidates: [],
        texts: [],
        score: 0,
      };
    }

    /*
     * Dynamic gold pool ceiling.
     *
     * This is intentionally calculated per beat rather than hard-coding
     * a preferred position.
     */
    const beatPoolMaxGold =
      Math.max(
        ...eligible.map(
          semanticGoldPotential,
        ),
      );

    const hasLiteralAlternative =
      eligible.some(
        (candidate) =>
          !isSemanticGold(
            candidate,
          ),
      );

    const expanded:
      Array<
        Path
      > = [];

    for (
      const path of
        paths
    ) {
      const priorTexts =
        path.candidates.map(
          (candidate) =>
            clean(
              candidate.text,
            ),
        );

      const previousGoldCount =
        path.candidates.filter(
          (candidate) =>
            semanticGoldPotential(
              candidate,
            ) >= 0.62,
        ).length;

      for (
        const candidate of
          eligible
      ) {
        const exactRepeat =
          path.candidates.some(
            (prior) =>
              clean(
                prior.text,
              ).toLowerCase() ===
              clean(
                candidate.text,
              ).toLowerCase(),
          );

        if (
          exactRepeat
        ) {
          continue;
        }

        const candidateScore =
          pathCandidateScore(
            candidate,
            priorTexts,
            hasLiteralAlternative,
            previousGoldCount,
            beatPoolMaxGold,
          );

        expanded.push({
          candidates: [
            ...path.candidates,
            candidate,
          ],
          score:
            path.score +
            candidateScore,
        });
      }
    }

    expanded.sort(
      (a, b) =>
        b.score -
        a.score,
    );

    /*
     * The beam remains wide so a sequence with an earlier quiet line can
     * survive long enough for a later exceptional line to win.
     */
    paths =
      expanded.slice(
        0,
        width,
      );
  }

  if (
    !paths.length
  ) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  /*
   * Final-path comparison gets a tiny global coherence preference.
   *
   * This can break ties between paths with nearly identical cumulative
   * scores without introducing a fixed "fire" position.
   */
  paths.sort(
    (a, b) => {
      const aTexts =
        a.candidates.map(
          (candidate) =>
            clean(
              candidate.text,
            ),
        );

      const bTexts =
        b.candidates.map(
          (candidate) =>
            clean(
              candidate.text,
            ),
        );

      const aGold =
        a.candidates.reduce(
          (
            total,
            candidate,
          ) =>
            total +
            semanticGoldPotential(
              candidate,
            ),
          0,
        );

      const bGold =
        b.candidates.reduce(
          (
            total,
            candidate,
          ) =>
            total +
            semanticGoldPotential(
              candidate,
            ),
          0,
        );

      const aAverage =
        a.candidates.length
          ? a.score /
            a.candidates.length
          : 0;

      const bAverage =
        b.candidates.length
          ? b.score /
            b.candidates.length
          : 0;

      const aFinal =
        aAverage +
        Math.min(
          0.04,
          aGold /
            Math.max(
              1,
              a.candidates.length,
            ) *
            0.04,
        );

      const bFinal =
        bAverage +
        Math.min(
          0.04,
          bGold /
            Math.max(
              1,
              b.candidates.length,
            ) *
            0.04,
        );

      if (
        aFinal !==
        bFinal
      ) {
        return (
          bFinal -
          aFinal
        );
      }

      return (
        bTexts.length -
        aTexts.length
      );
    },
  );

  const best =
    paths[0];

  const average =
    best.candidates.length
      ? best.score /
        best.candidates.length
      : 0;

  return {
    candidates:
      best.candidates,

    texts:
      best.candidates.map(
        (candidate) =>
          clean(
            candidate.text,
          ),
      ),

    score:
      Number(
        clamp01(
          average,
        ).toFixed(
          3,
        ),
      ),
  };
}
