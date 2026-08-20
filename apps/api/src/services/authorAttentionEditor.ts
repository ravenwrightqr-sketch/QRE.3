/**
 * QRE ATTENTION EDITOR · CANONICAL
 *
 * Deterministic editorial layer over an already-discovered Beat Graph and
 * already-realized mouth lines.
 *
 * It never creates facts. It measures whether the mouth line executes the
 * approved beat, preserves grounding, creates movement, accumulates meaning,
 * and remains usable by the final cut policy.
 *
 * Semantic vocabulary is intentionally separated:
 *
 *   CHARACTER_SIGNAL
 *     supplied character/state language
 *
 *   STATUS_INTERPRETATION
 *     creative status/frame language
 *
 *   RELATIONAL_INTERPRETATION
 *     language that expresses a change in relationship or meaning
 *
 *   GENERIC_EMOTION
 *     ordinary emotional vocabulary that is not inherently interpretive
 *
 * This prevents ordinary facts such as "nervous", "fierce", or "fabulous"
 * from being mistaken for creative interpretation merely because they are
 * character-relevant.
 */

export type AttentionBeatInput = {
  order: number;
  role?: string;
  gainKind?: string;
  text: string;
  change?: string;
  next?: string;
  frontier?: string;
  sourceIds?: string[];
  attentionFunction?: string;
  setsUp?: string[];
  paysOff?: string[];
  creativeMove?: string;
  nextBeatPullTarget?: number;
};

export type AttentionBeatScore = {
  order: number;
  factuality: number;
  specificity: number;
  attention: number;
  novelty: number;
  statusChange: number;
  nextBeatPull: number;
  creativeMove: number;
  repetition: number;
  cinematicity: number;
  payoffContribution: number;
  setupValue: number;
  inventionRisk: number;
  mouthUsability: number;
  beatExecution: number;
  sourceCoverage: number;
  interpretationGrounding: number;
  sequenceCohesion: number;
  cumulativeMeaning: number;
  score: number;
  keep: boolean;
  reasons: string[];
};

export type AttentionEdit = {
  accepted: boolean;
  sequenceScore: number;
  beats: AttentionBeatScore[];
  weakBeats: number[];
  rewriteNeeded: boolean;
  rewriteInstructions: string[];
};

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten more"
    .split(/\s+/),
);

const GENERIC =
  /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|what a day|everything changed|the journey|new chapter|happy ending|so fabulous|poodle power|good girl|bathhouse|battle|fight|ritual of transformation|mere formality|victory in grooming|turns glory)\b/i;

const PROCESS =
  /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|realization|attention editor|information seeking|next beat|writing process|movie plan|dramatic job|creative move)\b/i;

const EXPLANATION =
  /\b(?:because|therefore|which means|this means|the reason|shows that|represents?|symbolizes?|in other words|in this context|was a cover for|reveals? that|the final revelation|the supplied .* reading|comedy of character contrasts)\b/i;

const META_VIEWER =
  /\b(?:the viewer|the audience|viewer sees|audience sees)\b/i;

const LABEL_LIKE =
  /^(?:the contrast|the unexpected|the transformation|the mystery|the payoff|the reframe|the reveal|the twist|the journey|the answer|the joke|the punchline)$/i;

/**
 * Ordinary supplied character/state language.
 *
 * These words describe the subject. They are NOT, by themselves,
 * evidence of creative interpretation.
 */
const CHARACTER_SIGNAL =
  /\b(?:nervous|fierce|fabulous|cool|guarded|defiant|attitude|vulnerable|uneasy|calm|proud|furious|anxious)\b/i;

/**
 * Explicit status/frame interpretation.
 *
 * These terms can turn supplied reality into a different social or dramatic
 * frame without inventing a concrete event.
 */
const STATUS_INTERPRETATION =
  /\b(?:lawyer|boss|ceo|diva|celebrity|negotiat(?:e|ion|or)|rebel|rebellion|defiance|evidence|case|trial|court|verdict|terms|deal|contract|royalty|queen|king|status|in charge|mission|operation|suspect|legend|undefeated|called the shots|peace|protest|under protest|upper hand|power|victory|victorious|mini[- ]?rebel|tiny rebel|not impressed|means business)\b/i;

