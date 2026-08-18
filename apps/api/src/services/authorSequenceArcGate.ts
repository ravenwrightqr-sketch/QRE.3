/**
 * QRE SEQUENCE ARC / PAYOFF GATE · CANONICAL
 *
 * Deterministic sequence-level editorial gate.
 *
 * The Attention Editor asks:
 *   "Is each realized line good enough?"
 *
 * This gate asks:
 *   "Does the sequence become something?"
 *
 * It never invents meaning.
 * It evaluates the approved Beat Graph, realized mouth lines, and their
 * setup/payoff relationships as one accumulating sequence.
 *
 * Core invariant:
 *
 *   establishment
 *       →
 *   meaning transition
 *       →
 *   escalation / consequence
 *       →
 *   callback / payoff linkage
 *       →
 *   final transformation
 *
 * Not every story needs every role literally. The gate adapts to the
 * attention functions already approved by the Beat Graph.
 */

export type SequenceArcBeat = {
  order: number;
  role?: string;
  attentionFunction?: string;
  creativeMove?: string;
  text: string;
  change?: string;
  next?: string;
  frontier?: string;
  setsUp?: string[];
  paysOff?: string[];
};

export type SequenceArcScore = {
  order: number;
  establishment: number;
  meaningTransition: number;
  escalation: number;
  setupLinkage: number;
  payoffLinkage: number;
  finality: number;
  score: number;
  reasons: string[];
};

export type SequenceArcEdit = {
  accepted: boolean;
  sequenceScore: number;
  establishment: number;
  meaningTransition: number;
  escalation: number;
  payoffLinkage: number;
  finalTransformation: number;
  beats: SequenceArcScore[];
  weakBeats: number[];
  failures: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten more"
    .split(/\s+/),
);

const TRANSITION =
  /\b(?:but|yet|still|instead|only|except|again|already|apparently|temporarily|after all|this time|once|now|then|after|finally|before)\b/i;

const STATUS_INTERPRETATION =
  /\b(?:lawyer|boss|ceo|diva|celebrity|negotiat(?:e|ion|or)|rebel|rebellion|defiance|evidence|case|trial|court|verdict|terms|deal|contract|royalty|queen|king|status|in charge|mission|operation|suspect|legend|undefeated|called the shots|peace|protest|under protest|upper hand|power|victory|victorious|mini[- ]?rebel|tiny rebel|not impressed|means business)\b/i;

const RELATIONAL_INTERPRETATION =
  /\b(?:but|yet|still|instead|only|except|again|already|apparently|temporarily|after all|this time|once|now)\b/i;

const GENERIC =
  /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|what a day|everything changed|the journey|new chapter|happy ending|so fabulous|poodle power|good girl|mere formality|victory in grooming)\b/i;

function words(text: string): string[] {
  return clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP.has(word),
    );
}

function tokenSet(text: string): Set<string> {
  return new Set(words(text));
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

  return hits / a.size;
}

function interpretiveLine(text: string): boolean {
  return (
    STATUS_INTERPRETATION.test(text) ||
    RELATIONAL_INTERPRETATION.test(text)
  );
}

function carryForward(
  current: string,
  prior: string[],
): number {
  if (!prior.length) return 0.5;

  return metric(
    overlap(
      tokenSet(current),
      tokenSet(prior.join(" ")),
    ),
  );
}

function setupLinkage(
  beat: SequenceArcBeat,
  priorBeats: SequenceArcBeat[],
): number {
  const setup = new Set(
    (beat.setsUp ?? [])
      .map(clean)
      .filter(Boolean)
      .flatMap((value) =>
        words(value),
      ),
  );

  if (!setup.size) {
    return 0.2;
  }

  const priorPayload = priorBeats
    .flatMap((prior) => [
      ...(prior.paysOff ?? []),
      ...(prior.setsUp ?? []),
      clean(prior.text),
    ])
    .join(" ");

  const prior = tokenSet(
    priorPayload,
  );

  return metric(
    overlap(setup, prior),
  );
}

