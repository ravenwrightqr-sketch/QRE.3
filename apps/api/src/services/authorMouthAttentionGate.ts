
/**
 * QRE MOUTH ATTENTION CUT GATE
 *
 * A Mouth line is a cinematic cut, not a compressed paragraph.
 *
 * This gate evaluates attention behavior only.
 * It does not own reality, meaning, or endpoint authority.
 *
 * CANONICAL ATTENTION LAW:
 *
 * A cut is valuable when it changes the observer's state.
 *
 * The important question is not:
 *   "Is this line poetic?"
 *
 * It is:
 *   "What is different in the observer after this line arrived?"
 *
 * Therefore attention is modeled as:
 *
 *   prior state
 *      +
 *   candidate realization
 *      ->
 *   changed state
 *      ->
 *   changed expectation
 *
 * Lexical novelty is evidence only.
 * The existing viewer-state representation is the stronger signal.
 */

import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";

export type MouthAttentionCutInput = {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
};

export type MouthAttentionCutEvaluation = {
  score: number;
  independence: number;
  density: number;
  forwardPull: number;
  nextNeed: number;
  clauseLoad: number;
  sourceRestatement: number;
  attentionChange: number;
  reasons: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function words(text: string): string[] {
  return clean(text)
    .split(/\s+/)
    .filter(Boolean);
}

function normalizedTokens(text: string): Set<string> {
  return new Set(
    words(text)
      .map((word) =>
        word
          .toLowerCase()
          .replace(/[^a-z0-9'-]/g, ""),
      )
      .filter((word) => word.length >= 3),
  );
}

function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (!a.size || !b.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) {
      hits += 1;
    }
  }

  return hits / Math.max(1, a.size);
}

function phraseOverlap(
  text: string,
  phrase: string,
): number {
  return overlap(
    normalizedTokens(text),
    normalizedTokens(phrase),
  );
}

function metric(value: number): number {
  return Number(
    Math.max(
      0,
      Math.min(
        1,
        value,
      ),
    ).toFixed(
      3,
    ),
  );
}

function clauseLoad(text: string): number {
  const value = clean(text);

  if (!value) return 1;

  const commas =
    (
      value.match(
        /,/g,
      ) ?? []
    ).length;

  const conjunctions =
    (
      value.match(
        /\b(?:and|then|but|while|because|so)\b/gi,
      ) ?? []
    ).length;

  const semicolons =
    (
      value.match(
        /;/g,
      ) ?? []
    ).length;

  const raw =
    commas * 0.22 +
    conjunctions * 0.28 +
    semicolons * 0.4;

  return Math.min(
    1,
    raw,
  );
}

function independence(text: string): number {
  const count =
    words(text).length;

  if (!count) return 0;

  if (count <= 6) return 1;
  if (count <= 8) return 0.82;
  if (count <= 10) return 0.58;

  return 0.25;
}

function density(text: string): number {
  const count =
    words(text).length;

  if (!count) return 0;

  if (count <= 5) return 1;
  if (count <= 7) return 0.9;
  if (count <= 9) return 0.72;

  return 0.45;
}

function sourceRestatement(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const ids =
    [
      ...(beat.eventIds ?? []),
    ].filter(Boolean);

  if (!ids.length) return 0;

  let strongest = 0;

  for (const id of ids) {
    const event =
      envelope.events.find(
        (candidate) =>
          candidate.id === id,
      );

    if (!event) continue;

    strongest =
      Math.max(
        strongest,
        phraseOverlap(
          text,
          event.label,
        ),
      );
  }

  if (strongest >= 0.95) return 1;
  if (strongest >= 0.85) return 0.55;

  return 0;
}

function nextNeed(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const next =
    clean(
      beat.next ||
      beat.frontier ||
      "",
    );

  if (!next) {
    /*
     * When no explicit next promise exists, the existing viewer-state
     * pressure becomes the fallback.
     */
    return metric(
      beat.viewerState?.curiosityPressure ??
      0.5,
    );
  }

  const similarity =
    phraseOverlap(
      text,
      next,
    );

  /*
   * We want the candidate to create need, not simply repeat the next beat.
   */
  if (similarity >= 0.8) return 0.25;
  if (similarity >= 0.5) return 0.55;

  return 0.85;
}

function forwardPull(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const value =
    clean(text).toLowerCase();

  if (!value) return 0;

  const unresolvedSignals =
    /\b(?:apparently|already|again|still|yet|temporary|temporarily|almost|finally|just|now|next|back|approved|resumed|called|changed|remained|began|started|ended|unfinished|continued|again)\b/i;

  const lexicalSignal =
    unresolvedSignals.test(
      value,
    )
      ? 0.9
      : 0.45;

  const stateSignal =
    metric(
      Math.max(
        beat.viewerState?.curiosityPressure ??
          0,
        beat.viewerState?.payoffPressure ??
          0,
        beat.viewerState?.predictionError ??
          0,
      ),
    );

  const transitionSignal =
    beat.viewerState?.stateShift ?? 0;

  const transitionPull =
    metric(
      stateSignal * 0.58 +
      transitionSignal * 0.42,
    );

  return metric(
    Math.max(
      lexicalSignal,
      transitionPull,
      nextNeed(
        text,
        beat,
      ),
    ),
  );
}

/**
 * Measures whether the candidate realizes an actual observer-state change.
 *
 * OLD MODEL:
 *
 *   lexical novelty
 *   + semantic transition words
 *   + event count
 *
 * NEW MODEL:
 *
 *   1. explicit viewer-state shift already authorized upstream
 *   2. candidate alignment with the AFTER state
 *   3. candidate departure from the BEFORE state
 *   4. expectation / curiosity pressure
 *   5. prediction error
 *   6. relational / experiential interruption already represented by
 *      viewerState
 *   7. lexical novelty as supporting evidence
 *
 * The gate therefore asks:
 *
 *   "Does this candidate help the observer leave the old state and enter
 *    the new one?"
 *
 * It does NOT attempt to infer a new reality.
 */
/**
 * Canonical candidate transition evaluation.
 *
 * Attention is not lexical novelty.
 *
 * The authoritative transition already exists on the approved beat:
 *
 *   BEFORE -> AFTER
 *
 * The candidate is evaluated on whether its expression helps the observer
 * move through that authorized transition and leaves useful expectation alive.
 *
 * Priority:
 *
 *   1. authorized state shift
 *   2. candidate departure from BEFORE
 *   3. candidate participation in AFTER
 *   4. recontextualization
 *   5. surviving expectation
 *   6. sequence novelty
 *
 * Text-shape signals are deliberately secondary.
 *
 * This function does not infer new reality or invent a transition.
 */
function attentionChange(
  text: string,
  beat: MouthCandidateBeat,
  priorTexts: readonly string[],
): number {
  const value = clean(text);

  if (!value) {
    return 0;
  }

  const state = beat.viewerState;

  /*
   * Without canonical viewer state, retain a conservative fallback.
   *
   * This keeps the existing pipeline operational while making it explicit
   * that the authoritative path requires ViewerStateCut.
   */
  if (!state) {
    if (!priorTexts.length) {
      return metric(
        independence(value) * 0.42 +
        density(value) * 0.28 +
        (priorTexts.length === 0 ? 0.3 : 0),
      );
    }

    let maxPriorOverlap = 0;
    const currentTokens = normalizedTokens(value);

    for (const prior of priorTexts) {
      maxPriorOverlap = Math.max(
        maxPriorOverlap,
        overlap(
          currentTokens,
          normalizedTokens(prior),
        ),
      );
    }

    return metric(
      (1 - maxPriorOverlap) * 0.55 +
      independence(value) * 0.25 +
      density(value) * 0.2,
    );
  }

  /*
   * ------------------------------------------------------------
   * AUTHORITATIVE STATE
   * ------------------------------------------------------------
   */

  const beforeState = clean(
    state.beforeState,
  );

  const afterState = clean(
    state.afterState,
  );

  const stateShift = metric(
    state.stateShift ?? 0,
  );

  const predictionError = metric(
    state.predictionError ?? 0,
  );

  const curiosityPressure = metric(
    state.curiosityPressure ?? 0,
  );

  const contrast = metric(
    state.contrast ?? 0,
  );

  const interruption = metric(
    state.interruption ?? 0,
  );

  const accumulation = metric(
    state.accumulation ?? 0,
  );

  const payoffPressure = metric(
    state.payoffPressure ?? 0,
  );

  /*
   * ------------------------------------------------------------
   * CANDIDATE -> STATE ALIGNMENT
   * ------------------------------------------------------------
   *
   * We do not require lexical overlap with AFTER.
   *
   * A good experiential realization may express the state without using
   * the vocabulary used to describe that state internally.
   *
   * Example:
   *
   *   AFTER: "the encounter now carries lasting significance"
   *   CANDIDATE: "Still wanting."
   *
   * Exact vocabulary is not the point.
   */

  const beforeAlignment = beforeState
    ? phraseOverlap(
        value,
        beforeState,
      )
    : 0;

  const afterAlignment = afterState
    ? phraseOverlap(
        value,
        afterState,
      )
    : 0;

  /*
   * Departure rewards leaving the old state rather than merely describing it.
   */
  const stateDeparture = metric(
    Math.max(
      0,
      afterAlignment -
        beforeAlignment,
    ),
  );

  /*
   * AFTER participation can still be valuable when lexical departure is low.
   * This matters for subtle realizations that stay close to the emerging state.
   */
  const stateParticipation = metric(
    afterAlignment,
  );

  /*
   * BEFORE/AFTER distance is evidence that the upstream system expects a
   * meaningful transition.
   */
  const stateDistance =
    beforeState && afterState
      ? metric(
          1 -
            phraseOverlap(
              beforeState,
              afterState,
            ),
        )
      : 0;

  /*
   * ------------------------------------------------------------
   * RECONTEXTUALIZATION
   * ------------------------------------------------------------
   *
   * A candidate is particularly valuable when it helps the observer
   * reinterpret what has already happened in light of the new state.
   */
  const recontextualization = metric(
    stateShift * 0.28 +
    stateDistance * 0.22 +
    stateDeparture * 0.22 +
    stateParticipation * 0.10 +
    predictionError * 0.10 +
    contrast * 0.08,
  );

  /*
   * ------------------------------------------------------------
   * EXPECTATION
   * ------------------------------------------------------------
   *
   * What remains alive after the cut?
   *
   * We use the authorized viewer-state pressure first and the explicit
   * next promise only as contextual evidence.
   */
  const nextExpectation = clean(
    beat.next ||
      beat.frontier ||
      "",
  );

  const expectationOverlap = nextExpectation
    ? phraseOverlap(
        value,
        nextExpectation,
      )
    : 0;

  /*
   * Moderate overlap can maintain continuity.
   * High overlap can become premature explanation.
   */
  const expectationContinuity =
    expectationOverlap >= 0.12 &&
    expectationOverlap <= 0.62
      ? 1
      : 0;

  const prematureExpectationResolution =
    expectationOverlap >= 0.82
      ? 1
      : 0;

  const survivingExpectation = metric(
    curiosityPressure * 0.32 +
    predictionError * 0.20 +
    payoffPressure * 0.16 +
    interruption * 0.12 +
    accumulation * 0.10 +
    expectationContinuity * 0.10 -
    prematureExpectationResolution * 0.18,
  );

  /*
   * ------------------------------------------------------------
   * SEQUENCE NOVELTY
   * ------------------------------------------------------------
   *
   * Lexical novelty remains useful, but it is explicitly a supporting
   * signal rather than the definition of attention.
   */
  let lexicalNovelty = 1;

  if (priorTexts.length) {
    const currentTokens = normalizedTokens(
      value,
    );

    let maxPriorOverlap = 0;

    for (const prior of priorTexts) {
      maxPriorOverlap = Math.max(
        maxPriorOverlap,
        overlap(
          currentTokens,
          normalizedTokens(prior),
        ),
      );
    }

    lexicalNovelty = metric(
      1 - maxPriorOverlap,
    );
  }

  /*
   * ------------------------------------------------------------
   * FORM SUPPORT
   * ------------------------------------------------------------
   *
   * These are intentionally tiny support signals.
   *
   * They can improve delivery but cannot define the transition.
   */
  const formSupport = metric(
    independence(value) * 0.55 +
    density(value) * 0.45,
  );

  /*
   * ------------------------------------------------------------
   * FINAL TRANSITION
   * ------------------------------------------------------------
   *
   * The majority of the score comes directly from the authorized
   * viewer-state transition and its consequences.
   */
  return metric(
    stateShift * 0.24 +
    stateDeparture * 0.18 +
    stateParticipation * 0.12 +
    recontextualization * 0.20 +
    survivingExpectation * 0.14 +
    lexicalNovelty * 0.06 +
    formSupport * 0.06,
  );
}
export function evaluateAttentionCut(
  input: MouthAttentionCutInput,
): MouthAttentionCutEvaluation {
  const text =
    clean(
      input.text,
    );

  const load =
    clauseLoad(
      text,
    );

  const independenceScore =
    independence(
      text,
    );

  const densityScore =
    density(
      text,
    );

  const restatement =
    sourceRestatement(
      text,
      input.beat,
      input.envelope,
    );

  const pull =
    forwardPull(
      text,
      input.beat,
    );

  const need =
    nextNeed(
      text,
      input.beat,
    );

  const change =
    attentionChange(
      text,
      input.beat,
      input.priorTexts ?? [],
    );

  /*
   * Attention is the center of gravity.
   *
   * The gate still rewards compact, independent cuts and forward motion,
   * but they are subordinate to actual state change.
   */
  const score =
    Math.max(
      0,
      Math.min(
        1,
        independenceScore * 0.12 +
        densityScore * 0.08 +
        pull * 0.17 +
        need * 0.13 +
        change * 0.42 +
        (
          input.beat.viewerState?.stateShift ??
          0
        ) * 0.08 -
        load * 0.08 -
        restatement * 0.06,
      ),
    );

  const reasons: string[] = [];

  if (load >= 0.45) {
    reasons.push(
      "high-clause-load",
    );
  }

  if (independenceScore < 0.7) {
    reasons.push(
      "weak-cut-independence",
    );
  }

  if (pull < 0.5) {
    reasons.push(
      "weak-forward-pull",
    );
  }

  if (need < 0.5) {
    reasons.push(
      "weak-next-need",
    );
  }

  if (change < 0.5) {
    reasons.push(
      "weak-attention-change",
    );
  }

  if (
    input.beat.viewerState?.stateShift !==
      undefined &&
    input.beat.viewerState.stateShift >=
      0.7
  ) {
    reasons.push(
      "strong-authorized-state-shift",
    );
  }

  if (
    input.beat.viewerState?.predictionError !==
      undefined &&
    input.beat.viewerState.predictionError >=
      0.6
  ) {
    reasons.push(
      "high-prediction-error",
    );
  }

  if (
    input.beat.viewerState?.curiosityPressure !==
      undefined &&
    input.beat.viewerState.curiosityPressure >=
      0.7
  ) {
    reasons.push(
      "high-curiosity-pressure",
    );
  }

  if (restatement >= 0.55) {
    reasons.push(
      "attention-source-restatement",
    );
  }

  if (score >= 0.8) {
    reasons.push(
      "strong-moving-cut",
    );
  }

  return {
    score:
      Number(
        score.toFixed(
          3,
        ),
      ),

    independence:
      Number(
        independenceScore.toFixed(
          3,
        ),
      ),

    density:
      Number(
        densityScore.toFixed(
          3,
        ),
      ),

    forwardPull:
      Number(
        pull.toFixed(
          3,
        ),
      ),

    nextNeed:
      Number(
        need.toFixed(
          3,
        ),
      ),

    clauseLoad:
      Number(
        load.toFixed(
          3,
        ),
      ),

    sourceRestatement:
      Number(
        restatement.toFixed(
          3,
        ),
      ),

    attentionChange:
      Number(
        change.toFixed(
          3,
        ),
      ),

    reasons,
  };
}