/**
 * Relationship / transition language.
 *
 * These words can indicate that a known thing has acquired changed meaning.
 */
const RELATIONAL_INTERPRETATION =
  /\b(?:but|yet|still|instead|only|except|again|already|apparently|temporarily|after all|this time|once|now)\b/i;

/**
 * Ordinary emotional vocabulary.
 *
 * Kept separate from interpretation so "nervous" does not automatically
 * receive creative/recontextualization credit.
 */
const GENERIC_EMOTION =
  /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;

const ACTION =
  /\b(?:walk(?:s|ed)?|run(?:s|ning|ran)?|jump(?:s|ed)?|leap(?:s|ed)?|grab(?:s|bed)?|steal(?:s|ing|stole)?|take(?:s|n|ing|took)?|put(?:s|ting)?|place(?:s|d)?|remove(?:s|d)?|pick(?:s|ed)?|throw(?:s|w|ing|ew)?|break(?:s|ing|broke)?|tie(?:s|d|ing)?|pull(?:s|ed)?|push(?:es|ed)?|sit(?:s|ting|sat)?|stand(?:s|ing|stood)?|laugh(?:s|ed)?|cry(?:s|ing|cried)?|smile(?:s|d)?|wag(?:s|ged)?|bite(?:s|bit)?|lick(?:s|ed)?|chew(?:s|ed)?)\b/i;

const BODY_OR_REACTION =
  /\b(?:tail|tails|eye|eyes|ear|ears|mouth|tongue|paw|paws|head|heart|face|smile|smiles|cringe|cringes|fury|tears|wags?|winking|blinks?|blush(?:es|ed)?|shivers?|trembles?|gasps?|stares?)\b/i;

const COLLAGE_PUNCTUATION =
  /\b[^.!?]{1,40},\s*[^.!?]{1,40}(?:,\s*[^.!?]{1,40})+\b/;

const TRANSITION =
  /\b(?:first|then|after|now|still|only|finally|so|until|back|again|already|yet|instead|apparently|once|before)\b/i;

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

function set(text: string): Set<string> {
  return new Set(words(text));
}

function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (!a.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) hits += 1;
  }

  return hits / a.size;
}

function meaningfulInterpretation(
  text: string,
): boolean {
  return (
    STATUS_INTERPRETATION.test(text) ||
    RELATIONAL_INTERPRETATION.test(text)
  );
}

function factuality(
  text: string,
  evidence: string[],
): number {
  if (!text) return 0;

  const candidate = set(text);
  const source = set(evidence.join(" "));

  if (!candidate.size || !source.size) {
    return 0.1;
  }

  const literal = overlap(
    candidate,
    source,
  );

  const interpretive =
    meaningfulInterpretation(text) &&
    literal >= 0.16
      ? 0.28
      : 0;

  return metric(
    Math.max(
      literal,
      interpretive,
    ),
  );
}

function sourceCoverage(
  input: AttentionBeatInput,
  text: string,
  evidence: string[],
): number {
  const source = set(
    evidence.join(" "),
  );

  const line = set(text);

  const suppliedLabels = set(
    [
      ...(input.setsUp ?? []),
      ...(input.paysOff ?? []),
    ].join(" "),
  );

  const literal = overlap(
    line,
    source,
  );

  const label = suppliedLabels.size
    ? overlap(
        line,
        suppliedLabels,
      )
    : 0;

  const interpretive =
    meaningfulInterpretation(text) &&
    literal >= 0.16
      ? 0.3
      : 0;

  return metric(
    Math.max(
      literal * 0.65 +
        label * 0.35,
      interpretive,
    ),
  );
}

function interpretationGrounding(
  input: AttentionBeatInput,
  text: string,
): number {
  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  const labels = [
    ...(input.setsUp ?? []),
    ...(input.paysOff ?? []),
  ].filter(Boolean);

  const creative = clean(
    input.creativeMove,
  );

  if (
    !meaningfulInterpretation(text) ||
    !labels.length
  ) {
    return 0;
  }

  if (
    [
      "reframe",
      "turn",
      "callback",
      "payoff",
      "release",
      "escalation",
    ].includes(role)
  ) {
    return creative !== "none"
      ? 0.65
      : 0.48;
  }

  return creative !== "none"
    ? 0.48
    : 0.3;
}