function payoffLinkage(
  beat: SequenceArcBeat,
  priorBeats: SequenceArcBeat[],
): number {
  const payoff = new Set(
    (beat.paysOff ?? [])
      .map(clean)
      .filter(Boolean)
      .flatMap((value) =>
        words(value),
      ),
  );

  if (!payoff.size) {
    return 0.05;
  }

  const planted = priorBeats
    .flatMap((prior) => [
      ...(prior.setsUp ?? []),
      ...(prior.paysOff ?? []),
      clean(prior.text),
    ])
    .join(" ");

  const prior = tokenSet(
    planted,
  );

  return metric(
    overlap(payoff, prior),
  );
}

function hasMeaningTransition(
  beat: SequenceArcBeat,
  priorTexts: string[],
): number {
  const text = clean(beat.text);

  if (!text) return 0;

  let score = 0.1;

  if (
    interpretiveLine(text)
  ) {
    score += 0.35;
  }

  if (
    TRANSITION.test(text)
  ) {
    score += 0.2;
  }

  if (
    beat.creativeMove &&
    beat.creativeMove !== "none"
  ) {
    score += 0.15;
  }

  const carry = carryForward(
    text,
    priorTexts,
  );

  if (carry >= 0.08) {
    score += 0.1;
  }

  if (carry >= 0.18) {
    score += 0.08;
  }

  if (
    beat.attentionFunction ===
      "turn" ||
    beat.attentionFunction ===
      "reframe"
  ) {
    score += 0.15;
  }

  if (GENERIC.test(text)) {
    score -= 0.25;
  }

  return metric(score);
}

function escalationValue(
  beat: SequenceArcBeat,
  index: number,
  total: number,
): number {
  const role = clean(
    beat.attentionFunction ??
      beat.role,
  );

  let score = 0.08;

  if (
    [
      "escalation",
      "consequence",
    ].includes(role)
  ) {
    score += 0.38;
  }

  if (
    [
      "turn",
      "reframe",
    ].includes(role)
  ) {
    score += 0.16;
  }

  if (
    beat.next ||
    beat.frontier
  ) {
    score += 0.12;
  }

  if (
    beat.paysOff?.length
  ) {
    score += 0.12;
  }

  if (
    index > 0 &&
    index < total - 1
  ) {
    score += 0.08;
  }

  return metric(score);
}

function finalityValue(
  beat: SequenceArcBeat,
): number {
  const role = clean(
    beat.attentionFunction ??
      beat.role,
  );

  let score = 0.05;

  if (
    [
      "payoff",
      "release",
      "callback",
      "consequence",
    ].includes(role)
  ) {
    score += 0.45;
  }

  if (
    beat.paysOff?.length
  ) {
    score += 0.2;
  }

  if (
    beat.creativeMove &&
    beat.creativeMove !== "none"
  ) {
    score += 0.08;
  }

  if (
    beat.text &&
    !GENERIC.test(beat.text)
  ) {
    score += 0.08;
  }

  return metric(score);
}

function scoreBeat(
  beat: SequenceArcBeat,
  priorBeats: SequenceArcBeat[],
  priorTexts: string[],
  index: number,
  total: number,
): SequenceArcScore {
  const establishment =
    index === 0
      ? beat.setsUp?.length
        ? 0.9
        : beat.text
          ? 0.62
          : 0
      : metric(
          setupLinkage(
            beat,
            priorBeats,
          ) * 0.7 +
            0.3,
        );

  const meaningTransition =
    index === 0
      ? 0.45
      : hasMeaningTransition(
          beat,
          priorTexts,
        );

  const escalation =
    escalationValue(
      beat,
      index,
      total,
    );

  const setup =
    setupLinkage(
      beat,
      priorBeats,
    );

  const payoff =
    payoffLinkage(
      beat,
      priorBeats,
    );

  const finality =
    index === total - 1
      ? finalityValue(beat)
      : 0.05;

  const reasons: string[] = [];

  if (
    index > 0 &&
    meaningTransition < 0.3
  ) {
    reasons.push(
      "weak-meaning-transition",
    );
  }

  if (
    index > 0 &&
    setup < 0.12 &&
    !beat.frontier &&
    !beat.next
  ) {
    reasons.push(
      "weak-setup-continuity",
    );
  }

  if (
    index > 1 &&
    escalation < 0.28
  ) {
    reasons.push(
      "weak-escalation",
    );
  }

  if (
    index === total - 1 &&
    payoff < 0.18 &&
    finality < 0.5
  ) {
    reasons.push(
      "weak-final-payoff",
    );
  }

  const score = metric(
    establishment * 0.16 +
      meaningTransition * 0.24 +
      escalation * 0.14 +
      setup * 0.16 +
      payoff * 0.18 +
      finality * 0.12,
  );

  return {
    order: beat.order,
    establishment,
    meaningTransition,
    escalation,
    setupLinkage: setup,
    payoffLinkage: payoff,
    finality,
    score,
    reasons,
  };
}

