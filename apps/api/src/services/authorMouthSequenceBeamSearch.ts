/**
 * STATUS: CANONICAL
 * ROLE: Select one already-authorized language candidate per approved beat.
 *
 * MUST NOT:
 * - invent language
 * - create story beats
 * - reinterpret reality
 * - bypass candidate authorization
 * - reconstruct viewer authority
 *
 * ================================================================
 * SELECTION LAW
 * ================================================================
 *
 * The Beam does not decide what the story means.
 *
 * Cognition owns:
 *   reality
 *   approved meaning
 *   movie
 *   beats
 *   viewer-state transition
 *
 * Mouth owns:
 *   expression
 *
 * Attention owns:
 *   whether an expression creates a useful transition
 *
 * The Beam owns:
 *   which already-authorized expressions form the strongest STATE PATH.
 *
 * Canonical hierarchy:
 *
 *   1. safety
 *   2. authorization / provenance
 *   3. viewer-state transition
 *   4. next-state pressure
 *   5. sequence coherence
 *   6. expressive quality
 *
 * ================================================================
 * CORE SEQUENCE LAW
 * ================================================================
 *
 * A good line is not necessarily the best line.
 *
 * The best line is the authorized expression that creates the strongest
 * useful transition from the state established by preceding cuts and
 * leaves the sequence in the most useful state for what follows.
 *
 * Gold is emergent.
 *
 * No beat is assigned a fire position.
 * No candidate is guaranteed to become the fire line.
 * The sequence discovers where exceptional realization belongs.
 *
 * ================================================================
 * STATE LAW
 * ================================================================
 *
 * BEFORE
 *   What semantic / experiential state has already been established?
 *
 * CUT
 *   What approved expression enters?
 *
 * AFTER
 *   What is different now?
 *
 * NEXT
 *   What unresolved pressure survives because the new state exists?
 *
 * The Beam therefore evaluates transitions, not merely sentences.
 *
 * ================================================================
 * AUTHORITY LAW
 * ================================================================
 *
 * ViewerStateCut is authoritative upstream state.
 *
 * It is created by:
 *
 *   Cognition
 *      ↓
 *   approved beat
 *      ↓
 *   deriveViewerStateCut()
 *
 * The Beam receives that state through MouthCandidatePool.
 *
 * The Beam does not:
 *   - create a second state
 *   - infer a replacement state
 *   - attach state to individual candidates
 *   - fall back to candidate-local state
 *
 * A pool is therefore a transport boundary:
 *
 *   viewerState
 *   nextPromise
 *   frontier
 *   candidates[]
 *
 * The authority remains singular.
 */

import type {
  MouthCandidate,
  MouthCandidatePool,
  MouthSequencePath,
  MouthBeamOptions,
  ViewerStateCut,
} from "@qre/contracts";

const clean = (
  value: unknown,
): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const clamp01 = (
  value: number,
): number =>
  Math.max(
    0,
    Math.min(
      1,
      Number.isFinite(value)
        ? value
        : 0,
    ),
  );

const metric = (
  value: number,
): number =>
  Number(
    clamp01(value).toFixed(3),
  );

const DEBUG_BEAM =
  process.env.QRE_AUTHOR_DEBUG_BEAM ===
  "true";

/* ================================================================
 * TEXT UTILITIES
 * ================================================================ */

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

  return clamp01(
    hits /
      Math.max(
        1,
        a.size,
      ),
  );
}

function textOverlap(
  a: string,
  b: string,
): number {
  return overlap(
    tokenSet(a),
    tokenSet(b),
  );
}