function sequenceCohesion(
  input: AttentionBeatInput,
  text: string,
  prior: string[],
): number {
  if (!prior.length) return 0.5;

  let score = 0.12;

  const priorSet = set(
    prior.join(" "),
  );

  const currentSet = set(text);

  const shared = overlap(
    currentSet,
    priorSet,
  );

  if (shared > 0.08) {
    score += 0.2;
  }

  if (TRANSITION.test(text)) {
    score += 0.2;
  }

  if (
    meaningfulInterpretation(text) &&
    [
      ...(input.setsUp ?? []),
      ...(input.paysOff ?? []),
    ].length
  ) {
    score += 0.2;
  }

  if (
    [
      "turn",
      "reframe",
      "callback",
      "payoff",
      "release",
    ].includes(
      clean(
        input.attentionFunction ??
          input.role,
      ),
    )
  ) {
    score += 0.12;
  }

  if (
    LABEL_LIKE.test(text) ||
    GENERIC.test(text)
  ) {
    score -= 0.2;
  }

  if (shared > 0.82) {
    score -= 0.1;
  }

  return metric(score);
}

function cumulativeMeaning(
  input: AttentionBeatInput,
  text: string,
  priorTexts: string[],
): number {
  if (!priorTexts.length) return 0.5;

  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  const current = set(text);
  const prior = set(
    priorTexts.join(" "),
  );

  let score = 0.12;

  /*
   * Carryover is useful, but carryover alone is not a movie.
   */
  const carry = overlap(
    current,
    prior,
  );

  if (carry >= 0.08) {
    score += 0.16;
  }

  if (carry >= 0.18) {
    score += 0.1;
  }

  /*
   * A true status or relational move carries more meaning than a literal
   * repetition of the source fact.
   */
  if (meaningfulInterpretation(text)) {
    score += 0.18;
  }

  if (TRANSITION.test(text)) {
    score += 0.16;
  }

  /*
   * Planner-declared graph labels provide a semantic bridge between beats.
   */
  const graphLabels = set(
    [
      ...(input.setsUp ?? []),
      ...(input.paysOff ?? []),
    ].join(" "),
  );

  if (graphLabels.size) {
    const graphCarry = overlap(
      current,
      graphLabels,
    );

    if (graphCarry >= 0.15) {
      score += 0.14;
    }

    if (graphCarry >= 0.3) {
      score += 0.08;
    }
  }

  if (
    [
      "turn",
      "reframe",
      "escalation",
      "callback",
      "payoff",
      "release",
    ].includes(role)
  ) {
    score += 0.12;
  }

  /*
   * A later line that neither carries anything forward nor introduces an
   * interpretive/temporal relationship is probably restarting the story.
   */
  if (
    carry < 0.05 &&
    !meaningfulInterpretation(text) &&
    !TRANSITION.test(text)
  ) {
    score -= 0.2;
  }

  if (
    LABEL_LIKE.test(text) ||
    GENERIC.test(text)
  ) {
    score -= 0.2;
  }

  return metric(score);
}

function specificity(
  text: string,
): number {
  const count = words(text).length;

  let score =
    count >= 2
      ? 0.28
      : 0;

  if (count >= 4) {
    score += 0.16;
  }

  if (
    /\b(?:blue|bath|bow|box|kitchen|bathroom|time|minute|receipt|poodle|wedding|song|record|door|room|car|house)\b/i.test(
      text,
    )
  ) {
    score += 0.28;
  }

  /*
   * Character vocabulary is useful specificity but does not itself prove
   * interpretation.
   */
  if (CHARACTER_SIGNAL.test(text)) {
    score += 0.08;
  }

  if (
    meaningfulInterpretation(text)
  ) {
    score += 0.14;
  }

  if (LABEL_LIKE.test(text)) {
    score -= 0.3;
  }

  if (GENERIC.test(text)) {
    score -= 0.25;
  }

  return metric(score);
}

function novelty(
  text: string,
  prior: string[],
): number {
  if (!prior.length) return 1;

  const current = set(text);

  const previous = set(
    prior.join(" "),
  );

  if (!current.size) return 0;

  return metric(
    1 -
      overlap(
        current,
        previous,
      ),
  );
}

