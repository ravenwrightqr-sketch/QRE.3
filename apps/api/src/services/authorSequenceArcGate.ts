/**
 * QRE SEQUENCE ARC / PAYOFF GATE · CANONICAL
 *
 * Deterministic sequence-level editorial gate over approved Beat Graph lines.
 * It evaluates accumulation, meaning transition, linkage, and finality without
 * inventing or assuming any domain-specific story vocabulary.
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

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten more"
    .split(/\s+/),
);

const TRANSITION =
  /\b(?:but|yet|still|instead|only|except|again|already|apparently|temporarily|after all|this time|once|now|then|after|finally|before)\b/i;

const RELATIONAL =
  /\b(?:reframe|recontextualize|contrast|callback|turn|change|shift|matter|means?|becomes?|became|makes?|made|leads?|follows?|reveals?|shows?)\b/i;

const GENERIC =
  /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|what a day|everything changed|the journey|new chapter|happy ending|a moment to remember|the magic begins|cinematic|meaningful experience)\b/i;

const COLLAGE =
  /\b[^.!?]{1,45},\s*[^.!?]{1,45}(?:,\s*[^.!?]{1,45})+\b/;

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

function tokenSet(
  text: string,
): Set<string> {
  return new Set(words(text));
}

function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (!a.size || !b.size) {
    return 0;
  }

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) {
      hits += 1;
    }
  }

  return hits / a.size;
}

function interpretiveLine(
  text: string,
): boolean {
  return (
    RELATIONAL.test(text) ||
    TRANSITION.test(text)
  );
}

function carryForward(
  current: string,
  prior: string[],
): number {
  if (!prior.length) {
    return 0.5;
  }

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
  const setup = tokenSet(
    (beat.setsUp ?? [])
      .map(clean)
      .filter(Boolean)
      .join(" "),
  );

  if (!setup.size) {
    return priorBeats.length
      ? 0.2
      : 0.5;
  }

  const priorPayload = priorBeats
    .flatMap((prior) => [
      ...(prior.paysOff ?? []),
      ...(prior.setsUp ?? []),
      clean(prior.text),
    ])
    .join(" ");

  return metric(
    overlap(
      setup,
      tokenSet(priorPayload),
    ),
  );
}

function payoffLinkage(
  beat: SequenceArcBeat,
  priorBeats: SequenceArcBeat[],
): number {
  const payoff = tokenSet(
    (beat.paysOff ?? [])
      .map(clean)
      .filter(Boolean)
      .join(" "),
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

  return metric(
    overlap(
      payoff,
      tokenSet(planted),
    ),
  );
}

function hasMeaningTransition(
  beat: SequenceArcBeat,
  priorTexts: string[],
): number {
  const text = clean(beat.text);

  if (!text) {
    return 0;
  }

  let score = 0.1;

  if (interpretiveLine(text)) {
    score += 0.3;
  }

  if (TRANSITION.test(text)) {
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

  if (COLLAGE.test(text)) {
    score -= 0.22;
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
    !GENERIC.test(beat.text) &&
    !COLLAGE.test(beat.text)
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

  const setup = setupLinkage(
    beat,
    priorBeats,
  );

  const payoff = payoffLinkage(
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

  if (COLLAGE.test(beat.text)) {
    reasons.push(
      "anchor-collage",
    );
  }

  if (GENERIC.test(beat.text)) {
    reasons.push(
      "generic-summary",
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

  const ordered = [...beats].sort(
    (a, b) => a.order - b.order,
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
    Math.max(1, scores.length - 1),
  );

  const meaningTransition = middle.length
    ? metric(
        middle.reduce(
          (sum, beat) =>
            sum +
            beat.meaningTransition,
          0,
        ) / middle.length,
      )
    : first?.meaningTransition ?? 0;

  const escalation = middle.length
    ? metric(
        Math.max(
          ...middle.map(
            (beat) => beat.escalation,
          ),
        ),
      )
    : 0;

  const payoffCandidates =
    scores.filter(
      (beat) =>
        beat.payoffLinkage >= 0.18,
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

  const finalTransformation = last
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
      (beat) => beat.reasons.length > 0,
    )
    .map((beat) => beat.order);

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