function wordCount(
  text: string,
): number {
  return clean(
    text,
  )
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

/* ================================================================
 * HARD AUTHORIZATION
 * ================================================================ */

/**
 * Candidate authorization is a hard boundary.
 *
 * The Beam chooses among already-authorized candidates.
 * It never repairs authorization.
 */
export function isAuthorizedMouthCandidate(
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
   * Candidate Search already establishes the concrete safety boundary.
   * The Beam cannot override it.
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
   * Internal cognitive machinery must never reach viewer-facing output.
   */
  if (
    candidate.reasons.includes(
      "internal-viewer-state-language",
    )
  ) {
    return false;
  }

  /*
   * Identity provenance remains hard.
   */
  if (
    candidate.reasons.includes(
      "unsupported-identity-language",
    )
  ) {
    return false;
  }

  /*
   * Unsupported concrete reality remains hard.
   */
  if (
    candidate.reasons.includes(
      "unsupported-concrete-detail",
    )
  ) {
    return false;
  }

  const hasGrounding =
    candidate.groundingScore >=
    0.5;

  const hasSupportedEvents =
    candidate.supportedEventIds
      .length >
    0;

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

/* ================================================================
 * CANDIDATE CLASSIFICATION
 * ================================================================ */

function hasReason(
  candidate: MouthCandidate,
  reason: string,
): boolean {
  return candidate.reasons.includes(
    reason,
  );
}

function isDistinctiveRealization(
  candidate: MouthCandidate,
): boolean {
  return hasReason(
    candidate,
    "distinctive-realization",
  );
}

function isExperientialRealization(
  candidate: MouthCandidate,
): boolean {
  return hasReason(
    candidate,
    "experiential-realization",
  );
}

function isExperientialConsequence(
  candidate: MouthCandidate,
): boolean {
  return hasReason(
    candidate,
    "experiential-consequence",
  );
}

function isSemanticContrast(
  candidate: MouthCandidate,
): boolean {
  return hasReason(
    candidate,
    "semantic-contrast",
  );
}

/* ================================================================
 * RHETORICAL FORM
 * ================================================================ */

/**
 * No form is inherently good or bad.
 *
 * Form is used only as a bounded sequence signal.
 */
function rhetoricalShape(
  text: string,
): string {
  const value =
    clean(
      text,
    );

  const words =
    wordCount(
      value,
    );

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
    words ===
    1
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

/* ================================================================
 * CANONICAL VIEWER STATE
 * ================================================================ */

/**
 * Canonical viewer-state strength.
 *
 * This function reads the upstream state.
 * It does not create state.
 */
function canonicalStateSignal(
  state: ViewerStateCut,
): number {
  return metric(
    state.stateShift * 0.30 +
      state.predictionError *
        0.18 +
      state.curiosityPressure *
        0.18 +
      state.contrast *
        0.14 +
      state.interruption *
        0.10 +
      state.accumulation *
        0.10,
  );
}

/**
 * Determine how strongly a candidate expresses the authorized
 * transition.
 *
 * IMPORTANT:
 *
 * The state is authoritative.
 * The candidate is only the expression being tested against it.
 *
 * AFTER-state lexical overlap is only a supporting grounding signal.
 * It cannot turn a literal restatement into a stronger transition merely
 * because the candidate repeats the state's exact vocabulary.
 */
function viewerStateFit(
  candidate: MouthCandidate,
  state: ViewerStateCut,
): number {
  const value =
    clean(
      candidate.text,
    );

  if (!value) {
    return 0;
  }

  const before =
    clean(
      state.beforeState,
    );

  const after =
    clean(
      state.afterState,
    );

  const beforeSimilarity =
    before
      ? textOverlap(
          value,
          before,
        )
      : 0;

  const afterSimilarity =
    after
      ? textOverlap(
          value,
          after,
        )
      : 0;

  const literalRestatement =
    Boolean(
      candidate.endpointExactness >=
        0.999 ||
      candidate.reasons.includes(
        "literal-source-restatement",
      ),
    );

  /*
   * Vocabulary overlap is evidence that the candidate belongs to the same
   * state, not proof that it advances the viewer through that state.
   *
   * A literal candidate that exactly repeats AFTER is therefore prevented
   * from receiving a maximum transition solely from lexical identity.
   */
  const lexicalParticipation =
    literalRestatement
      ? Math.min(
          0.18,
          afterSimilarity * 0.18,
        )
      : Math.max(
          0,
          Math.min(
            0.38,
            0.18 +
              (afterSimilarity -
                beforeSimilarity) *
                0.5,
          ),
        );

  const semanticMovement =
    literalRestatement
      ? candidate.meaningScore * 0.28
      : candidate.transitionScore * 0.52 +
        candidate.meaningScore * 0.28;

  const approvedSemantic =
    candidate.reasons.includes(
      "approved-semantic-realization",
    ) ||
    candidate.reasons.includes(
      "semantic-turn-grounded",
    ) ||
    candidate.reasons.includes(
      "bounded-creative-bet",
    );

  const semanticAuthorization =
    approvedSemantic
      ? 0.14
      : 0;

  const experiential =
    isExperientialRealization(
      candidate,
    )
      ? 0.08
      : 0;

  const consequence =
    isExperientialConsequence(
      candidate,
    )
      ? 0.08
      : 0;

  const stateStrength =
    canonicalStateSignal(
      state,
    );

  return metric(
    semanticMovement * 0.48 +
      lexicalParticipation * 0.16 +
      stateStrength * 0.22 +
      semanticAuthorization +
      experiential +
      consequence,
  );
}

/* ================================================================
 * NEXT-STATE PRESSURE
 * ================================================================ */

/**
 * Future pressure is different from current state change.
 *
 * A large transition is not enough if it kills useful continuation.
 */
function nextStatePressure(
  candidate: MouthCandidate,
  state: ViewerStateCut,
  nextPromise: string,
): number {
  const expectation =
    clean(
      nextPromise,
    );

  const baseCuriosity =
    clamp01(
      state.curiosityPressure,
    );

  if (!expectation) {
    return metric(
      baseCuriosity,
    );
  }

  const candidateExpectationOverlap =
    textOverlap(
      candidate.text,
      expectation,
    );

  /*
   * Moderate overlap means the candidate belongs to the same living
   * thread without spelling out the next beat.
   */
  const continuity =
    candidateExpectationOverlap >=
      0.15 &&
    candidateExpectationOverlap <=
      0.65
      ? 1
      : 0;

  /*
   * High overlap risks saying tomorrow's line today.
   */
  const prematureResolution =
    candidateExpectationOverlap >=
    0.80
      ? 1
      : 0;

  return metric(
    baseCuriosity * 0.60 +
      continuity * 0.24 +
      (1 -
        prematureResolution) *
        0.16,
  );
}

/* ================================================================
 * SEQUENCE TRANSITION
 * ================================================================ */

/**
 * Measures what the expression does to the preceding sequence while
 * respecting the already-authorized viewer transition.
 *
 * Lexical novelty remains a supporting signal only.
 */
function sequenceTransition(
  candidate: MouthCandidate,
  priorCandidates: readonly MouthCandidate[],
  state: ViewerStateCut,
): number {
  const stateFit =
    viewerStateFit(
      candidate,
      state,
    );

  if (
    !priorCandidates.length
  ) {
   const candidateMovement =
  candidate.reasons.includes(
    "literal-source-restatement",
  ) ||
  candidate.endpointExactness >=
    0.999
    ? 0
    : candidate.transitionScore;

return metric(
  stateFit * 0.62 +
    candidateMovement * 0.24 +
    candidate.meaningScore * 0.14,
);
  }

  const current =
    tokenSet(
      candidate.text,
    );

  const priorTexts =
    priorCandidates.map(
      (item) =>
        clean(
          item.text,
        ),
    );

  const latest =
    priorTexts[
      priorTexts.length - 1
    ];

  const latestOverlap =
    overlap(
      current,
      tokenSet(
        latest,
      ),
    );

  const older =
    priorTexts.slice(
      0,
      -1,
    );

  const olderMax =
    older.length
      ? Math.max(
          ...older.map(
            (
              text,
            ) =>
              overlap(
                current,
                tokenSet(
                  text,
                ),
              ),
          ),
        )
      : 0;

  /*
   * New territory is good only when it remains inside the living sequence.
   */
  const lexicalNovelty =
    clamp01(
      1 -
        Math.max(
          latestOverlap,
          olderMax,
        ),
    );

  const callback =
    olderMax >=
      0.18 &&
    latestOverlap <
      0.62
      ? 1
      : 0;

  const connectiveBand =
    latestOverlap >=
      0.10 &&
    latestOverlap <=
      0.58
      ? 1
      : 0;

  const formBreak =
    rhetoricalShape(
      candidate.text,
    ) !==
      rhetoricalShape(
        latest,
      ) &&
    priorTexts
      .slice(-2)
      .every(
        (
          text,
        ) =>
          rhetoricalShape(
            text,
          ) !==
          rhetoricalShape(
            candidate.text,
          ),
      )
      ? 1
      : 0;

  const experiential =
    isExperientialRealization(
      candidate,
    )
      ? 1
      : 0;

  const consequence =
    isExperientialConsequence(
      candidate,
    )
      ? 1
      : 0;

  return metric(
    stateFit * 0.42 +
      lexicalNovelty * 0.12 +
      callback * 0.10 +
      connectiveBand * 0.08 +
      formBreak * 0.08 +
      experiential * 0.08 +
      consequence * 0.12,
  );
}

/* ================================================================
 * EXPRESSION QUALITY
 * ================================================================ */

/**
 * Expression quality is downstream of state.
 *
 * Beautiful wording cannot rescue an unauthorized candidate or a weak
 * state transition.
 */
function expressionQuality(
  candidate: MouthCandidate,
): number {
  const safety =
    1 -
    Math.max(
      candidate.inventionRisk,
      candidate.forbiddenMoveRisk,
    );

  const grounding =
    candidate.groundingScore;

  const semantic =
    candidate.meaningScore;

  const experiential =
    isExperientialRealization(
      candidate,
    )
      ? 1
      : 0;

  const consequence =
    isExperientialConsequence(
      candidate,
    )
      ? 1
      : 0;

  const distinctive =
    isDistinctiveRealization(
      candidate,
    )
      ? 1
      : 0;

  const compression =
    candidate.compressionScore;

  const novelty =
    candidate.noveltyScore;

  const contrast =
    isSemanticContrast(
      candidate,
    )
      ? 1
      : 0;

  const earnedCompression =
    earnedCompressionQuality(
      candidate,
    );

  return metric(
    safety * 0.14 +
      grounding * 0.14 +
      semantic * 0.18 +
      experiential * 0.16 +
      consequence * 0.12 +
      distinctive * 0.10 +
      compression * 0.03 +
      earnedCompression * 0.07 +
      novelty * 0.05 +
      contrast * 0.05,
  );
}

function compressionQuality(
  candidate: MouthCandidate,
): number {
  const count =
    wordCount(
      candidate.text,
    );

  if (
    count <=
    3
  ) {
    return 1;
  }

  if (
    count <=
    7
  ) {
    return 0.92;
  }

  if (
    count <=
    12
  ) {
    return 0.72;
  }

  if (
    count <=
    20
  ) {
    return 0.54;
  }

  return 0.25;
}

/**
 * Earned compression is the difference between being short and being
 * meaningfully short.
 *
 * A compact line is valuable only when the compression preserves enough
 * approved meaning and viewer movement to carry the sequence.
 *
 * This is a quality signal, not a hard gate and not a reward for brevity
 * by itself.
 */
function earnedCompressionQuality(
  candidate: MouthCandidate,
): number {
  const compression =
    compressionQuality(
      candidate,
    );

  const meaning =
    metric(
      candidate.meaningScore,
    );

  const transition =
    metric(
      candidate.transitionScore,
    );

  const discovery =
    metric(
      candidate.observerDiscoveryScore,
    );

  const semanticContrast =
    isSemanticContrast(
      candidate,
    )
      ? 1
      : 0;

  const experiential =
    isExperientialRealization(
      candidate,
    )
      ? 1
      : 0;

  const consequence =
    isExperientialConsequence(
      candidate,
    )
      ? 1
      : 0;

  /*
   * Shortness earns value from what it successfully carries.
   * Meaning is primary; state movement and discovery support it.
   */
  const carriedMeaning =
    meaning * 0.52 +
    transition * 0.22 +
    discovery * 0.12 +
    semanticContrast * 0.07 +
    experiential * 0.04 +
    consequence * 0.03;

  /*
   * Very short lines receive no automatic privilege when semantically thin.
   */
  const compressionBenefit =
    compression *
    carriedMeaning;

  const semanticLoss =
    compression *
    (1 - meaning) *
    0.34;

  return metric(
    compressionBenefit -
      semanticLoss,
  );
}

function formDiversity(
  candidate: MouthCandidate,
  priorCandidates: readonly MouthCandidate[],
): number {
  if (
    !priorCandidates.length
  ) {
    return 0.75;
  }

  const shape =
    rhetoricalShape(
      candidate.text,
    );

  const recent =
    priorCandidates
      .slice(-3)
      .map(
        (item) =>
          rhetoricalShape(
            item.text,
          ),
      );

  const repeats =
    recent.filter(
      (item) =>
        item ===
        shape,
    ).length;

  if (
    repeats ===
    0
  ) {
    return 1;
  }

  if (
    repeats ===
    1
  ) {
    return 0.62;
  }

  return 0.28;
}

/* ================================================================
 * LOCAL AUTHORITY
 * ================================================================ */

/**
 * Local candidate authority.
 *
 * This remains a tie-breaker and quality signal.
 * It does not replace the canonical viewer state.
 */
function localAuthority(
  candidate: MouthCandidate,
): number {
  const safety =
    1 -
    Math.max(
      candidate.inventionRisk,
      candidate.forbiddenMoveRisk,
    );

  const authorization =
    candidate.supportedEventIds.length >
    0
      ? 1
      : candidate.endpointExactness >=
          0.999
        ? 0.92
        : candidate.reasons.includes(
              "semantic-turn-grounded",
            )
          ? 0.88
          : candidate.reasons.includes(
                "approved-semantic-realization",
              )
            ? 0.84
            : 0.70;

  return metric(
    safety * 0.34 +
      authorization * 0.30 +
      candidate.groundingScore *
        0.18 +
      candidate.meaningScore *
        0.10 +
      candidate.transitionScore *
        0.08,
  );
}

function observerCompletionScore(
  candidate: MouthCandidate,
): number {
  const value = clean(candidate.text);

  if (!value) {
    return 0;
  }

  /*
   * Observer completion is not a style preference.
   *
   * It measures whether the line leaves meaningful semantic work for the
   * observer to perform after the line lands.
   *
   * The candidate must already be authorized. This signal may reward an
   * open realization, but it can never authorize one.
   */
  const words = wordCount(value);

  const discovery = metric(
    candidate.observerDiscoveryScore,
  );

  /*
   * Strongest case:
   *
   * a short fragment can carry a large amount of earned meaning because
   * the sequence has already supplied the context.
   */
  const fragmentForm =
    !/[,:;()[\]{}]/.test(value) &&
    words <= 4 &&
    !/[?]$/.test(value) &&
    !/^(?:i|you|we|they|he|she|it|this|that)\b/i.test(
      value,
    );

  /*
   * A single word is especially capable of leaving completion to the
   * observer because its referent / consequence can remain unresolved.
   */
  const singleWord =
    words === 1 &&
    /^[a-z][a-z'-]*[.!?]?$/i.test(value);

  /*
   * Elliptical continuation:
   *
   * The sentence points toward something without fully stating it.
   */
  const elliptical =
    /\b(?:still|again|yet|already|almost|somehow|not yet|not quite|only|enough)\b/i.test(
      value,
    ) ||
    /^(?:there was|there is|there remained|it remained|something|nothing|more)\b/i.test(
      value,
    );

  /*
   * Residual / unresolved language tends to leave the observer looking
   * backward through the sequence to decide what the line completes.
   */
  const unresolved =
    /\b(?:unexpected|strange|familiar|different|unfinished|remaining|remained|left|more|enough|still|again|yet|almost|somehow|maybe|perhaps)\b/i.test(
      value,
    );

  /*
   * Declarative closure explains the answer instead of making the observer
   * complete it.
   */
  const explanatoryClosure =
    /\b(?:means|shows|proves|reveals|because|therefore|the reason|the meaning|important|meaningful|relationship|lesson|purpose|connection|bond|conclusion|this means|this shows)\b/i.test(
      value,
    );

  /*
   * Explicit emotional labeling can also close the interpretive space.
   *
   * We are not banning emotion. We are distinguishing "felt" from language
   * that tells the observer exactly what the experience was.
   */
  const explicitEmotionalClosure =
    /\b(?:was happy|was sad|was relieved|was in love|was afraid|felt happy|felt sad|felt relieved|felt safe|felt close|felt connected)\b/i.test(
      value,
    );

  /*
   * Directly telling the observer what to think destroys completion.
   */
  const directObserverAddress =
    /\b(?:you|your|viewer|observer)\b/i.test(
      value,
    );

  /*
   * Longer explanatory sentences usually consume more of the semantic work,
   * while very short lines can leave the sequence doing more of the work.
   *
   * This is deliberately a gentle signal, not a "shorter is better" rule.
   */
  const compressionOpen =
    words <= 2
      ? 0.22
      : words <= 4
        ? 0.14
        : words <= 7
          ? 0.06
          : 0;

  let score =
    discovery * 0.45 +
    (singleWord ? 0.26 : 0) +
    (fragmentForm ? 0.16 : 0) +
    (elliptical ? 0.13 : 0) +
    (unresolved ? 0.10 : 0) +
    compressionOpen;

  if (explanatoryClosure) {
    score -= 0.35;
  }

  if (explicitEmotionalClosure) {
    score -= 0.18;
  }

  if (directObserverAddress) {
    score -= 0.25;
  }

  /*
   * Completion never rescues an unauthorized candidate.
   */
  if (
    !isAuthorizedMouthCandidate(candidate) ||
    !isSafe(candidate)
  ) {
    return 0;
  }

  return metric(score);
}

/* ================================================================
 * STATE-BASED GOLD
 * ================================================================ */

/**
 * State-based gold.
 *
 * Gold emerges from the actual transition, not from a fixed stylistic
 * label and not from a designated "fire beat".
 */
function stateGoldPotential(
  candidate: MouthCandidate,
  priorCandidates: readonly MouthCandidate[],
  state: ViewerStateCut,
  nextPromise: string,
): number {
  const transition =
    viewerStateFit(
      candidate,
      state,
    );

  const sequence =
    sequenceTransition(
      candidate,
      priorCandidates,
      state,
    );

  const future =
    nextStatePressure(
      candidate,
      state,
      nextPromise,
    );

  const expression =
    expressionQuality(
      candidate,
    );

  return metric(
    transition * 0.48 +
      sequence * 0.24 +
      future * 0.12 +
      expression * 0.16,
  );
}

/**
 * Relative gold compares candidates inside their own beat.
 *
 * This allows a candidate to emerge because it is meaningfully stronger
 * than the alternatives for that beat.
 */
function relativeGoldPotential(
  candidate: MouthCandidate,
  pool: readonly MouthCandidate[],
  priorCandidates: readonly MouthCandidate[],
  state: ViewerStateCut,
  nextPromise: string,
): number {
  const candidatePotential =
    stateGoldPotential(
      candidate,
      priorCandidates,
      state,
      nextPromise,
    );

  const potentials =
    pool.map(
      (item) =>
        stateGoldPotential(
          item,
          priorCandidates,
          state,
          nextPromise,
        ),
    );

  const maximum =
    potentials.length
      ? Math.max(
          ...potentials,
        )
      : 0;

  if (
    maximum <=
    0
  ) {
    return candidatePotential;
  }

  return metric(
    candidatePotential /
      Math.max(
        0.35,
        maximum,
      ),
  );
}

/* ================================================================
 * PATH SCORING
 * ================================================================ */

function pathCandidateScore(
  candidate: MouthCandidate,
  priorCandidates: readonly MouthCandidate[],
  pool: readonly MouthCandidate[],
  state: ViewerStateCut,
  nextPromise: string,
  previousGoldCount: number,
): number {
  const transition =
    viewerStateFit(
      candidate,
      state,
    );

  const sequence =
    sequenceTransition(
      candidate,
      priorCandidates,
      state,
    );

  const future =
    nextStatePressure(
      candidate,
      state,
      nextPromise,
    );

  const expression =
    expressionQuality(
      candidate,
    );

  const observerDiscovery =
    metric(
      candidate.observerDiscoveryScore,
    );

  const observerCompletion =
    observerCompletionScore(
      candidate,
    );

  const compression =
    compressionQuality(
      candidate,
    );

  const earnedCompression =
    earnedCompressionQuality(
      candidate,
    );

  const diversity =
    formDiversity(
      candidate,
      priorCandidates,
    );

  const authority =
    localAuthority(
      candidate,
    );

  const canonicalStrength =
    canonicalStateSignal(
      state,
    );

  const relativeGold =
    relativeGoldPotential(
      candidate,
      pool,
      priorCandidates,
      state,
      nextPromise,
    );

  const emergence =
    relativeGold >=
        0.90 &&
    transition >=
        0.68
      ? 0.10
      : relativeGold >=
            0.80 &&
          transition >=
            0.58
        ? 0.055
        : 0;

  const goldDiminishing =
    previousGoldCount ===
      0
      ? 1
      : previousGoldCount ===
          1
        ? 0.64
        : previousGoldCount ===
            2
          ? 0.36
          : 0.18;

  const dynamicGold =
    (
      relativeGold *
        0.08 +
      emergence
    ) *
    goldDiminishing;

  /*
   * State transition remains the center of gravity.
   *
   * Earned compression gets a modest explicit weight. Raw compression is
   * intentionally tiny so brevity cannot dominate meaning.
   */
  const score =
    transition * 0.30 +
    sequence * 0.18 +
    future * 0.15 +
    expression * 0.09 +
    observerDiscovery * 0.06 +
    observerCompletion * 0.12 +
    canonicalStrength * 0.05 +
    authority * 0.05 +
    compression * 0.01 +
    earnedCompression * 0.03 +
    diversity * 0.02 +
    dynamicGold * 0.06;

  /*
   * Very weak state movement cannot win merely through pretty wording.
   */
  const stateFloor =
    transition <
    0.28
      ? 0.52
      : 1;

  const finalScore =
    metric(
      score *
        stateFloor,
    );

  debugBeamCandidate(
    candidate,
    priorCandidates,
    state,
    nextPromise,
    pool,
    {
      transition,
      sequence,
      future,
      expression,
      observerDiscovery,
      observerCompletion,
      compression,
      earnedCompression,
      diversity,
      authority,
      stateStrength:
        canonicalStrength,
      relativeGold,
      dynamicGold,
      finalScore,
    },
  );

  return finalScore;
}

/* ================================================================
 * CANDIDATE ORDERING
 * ================================================================ */

/**
 * Local ordering.
 *
 * This is only the entry ordering before sequence expansion.
 * Final selection remains path-relative.
 */
function compareCandidates(
  a: MouthCandidate,
  b: MouthCandidate,
): number {
  const aSafe =
    isSafe(
      a,
    );

  const bSafe =
    isSafe(
      b,
    );

  if (
    aSafe !==
    bSafe
  ) {
    return aSafe
      ? -1
      : 1;
  }

  const aAuthority =
    localAuthority(
      a,
    );

  const bAuthority =
    localAuthority(
      b,
    );

  if (
    aAuthority !==
    bAuthority
  ) {
    return (
      bAuthority -
      aAuthority
    );
  }

  const aStateProxy =
    metric(
      a.transitionScore *
        0.55 +
        a.meaningScore *
          0.45,
    );

  const bStateProxy =
    metric(
      b.transitionScore *
        0.55 +
        b.meaningScore *
          0.45,
    );

  if (
    aStateProxy !==
    bStateProxy
  ) {
    return (
      bStateProxy -
      aStateProxy
    );
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
      seen.has(
        key,
      )
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

/* ================================================================
 * PATH STATE
 * ================================================================ */

/**
 * A Beam path contains ONLY the candidate choices.
 *
 * Canonical viewer state is owned by MouthCandidatePool.
 *
 * The path never:
 * - creates viewer state
 * - stores viewer state
 * - reconstructs viewer state
 * - attaches viewer state to a candidate
 *
 * This keeps authority singular:
 *
 *   Pool -> viewerState
 *   Path -> candidate choices
 */
type Path = {
  candidates: MouthCandidate[];
  score: number;
  stateQuality: number;
};

function priorCandidatesFromPath(
  path: Path,
): MouthCandidate[] {
  return path.candidates;
}

function poolForCandidate(
  candidate: MouthCandidate,
  pools: readonly MouthCandidatePool[],
): MouthCandidatePool | undefined {
  return pools.find(
    (pool) =>
      pool.order ===
      candidate.beatOrder,
  );
}

/* ================================================================
 * PATH QUALITY
 * ================================================================ */

function pathTransitionProfile(
  path: Path,
  pools: readonly MouthCandidatePool[],
): number {
  if (
    !path.candidates.length
  ) {
    return 0;
  }

  let total = 0;

  for (
    let index = 0;
    index <
    path.candidates.length;
    index += 1
  ) {
    const candidate =
      path.candidates[index];

    const pool =
      poolForCandidate(
        candidate,
        pools,
      );

    if (!pool) {
      continue;
    }

    total +=
      sequenceTransition(
        candidate,
        path.candidates.slice(
          0,
          index,
        ),
        pool.viewerState,
      );
  }

  return metric(
    total /
      path.candidates.length,
  );
}

function pathMeaningPeak(
  path: Path,
  pools: readonly MouthCandidatePool[],
): number {
  if (
    path.candidates.length <
    2
  ) {
    return 0;
  }

  let peak = 0;

  for (
    let index = 1;
    index <
    path.candidates.length;
    index += 1
  ) {
    const candidate =
      path.candidates[index];

    const pool =
      poolForCandidate(
        candidate,
        pools,
      );

    if (!pool) {
      continue;
    }

    const nextPromise =
      clean(
        pool.nextPromise ??
          pool.frontier ??
          "",
      );

    const value =
      stateGoldPotential(
        candidate,
        path.candidates.slice(
          0,
          index,
        ),
        pool.viewerState,
        nextPromise,
      );

    peak =
      Math.max(
        peak,
        value,
      );
  }

  return metric(
    peak,
  );
}

function pathFuturePressure(
  path: Path,
  pools: readonly MouthCandidatePool[],
): number {
  if (
    !path.candidates.length
  ) {
    return 0;
  }

  let total = 0;

  for (
    const candidate of
      path.candidates
  ) {
    const pool =
      poolForCandidate(
        candidate,
        pools,
      );

    if (!pool) {
      continue;
    }

    total +=
      nextStatePressure(
        candidate,
        pool.viewerState,
        clean(
          pool.nextPromise ??
            pool.frontier ??
            "",
        ),
      );
  }

  return metric(
    total /
      path.candidates.length,
  );
}

function pathExpressionQuality(
  path: Path,
): number {
  if (
    !path.candidates.length
  ) {
    return 0;
  }

  let total = 0;

  for (
    const candidate of
      path.candidates
  ) {
    total +=
      expressionQuality(
        candidate,
      );
  }

  return metric(
    total /
      path.candidates.length,
  );
}

/**
 * Final path quality.
 *
 * The pool owns state.
 * The path owns choices.
 *
 * Therefore the final evaluator always receives both explicitly.
 */
function pathFinalQuality(
  path: Path,
  pools: readonly MouthCandidatePool[],
): number {
  if (
    !path.candidates.length
  ) {
    return 0;
  }

  const average =
    path.score /
    path.candidates.length;

  const transition =
    pathTransitionProfile(
      path,
      pools,
    );

  const meaningPeak =
    pathMeaningPeak(
      path,
      pools,
    );

  const future =
    pathFuturePressure(
      path,
      pools,
    );

  const expression =
    pathExpressionQuality(
      path,
    );

  return metric(
    average * 0.48 +
      transition * 0.24 +
      meaningPeak * 0.12 +
      future * 0.08 +
      expression * 0.08,
  );
}

/* ================================================================
 * DEBUG
 * ================================================================ */

function debugBeamCandidate(
  candidate: MouthCandidate,
  priorCandidates: readonly MouthCandidate[],
  state: ViewerStateCut,
  nextPromise: string,
  pool: readonly MouthCandidate[],
  values: {
    transition: number;
    sequence: number;
    future: number;
    expression: number;
    observerDiscovery: number;
    observerCompletion: number;
    compression: number;
    earnedCompression: number;
    diversity: number;
    authority: number;
    stateStrength: number;
    relativeGold: number;
    dynamicGold: number;
    finalScore: number;
  },
): void {
  if (
    !DEBUG_BEAM
  ) {
    return;
  }

  console.log(
    `[QRE][BEAM] ${JSON.stringify({
      text:
        clean(
          candidate.text,
        ),

      priorCount:
        priorCandidates.length,

      poolSize:
        pool.length,

      attentionMove:
        state.attentionMove,

      beforeState:
        clean(
          state.beforeState,
        ),

      afterState:
        clean(
          state.afterState,
        ),

      stateShift:
        Number(
          state.stateShift.toFixed(
            3,
          ),
        ),

      curiosity:
        Number(
          state.curiosityPressure.toFixed(
            3,
          ),
        ),

      predictionError:
        Number(
          state.predictionError.toFixed(
            3,
          ),
        ),

      nextPromise:
        clean(
          nextPromise,
        ),

      transition:
        Number(
          values.transition.toFixed(
            3,
          ),
        ),

      sequence:
        Number(
          values.sequence.toFixed(
            3,
          ),
        ),

      future:
        Number(
          values.future.toFixed(
            3,
          ),
        ),

      expression:
        Number(
          values.expression.toFixed(
            3,
          ),
        ),

      observerDiscovery:
        Number(
          values.observerDiscovery.toFixed(
            3,
          ),
        ),

      observerCompletion:
        Number(
          values.observerCompletion.toFixed(
            3,
          ),
        ),

      compression:
        Number(
          values.compression.toFixed(
            3,
          ),
        ),

      earnedCompression:
        Number(
          values.earnedCompression.toFixed(
            3,
          ),
        ),

      diversity:
        Number(
          values.diversity.toFixed(
            3,
          ),
        ),

      authority:
        Number(
          values.authority.toFixed(
            3,
          ),
        ),

      stateStrength:
        Number(
          values.stateStrength.toFixed(
            3,
          ),
        ),

      relativeGold:
        Number(
          values.relativeGold.toFixed(
            3,
          ),
        ),

      dynamicGold:
        Number(
          values.dynamicGold.toFixed(
            3,
          ),
        ),

      finalScore:
        Number(
          values.finalScore.toFixed(
            3,
          ),
        ),
    })}`,
  );
}

/* ================================================================
 * BEAM SEARCH
 * ================================================================ */

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered =
    [...pools].sort(
      (
        a,
        b,
      ) =>
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

  /*
   * Runtime boundary check.
   *
   * TypeScript requires viewerState.
   * This protects the actual application boundary if malformed JavaScript
   * reaches the Beam.
   */
  if (
    ordered.some(
      (pool) =>
        !pool.viewerState ||
        typeof pool.viewerState !==
          "object",
    )
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

  let paths: Path[] = [
    {
      candidates: [],
      score: 0,
      stateQuality: 0,
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
          isAuthorizedMouthCandidate,
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
     * THIS IS THE ONE STATE AUTHORITY.
     *
     * Nothing below derives or reconstructs another state object.
     */
    const state =
      pool.viewerState;

    const nextPromise =
      clean(
        pool.nextPromise ??
          pool.frontier ??
          "",
      );

    const expanded: Path[] = [];

    for (
      const path of
        paths
    ) {
      const priorCandidates =
        priorCandidatesFromPath(
          path,
        );

      /*
       * Count prior strong realizations using the canonical pool
       * that belongs to each prior candidate.
       */
      let previousGoldCount =
        0;

      for (
        let priorIndex = 0;
        priorIndex <
          priorCandidates.length;
        priorIndex += 1
      ) {
        const priorCandidate =
          priorCandidates[
            priorIndex
          ];

        const priorPool =
          poolForCandidate(
            priorCandidate,
            ordered,
          );

        if (!priorPool) {
          continue;
        }

        const priorPromise =
          clean(
            priorPool.nextPromise ??
              priorPool.frontier ??
              "",
          );

        const priorGold =
          stateGoldPotential(
            priorCandidate,
            priorCandidates.slice(
              0,
              priorIndex,
            ),
            priorPool.viewerState,
            priorPromise,
          );

        if (
          priorGold >=
          0.62
        ) {
          previousGoldCount +=
            1;
        }
      }

      for (
        const candidate of
          eligible
      ) {
        const exactRepeat =
          priorCandidates.some(
            (
              prior,
            ) =>
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
            priorCandidates,
            eligible,
            state,
            nextPromise,
            previousGoldCount,
          );

        const candidateStateQuality =
          viewerStateFit(
            candidate,
            state,
          );

        expanded.push({
          candidates: [
            ...priorCandidates,
            candidate,
          ],

          score:
            path.score +
            candidateScore,

          stateQuality:
            path.stateQuality +
            candidateStateQuality,
        });

        if (
          DEBUG_BEAM
        ) {
          debugBeamCandidate(
            candidate,
            priorCandidates,
            state,
            nextPromise,
            eligible,
            {
              transition:
                viewerStateFit(
                  candidate,
                  state,
                ),

              sequence:
                sequenceTransition(
                  candidate,
                  priorCandidates,
                  state,
                ),

              future:
                nextStatePressure(
                  candidate,
                  state,
                  nextPromise,
                ),

              expression:
                expressionQuality(
                  candidate,
                ),

              observerDiscovery:
                metric(
                  candidate.observerDiscoveryScore,
                ),

              observerCompletion:
                observerCompletionScore(
                  candidate,
                ),

              compression:
                compressionQuality(
                  candidate,
                ),

              earnedCompression:
                earnedCompressionQuality(
                  candidate,
                ),

              diversity:
                formDiversity(
                  candidate,
                  priorCandidates,
                ),

              authority:
                localAuthority(
                  candidate,
                ),

              stateStrength:
                canonicalStateSignal(
                  state,
                ),

              relativeGold:
                relativeGoldPotential(
                  candidate,
                  eligible,
                  priorCandidates,
                  state,
                  nextPromise,
                ),

              dynamicGold:
                Math.max(
                  0,
                  candidateScore -
                    (
                      viewerStateFit(
                        candidate,
                        state,
                      ) * 0.30 +
                      sequenceTransition(
                        candidate,
                        priorCandidates,
                        state,
                      ) * 0.18 +
                      nextStatePressure(
                        candidate,
                        state,
                        nextPromise,
                      ) * 0.15 +
                      expressionQuality(
                        candidate,
                      ) * 0.09 +
                      metric(
                        candidate.observerDiscoveryScore,
                      ) * 0.06 +
                      observerCompletionScore(
                        candidate,
                      ) * 0.12 +
                      canonicalStateSignal(
                        state,
                      ) * 0.05 +
                      localAuthority(
                        candidate,
                      ) * 0.05 +
                      compressionQuality(
                        candidate,
                      ) * 0.01 +
                      earnedCompressionQuality(
                        candidate,
                      ) * 0.03 +
                      formDiversity(
                        candidate,
                        priorCandidates,
                      ) * 0.02
                    ),
                ),

              finalScore:
                candidateScore,
            },
          );
        }
      }
    }

    /*
     * State quality is the first pruning criterion.
     *
     * The Beam protects strong canonical state paths before using
     * cumulative score as the secondary ordering.
     */
    expanded.sort(
      (
        a,
        b,
      ) => {
        const stateA =
          a.candidates.length
            ? a.stateQuality /
              a.candidates.length
            : 0;

        const stateB =
          b.candidates.length
            ? b.stateQuality /
              b.candidates.length
            : 0;

        if (
          stateA !==
          stateB
        ) {
          return (
            stateB -
            stateA
          );
        }

        return (
          b.score -
          a.score
        );
      },
    );

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
   * Final comparison uses the complete state path.
   */
  paths.sort(
    (
      a,
      b,
    ) => {
      const aFinal =
        pathFinalQuality(
          a,
          ordered,
        );

      const bFinal =
        pathFinalQuality(
          b,
          ordered,
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

      const aStateAverage =
        a.candidates.length
          ? a.stateQuality /
            a.candidates.length
          : 0;

      const bStateAverage =
        b.candidates.length
          ? b.stateQuality /
            b.candidates.length
          : 0;

      if (
        aStateAverage !==
        bStateAverage
      ) {
        return (
          bStateAverage -
          aStateAverage
        );
      }

      if (
        a.score !==
        b.score
      ) {
        return (
          b.score -
          a.score
        );
      }

      return (
        b.candidates.length -
        a.candidates.length
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

  const finalQuality =
    pathFinalQuality(
      best,
      ordered,
    );

  const candidates =
    best.candidates;

  return {
    candidates,

    texts:
      candidates.map(
        (
          candidate,
        ) =>
          clean(
            candidate.text,
          ),
      ),

    score:
      Number(
        clamp01(
          average *
            0.65 +
          finalQuality *
            0.35,
        ).toFixed(
          3,
        ),
      ),
  };
}