function repetition(
  text: string,
  prior: string[],
): number {
  if (!prior.length) return 0;

  return metric(
    overlap(
      set(text),
      set(prior.join(" ")),
    ),
  );
}

function statusChange(
  text: string,
): number {
  let score = 0.1;

  if (
    STATUS_INTERPRETATION.test(
      text,
    )
  ) {
    score += 0.42;
  }

  if (
    RELATIONAL_INTERPRETATION.test(
      text,
    )
  ) {
    score += 0.14;
  }

  if (
    /\b(?:fierce|defiant|guarded|power|control|in charge|under protest|negotiat|rebel|boss|lawyer|peace|terms|evidence|victory|upper hand)\b/i.test(
      text,
    )
  ) {
    score += 0.25;
  }

  if (
    /\b(?:but|yet|still|instead|apparently|temporarily|only|except|back|already)\b/i.test(
      text,
    )
  ) {
    score += 0.15;
  }

  return metric(score);
}

function creativeMove(
  text: string,
): number {
  let score = 0.12;

  if (
    STATUS_INTERPRETATION.test(
      text,
    )
  ) {
    score += 0.42;
  }

  if (
    RELATIONAL_INTERPRETATION.test(
      text,
    )
  ) {
    score += 0.14;
  }

  if (
    /\b(?:again|already|still|yet|only|just|then|back|except|until|before|after|temporarily|apparently|suddenly|instead|finally|now|once)\b/i.test(
      text,
    )
  ) {
    score += 0.14;
  }

  if (ACTION.test(text)) {
    score += 0.05;
  }

  if (
    !GENERIC.test(text) &&
    !PROCESS.test(text) &&
    !LABEL_LIKE.test(text) &&
    !COLLAGE_PUNCTUATION.test(text)
  ) {
    score += 0.12;
  }

  if (EXPLANATION.test(text)) {
    score -= 0.25;
  }

  return metric(score);
}

function nextBeatPull(
  text: string,
  nextText: string | undefined,
  nextFrontier: string | undefined,
  role: string | undefined,
  target: number | undefined,
): number {
  const current = set(text);
  const upcoming = set(
    clean(nextText),
  );
  const frontier = set(
    clean(nextFrontier),
  );

  let score = 0.05;

  if (clean(nextText)) {
    score += 0.14;
  }

  if (clean(nextFrontier)) {
    score += 0.12;
  }

  score +=
    overlap(
      upcoming,
      current,
    ) *
      0.18 +
    overlap(
      frontier,
      current,
    ) *
      0.26;

  if (
    /\b(?:why|what|who|how|will|can|does|did|where|which)\b/i.test(
      clean(nextText),
    )
  ) {
    score += 0.1;
  }

  if (
    TRANSITION.test(
      clean(nextText),
    )
  ) {
    score += 0.08;
  }

  if (
    [
      "hook",
      "question",
      "pressure",
      "escalation",
      "reframe",
    ].includes(clean(role))
  ) {
    score += 0.05;
  }

  if (
    /^(?:the unexpected|the unknown|hidden intentions|viewer interest|information seeking|event-\d+)$/i.test(
      clean(nextFrontier),
    )
  ) {
    score -= 0.35;
  }

  if (
    GENERIC.test(text) ||
    PROCESS.test(text) ||
    LABEL_LIKE.test(text)
  ) {
    score -= 0.2;
  }

  const plannerTarget =
    typeof target === "number"
      ? clamp01(target)
      : 0.5;

  score =
    score * 0.6 +
    plannerTarget * 0.2 +
    sequenceCohesion(
      {
        role,
        attentionFunction: role,
      } as AttentionBeatInput,
      text,
      [],
    ) *
      0.2;

  return metric(score);
}