export function evaluateSequenceArc(
  beats: SequenceArcBeat[],
): SequenceArcEdit {
  if (!beats.length) {
    return {
      accepted: false,
      sequenceScore: 0,
      establishment: 0,
      meaningTransition: 0,
      escalation: 0,
      payoffLinkage: 0,
      finalTransformation: 0,
      beats: [],
      weakBeats: [],
      failures: [
        "empty-sequence",
      ],
    };
  }

  const ordered = [...beats]
    .sort(
      (a, b) =>
        a.order - b.order,
    );

  const scores: SequenceArcScore[] = [];
  const priorBeats: SequenceArcBeat[] = [];
  const priorTexts: string[] = [];

  for (let index = 0; index < ordered.length; index += 1) {
    const beat = ordered[index];

    const score = scoreBeat(
      beat,
      priorBeats,
      priorTexts,
      index,
      ordered.length,
    );

    scores.push(score);
    priorBeats.push(beat);

    if (clean(beat.text)) {
      priorTexts.push(
        beat.text,
      );
    }
  }

  const first = scores[0];
  const last =
    scores[scores.length - 1];

  const middle = scores.slice(
    1,
    Math.max(
      1,
      scores.length - 1,
    ),
  );

  const meaningTransition =
    middle.length
      ? metric(
          middle.reduce(
            (sum, beat) =>
              sum +
              beat.meaningTransition,
            0,
          ) /
            middle.length,
        )
      : first?.meaningTransition ??
        0;

  const escalation =
    middle.length
      ? metric(
          Math.max(
            ...middle.map(
              (beat) =>
                beat.escalation,
            ),
          ),
        )
      : 0;

  const payoffCandidates =
    scores.filter(
      (beat) =>
        beat.payoffLinkage >=
        0.18,
    );

  const payoffLinkage =
    payoffCandidates.length
      ? metric(
          Math.max(
            ...payoffCandidates.map(
              (beat) =>
                beat.payoffLinkage,
            ),
          ),
        )
      : 0;

  const establishment =
    first?.establishment ?? 0;

  const finalTransformation =
    last
      ? metric(
          last.finality * 0.55 +
            last.payoffLinkage * 0.45,
        )
      : 0;

  const sequenceScore = metric(
    establishment * 0.18 +
      meaningTransition * 0.27 +
      escalation * 0.15 +
      payoffLinkage * 0.2 +
      finalTransformation * 0.2,
  );

  const failures: string[] = [];

  if (
    ordered.length >= 2 &&
    establishment < 0.55
  ) {
    failures.push(
      "weak-establishment",
    );
  }

  if (
    ordered.length >= 3 &&
    meaningTransition < 0.4
  ) {
    failures.push(
      "weak-sequence-meaning-transition",
    );
  }

  if (
    ordered.length >= 3 &&
    escalation < 0.3
  ) {
    failures.push(
      "weak-sequence-escalation",
    );
  }

  if (
    ordered.length >= 3 &&
    payoffLinkage < 0.2
  ) {
    failures.push(
      "weak-payoff-linkage",
    );
  }

  if (
    finalTransformation < 0.42
  ) {
    failures.push(
      "weak-final-transformation",
    );
  }

  if (
    sequenceScore < 0.62
  ) {
    failures.push(
      "weak-sequence-score",
    );
  }

  const weakBeats = scores
    .filter(
      (beat) =>
        beat.reasons.length > 0,
    )
    .map(
      (beat) => beat.order,
    );

  return {
    accepted:
      failures.length === 0 &&
      weakBeats.length === 0,

    sequenceScore,
    establishment,
    meaningTransition,
    escalation,
    payoffLinkage,
    finalTransformation,
    beats: scores,
    weakBeats,
    failures,
  };
}