function cinematicity(
  text: string,
): number {
  const count = words(text).length;

  let score =
    count >= 2 &&
    count <= 7
      ? 0.42
      : 0.08;

  if (
    STATUS_INTERPRETATION.test(
      text,
    )
  ) {
    score += 0.22;
  }

  if (
    RELATIONAL_INTERPRETATION.test(
      text,
    )
  ) {
    score += 0.08;
  }

  if (ACTION.test(text)) {
    score += 0.1;
  }

  if (
    GENERIC.test(text) ||
    PROCESS.test(text) ||
    LABEL_LIKE.test(text)
  ) {
    score -= 0.3;
  }

  if (EXPLANATION.test(text)) {
    score -= 0.18;
  }

  return metric(score);
}

function inventionRisk(
  text: string,
  evidence: string[],
): number {
  const source = evidence.join(" ");

  let score = 0;

  if (
    ACTION.test(text) &&
    !ACTION.test(source)
  ) {
    score += 0.35;
  }

  if (
    BODY_OR_REACTION.test(text) &&
    !BODY_OR_REACTION.test(source)
  ) {
    score += 0.28;
  }

  if (
    /\b(?:groomer|cleaner|worker|owner|customer|client|lawyer)\b/i.test(
      text,
    ) &&
    !/\b(?:groomer|cleaner|worker|owner|customer|client|lawyer)\b/i.test(
      source,
    )
  ) {
    score += 0.2;
  }

  if (
    /\b(?:will always|forever|ever again|from now on)\b/i.test(
      text,
    )
  ) {
    score += 0.3;
  }

  if (GENERIC.test(text)) {
    score += 0.1;
  }

  return metric(score);
}

function mouthUsability(
  text: string,
): number {
  const value = clean(text);

  if (!value) return 0;

  const count = words(value).length;

  let score =
    count <= 7
      ? 1
      : count === 8
        ? 0.45
        : count === 9
          ? 0.2
          : 0;

  if (value.includes("?")) {
    score -= 0.25;
  }

  if (EXPLANATION.test(value)) {
    score -= 0.3;
  }

  if (
    META_VIEWER.test(value) ||
    PROCESS.test(value)
  ) {
    score -= 0.4;
  }

  if (
    GENERIC.test(value) ||
    LABEL_LIKE.test(value)
  ) {
    score -= 0.35;
  }

  if (
    COLLAGE_PUNCTUATION.test(value)
  ) {
    score -= 0.28;
  }

  if (/\s[-–—]\s/.test(value)) {
    score -= 0.08;
  }

  return metric(score);
}

function setupValue(
  input: AttentionBeatInput,
  text: string,
): number {
  let score = 0.06;

  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  if (
    [
      "hook",
      "question",
      "pressure",
      "turn",
      "reframe",
      "escalation",
    ].includes(role)
  ) {
    score += 0.24;
  }

  if ((input.setsUp ?? []).length) {
    score += 0.2;
  }

  if (CHARACTER_SIGNAL.test(text)) {
    score += 0.08;
  }

  if (meaningfulInterpretation(text)) {
    score += 0.14;
  }

  if (
    /\b(?:why|what|who|how|will|can)\b/i.test(
      clean(input.next),
    )
  ) {
    score += 0.12;
  }

  return metric(score);
}
function exactApprovedPayoff(
  input: AttentionBeatInput,
  text: string,
): boolean {
  const actual = clean(text)
    .replace(/[.!?]+$/g, "")
    .toLowerCase();

  if (!actual) {
    return false;
  }

  const approved = (input.paysOff ?? [])
    .map(clean)
    .filter(Boolean)
    .map((value) =>
      value
        .replace(/[.!?]+$/g, "")
        .toLowerCase(),
    );

  return approved.some(
    (value) => value === actual,
  );
}

function endpointPayoffStrength(
  input: AttentionBeatInput,
  text: string,
  priorTexts: string[],
): number {
  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  const isPayoffRole = [
    "payoff",
    "release",
    "callback",
    "consequence",
  ].includes(role);

  const hasApprovedEndpoint =
    (input.paysOff ?? []).some(
      (value) => clean(value).length > 0,
    );

  if (
    !isPayoffRole &&
    !hasApprovedEndpoint
  ) {
    return 0;
  }

  let score = 0.08;

  if (hasApprovedEndpoint) {
    score += 0.2;
  }

  if (
    exactApprovedPayoff(
      input,
      text,
    )
  ) {
    /*
     * Exact supplied endpoint is sovereign.
     * It does not need to invent additional interpretation.
     */
    score += 0.58;
  }

  if (priorTexts.length) {
    const prior = set(
      priorTexts.join(" "),
    );
    const current = set(text);
    const carry = overlap(
      current,
      prior,
    );

    if (carry >= 0.05) {
      score += 0.08;
    }

    if (carry >= 0.12) {
      score += 0.06;
    }
  }

  if (
    meaningfulInterpretation(text)
  ) {
    score += 0.08;
  }

  if (
    TRANSITION.test(text)
  ) {
    score += 0.05;
  }

  if (
    input.change &&
    clean(input.change)
  ) {
    score += 0.05;
  }

  return metric(score);
}

function payoffContribution(
  input: AttentionBeatInput,
  text: string,
  prior: string[],
): number {
  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  let score = endpointPayoffStrength(
    input,
    text,
    prior,
  );

  if (
    [
      "payoff",
      "release",
      "callback",
      "consequence",
    ].includes(role)
  ) {
    score += 0.12;
  }

  if (
    (input.paysOff ?? []).length
  ) {
    score += 0.08;
  }

  if (
    prior.length &&
    overlap(
      set(text),
      set(prior.join(" ")),
    ) > 0.12
  ) {
    score += 0.08;
  }

  /*
   * Exact endpoint does not need additional interpretive language.
   * The supplied ending itself can be the payoff.
   */
  if (
    exactApprovedPayoff(
      input,
      text,
    )
  ) {
    score += 0.12;
  } else if (
    meaningfulInterpretation(text)
  ) {
    score += 0.08;
  }

  return metric(score);
}

function beatExecution(
  input: AttentionBeatInput,
  text: string,
): number {
  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  let score = 0.12;

  if (
    role === "hook" &&
    (input.setsUp ?? []).length
  ) {
    score += 0.28;
  }

  if (
    ["turn", "reframe"].includes(
      role,
    ) &&
    meaningfulInterpretation(text)
  ) {
    score += 0.32;
  }

  if (
    role === "escalation" &&
    (input.frontier || input.next)
  ) {
    score += 0.24;
  }

  if (
    role === "callback" &&
    (input.paysOff ?? []).length
  ) {
    score += 0.3;
  }

  if (
    ["payoff", "release"].includes(
      role,
    ) &&
    (input.paysOff ?? []).length
  ) {
    score += 0.3;
  }

  if (
    (input.creativeMove ?? "none") !==
    "none"
  ) {
    score += 0.12;
  }

  if (
    sourceCoverage(
      input,
      text,
      [
        ...(input.setsUp ?? []),
        ...(input.paysOff ?? []),
      ],
    ) >= 0.25
  ) {
    score += 0.12;
  }

  if (
    GENERIC.test(text) ||
    PROCESS.test(text) ||
    EXPLANATION.test(text)
  ) {
    score -= 0.25;
  }

  return metric(score);
}

export function scoreAttentionBeat(
  input: AttentionBeatInput,
  priorTexts: string[],
  evidence: string[],
): AttentionBeatScore {
  const text = clean(input.text);

  const interpretation =
    interpretationGrounding(
      input,
      text,
    );

  const factual = Math.max(
    factuality(
      text,
      evidence,
    ),
    interpretation * 0.5,
  );

  const coverage = Math.max(
    sourceCoverage(
      input,
      text,
      evidence,
    ),
    interpretation * 0.8,
  );

  const specific = specificity(text);
  const novel = novelty(
    text,
    priorTexts,
  );

  const status = statusChange(text);

  const creative =
    creativeMove(text);

  const pull = nextBeatPull(
    text,
    input.next,
    input.frontier,
    input.attentionFunction ??
      input.role,
    input.nextBeatPullTarget,
  );

  const repeated = repetition(
    text,
    priorTexts,
  );

  const cine = cinematicity(text);

  const payoff =
    payoffContribution(
      input,
      text,
      priorTexts,
    );

  const setup = setupValue(
    input,
    text,
  );

  const invention =
    inventionRisk(
      text,
      evidence,
    );

  const usability =
    mouthUsability(text);

  const execution =
    beatExecution(
      input,
      text,
    );

  const cohesion =
    sequenceCohesion(
      input,
      text,
      priorTexts,
    );

  const cumulative =
    cumulativeMeaning(
      input,
      text,
      priorTexts,
    );

  const attention = metric(
    specific * 0.12 +
      novel * 0.08 +
      status * 0.12 +
      creative * 0.12 +
      pull * 0.16 +
      cine * 0.07 +
      payoff * 0.08 +
      setup * 0.06 +
      execution * 0.07 +
      coverage * 0.07 +
      interpretation * 0.08 +
      cohesion * 0.04 +
      cumulative * 0.08 -
      repeated * 0.08,
  );

  const score = metric(
    factual * 0.17 +
      coverage * 0.11 +
      specific * 0.09 +
      attention * 0.2 +
      status * 0.08 +
      pull * 0.07 +
      creative * 0.07 +
      payoff * 0.05 +
      execution * 0.07 +
      usability * 0.07 +
      interpretation * 0.07 +
      cohesion * 0.06 +
      cumulative * 0.1 -
      invention * 0.24 -
      repeated * 0.04,
  );

  const reasons: string[] = [];

  const count =
    words(text).length;

  const role = clean(
    input.attentionFunction ??
      input.role,
  );

  const isInterpretiveBeat = [
    "turn",
    "reframe",
    "callback",
    "payoff",
    "release",
    "escalation",
  ].includes(role);

  if (!text) {
    reasons.push("missing-text");
  }

  if (count > 7) {
    reasons.push("too-long");
  }

  if (
    factual < 0.18 &&
    !interpretation
  ) {
    reasons.push(
      "weak-factual-anchor",
    );
  }

  if (specific < 0.34) {
    reasons.push(
      "weak-specificity",
    );
  }

  if (
    coverage < 0.12 &&
    !interpretation
  ) {
    reasons.push(
      "weak-source-coverage",
    );
  }

  if (
    creative < 0.4 &&
    (input.creativeMove ?? "none") !==
      "none"
  ) {
    reasons.push(
      "weak-creative-move",
    );
  }

  if (pull < 0.3) {
    reasons.push(
      "weak-next-beat-pull",
    );
  }

  if (repeated > 0.78) {
    reasons.push("repetitive");
  }

  if (invention > 0.4) {
    reasons.push(
      "high-invention-risk",
    );
  }

  if (GENERIC.test(text)) {
    reasons.push(
      "generic-language",
    );
  }

  if (PROCESS.test(text)) {
    reasons.push(
      "process-language",
    );
  }

  if (EXPLANATION.test(text)) {
    reasons.push(
      "explanatory-language",
    );
  }

  if (META_VIEWER.test(text)) {
    reasons.push(
      "viewer-language",
    );
  }

  if (LABEL_LIKE.test(text)) {
    reasons.push(
      "label-like",
    );
  }

  if (
    COLLAGE_PUNCTUATION.test(text)
  ) {
    reasons.push(
      "keyword-collage",
    );
  }

  if (
    BODY_OR_REACTION.test(text) &&
    !BODY_OR_REACTION.test(
      evidence.join(" "),
    )
  ) {
    reasons.push(
      "unsupported-body-or-reaction",
    );
  }

  if (usability < 0.55) {
    reasons.push(
      "mouth-unusable",
    );
  }

  if (execution < 0.38) {
    reasons.push(
      "beat-execution-weak",
    );
  }

  if (
    isInterpretiveBeat &&
    interpretation < 0.35
  ) {
    reasons.push(
      "weak-recontextualization-grounding",
    );
  }

  if (
    priorTexts.length > 0 &&
    cohesion < 0.3 &&
    role !== "hook"
  ) {
    reasons.push(
      "sequence-reset",
    );
  }

  const exactPayoff =
  exactApprovedPayoff(
    input,
    text,
  );

if (
  priorTexts.length > 0 &&
  cumulative < 0.28 &&
  role !== "hook" &&
  !exactPayoff
) {
  reasons.push(
    "weak-cumulative-meaning",
  );
}

  return {
    order: input.order,
    factuality: factual,
    specificity: specific,
    attention,
    novelty: novel,
    statusChange: status,
    nextBeatPull: pull,
    creativeMove: creative,
    repetition: repeated,
    cinematicity: cine,
    payoffContribution: payoff,
    setupValue: setup,
    inventionRisk: invention,
    mouthUsability: usability,
    beatExecution: execution,
    sourceCoverage: coverage,
    interpretationGrounding: interpretation,
    sequenceCohesion: cohesion,
    cumulativeMeaning: cumulative,
    score,
    keep:
      reasons.length === 0 &&
      score >= 0.56,
    reasons,
  };
}

export function editAttentionSequence(
  input: {
    beats: AttentionBeatInput[];
    evidence: string[];
  },
): AttentionEdit {
  const scores: AttentionBeatScore[] = [];
  const prior: string[] = [];

  for (const beat of input.beats) {
    const score = scoreAttentionBeat(
      beat,
      prior,
      input.evidence,
    );

    scores.push(score);

    if (beat.text.trim()) {
      prior.push(beat.text);
    }
  }

  if (scores.length >= 2) {
    const first = scores[0];
    const last =
      scores[scores.length - 1];

    if (
      first &&
      scores.some(
        (score) =>
          score.payoffContribution >=
          0.5,
      )
    ) {
      first.setupValue = metric(
        first.setupValue + 0.08,
      );
    }

   if (
  last &&
  last.payoffContribution < 0.34
) {
  const lastInput =
    input.beats.find(
      (beat) =>
        beat.order === last.order,
    );

  const exactPayoff =
    lastInput
      ? exactApprovedPayoff(
          lastInput,
          lastInput.text,
        )
      : false;

  if (!exactPayoff) {
    last.reasons.push(
      "weak-payoff",
    );

    last.keep = false;
  }
}
  }

  const weakBeats = scores
    .filter(
      (score) => !score.keep,
    )
    .map(
      (score) => score.order,
    );

  const sequenceScore = metric(
    scores.length
      ? scores.reduce(
          (sum, score) =>
            sum + score.score,
          0,
        ) / scores.length
      : 0,
  );

  const rewriteInstructions =
    [
      ...new Set(
        scores.flatMap(
          (score) =>
            score.reasons.map(
              (reason) =>
                `Beat ${score.order}: ${reason}`,
            ),
        ),
      ),
    ];

  return {
    accepted:
      scores.length > 0 &&
      weakBeats.length === 0 &&
      sequenceScore >= 0.6,

    sequenceScore,
    beats: scores,
    weakBeats,

    rewriteNeeded:
      scores.length === 0 ||
      weakBeats.length > 0 ||
      sequenceScore < 0.6,

    rewriteInstructions,
  };
}

export function buildAttentionRewritePrompt(
  edit: AttentionEdit,
): string {
  if (!edit.rewriteNeeded) {
    return "";
  }

  return [
    "QRE ATTENTION EDITOR · BOUNDED MOUTH REWRITE",
    `Sequence score: ${edit.sequenceScore}`,
    `Weak beats: ${edit.weakBeats.join(", ") || "none"}`,

    ...edit.rewriteInstructions,

    "Rewrite only the weak lines.",

    "Treat the sequence as one accumulating thought, not independent captions.",

    "Preserve meaningful carryover between adjacent lines. A later line should inherit and alter an earlier signal when the Beat Graph supports it.",

    "Preserve beat order and the approved Beat Graph.",

    "Preserve supplied facts and supplied character relationships.",

    "Do not invent a concrete event, prop, person, location, reaction, sound, body movement, or outcome.",

    "Do not turn a metaphorical frame into a literal event.",

    "Execute the assigned attentionFunction and creativeMove instead of naming or explaining them.",

    "Write natural human language, not a keyword collage or receipt fragment.",

    "Prefer one clean grammatical thought, or an intentionally sharp fragment with a clear implied relationship.",

    "Prefer 3-7 words; never exceed 7 words.",

    "Use an object, relationship, contrast, callback, or status implication already supported by the source.",

    "Temporal connectors such as first, then, after, now, still, only, and finally are valuable when the supplied sequence supports them.",

    "The final line must pay off the accumulation rather than restate the last fact.",

    "Never use analyst language, generic emotional summaries, or labels such as 'the contrast', 'the joke', 'the punchline', or 'the transformation'.",
  ].join("\n");
}