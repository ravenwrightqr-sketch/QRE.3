/**
 * QRE AUTHOR CUT POLICY · CANONICAL
 *
 * One sequence cut is one short viewer-facing moment.
 * The policy protects truth, novelty, implication, attention density, and
 * compression without forcing creative language to reuse literal source words.
 *
 * Creative interpretation is allowed when:
 *   1. its meaning is recoverable from supplied reality,
 *   2. cognition supplies a valid character/frame relationship,
 *   3. it does not introduce a new concrete event.
 */

export type CutWorld = {
  prompt?: string;
  subject?: string;
  place?: string;
  identity?: readonly string[];
  facts?: readonly string[];
  moments?: readonly string[];
  memory?: readonly string[];
  trajectory?: readonly string[];
  presence?: readonly string[];
};

export type CutIntent = {
  role?: string;
  gainKind?: string;
  change?: string;
  next?: string;
  text?: string;
  subjectEstablished?: boolean;
  informationFrontier?: string;

  // Cognitive grounding for interpretive language.
  characterTraits?: readonly string[];
  characterContradictions?: readonly string[];
  characterStatusPosture?: string;
  characterFrames?: readonly string[];
};

export type CutPolicyResult = {
  accepted: boolean;
  reasons: string[];
  metrics: {
    wordCount: number;
    groundedTokenRatio: number;
    novelty: number;
    implication: number;
    explanation: number;
    questionLeak: number;
    inventionRisk: number;
    repetition: number;
    compression: number;
    subjectReferenceCost: number;
    frontierValue: number;
    semanticDensity: number;
    factRestatement: number;
  };
};
const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));
const META =
  /\b(?:qre|prompt|compiler|cognition|metadata|language model|writing process|attention strategy|operator mix|beat plan)\b/i;

const CAMERA =
  /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see|fade to)\b/i;

const GENERIC =
  /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|luxury experience|perfect day|special moment|living world|emotional journey|positive transformation)\b/i;

const LITERAL_QUESTION = /\?/;

const PROVIDER =
  /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;

const PHYSICAL_ACTION =
  /\b(?:trembles?|shakes?|leaps?|jumps?|hides?|cries?|smiles?|wags?|runs?|grabs?|throws?|places?|removes?|approaches?|walks?|laughs?|chews?|licks?|bites?|drops?|pulls?|picks?|breaks?|shatters?|slams?|flies?|spills?|clinks?|cracks?)\b/i;

const EXPLANATION =
  /\b(?:because|therefore|which means|this means|so that|in other words|the reason|now understands|symbolizes?|represents?|shows that|learns that|proving that)\b/i;

const DIRECT_ADDRESS = /\b(?:you|your|viewer|audience)\b/i;

const FUTURE_CLAIM =
  /\b(?:from now on|will always|will never|forever|ever again|in the future)\b/i;

const GENERIC_EMOTION =
  /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;

const SUBJECT_REFERENCE =
  /\b(?:he|she|they|it|him|her|them|his|her|their|its)\b/i;

const STATUS_METAPHOR =
  /\b(?:lawyer|ceo|boss|diva|celebrity|negotiator|negotiation|negotiate|case|trial|court|verdict|crime|criminal|suspect|evidence|trophy|queen|king|royalty|hostage|rebel|rebellion|legend|star|promotion|resignation|contract|deal|terms|undefeated|in charge|calling the shots|made the rules|won|victory|victorious)\b/i;

const CHARACTER_INTERPRETATION =
  /\b(?:ready to|here to|not having it|not impressed|on a mission|taking no prisoners|calling the shots|in charge|running the show|made the rules|means business|came to negotiate|came to win|case closed|not backing down|hard bargain|little rebel|tiny rebel|diva|boss|lawyer|negotiat(?:e|ion|or)|undefeated|victory|victorious|mini[- ]?rebel)\b/i;

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten new more".split(
    /\s+/,
  ),
);

const IRREGULAR = new Map([
  ["knives", "knife"],
  ["leaves", "leaf"],
  ["wives", "wife"],
  ["lives", "life"],
  ["puppies", "puppy"],
  ["stories", "story"],
]);

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function normalizeWord(word: string): string {
  const lower = word.toLowerCase();

  if (IRREGULAR.has(lower)) return IRREGULAR.get(lower)!;
  if (lower.length > 5 && lower.endsWith("ies")) {
    return `${lower.slice(0, -3)}y`;
  }
  if (lower.length > 5 && lower.endsWith("ing")) {
    return lower.slice(0, -3);
  }
  if (lower.length > 4 && lower.endsWith("ed")) {
    return lower.slice(0, -2);
  }
  if (lower.length > 4 && lower.endsWith("es")) {
    return lower.slice(0, -2);
  }
  if (lower.length > 4 && lower.endsWith("s")) {
    return lower.slice(0, -1);
  }

  return lower;
}

function sourceText(world: CutWorld): string[] {
  return [
    world.prompt,
    world.subject,
    world.place,
    ...(world.identity ?? []),
    ...(world.facts ?? []),
    ...(world.moments ?? []),
    ...(world.memory ?? []),
    ...(world.trajectory ?? []),
    ...(world.presence ?? []),
  ]
    .map(clean)
    .filter(Boolean);
}

function contentWords(text: string): string[] {
  return clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 3 && !STOP.has(word))
    .map(normalizeWord);
}
function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (!a.size || !b.size) {
    return 0;
  }

  let hits = 0;

  for (const word of a) {
    if (b.has(word)) {
      hits += 1;
    }
  }

  return hits / Math.max(1, a.size);
}
function groundedTokenRatio(text: string, world: CutWorld): number {
  const words = contentWords(text);
  if (!words.length) return 1;

  const sources = sourceText(world).map((item) => contentWords(item));
  const grounded = words.filter((word) =>
    sources.some((source) => source.includes(word)),
  );

  return grounded.length / words.length;
}

function noveltyScore(text: string, priorCuts: readonly string[]): number {
  if (!priorCuts.length) return 1;

  const current = new Set(contentWords(text));
  const prior = new Set(priorCuts.flatMap(contentWords));

  if (!current.size) return 0;

  const fresh = [...current].filter((word) => !prior.has(word)).length;
  return fresh / current.size;
}

function implicationScore(text: string): number {
  const words = contentWords(text);
  if (!words.length) return 0;

  let score = 0.2;

  if (words.length <= 7) score += 0.25;

  if (
    /\b(?:again|already|still|yet|apparently|finally|only|just|even|back|then)\b/i.test(
      text,
    )
  ) {
    score += 0.2;
  }

  if (
    /\b(?:no|yes|mine|ours|same|different|except|until|before|after)\b/i.test(
      text,
    )
  ) {
    score += 0.15;
  }

  if (!EXPLANATION.test(text)) score += 0.2;

  return Math.min(1, score);
}

function explanationScore(text: string): number {
  let score = 0;

  if (EXPLANATION.test(text)) score += 0.5;
  if (text.split(/\s+/).length > 8) score += 0.2;

  if (
    /\b(?:the|this|that)\b.*\b(?:because|means|shows|represents?)\b/i.test(
      text,
    )
  ) {
    score += 0.2;
  }

  if (DIRECT_ADDRESS.test(text)) score += 0.1;

  return Math.min(1, score);
}

function inventionRisk(text: string, world: CutWorld): number {
  const worldTextValue = sourceText(world).join(" ");
  let risk = 0;

  if (PHYSICAL_ACTION.test(text) && !PHYSICAL_ACTION.test(worldTextValue)) {
    risk += 0.35;
  }

  if (PROVIDER.test(text) && !PROVIDER.test(worldTextValue)) {
    risk += 0.25;
  }

  if (FUTURE_CLAIM.test(text)) {
    risk += 0.3;
  }

  return Math.min(1, risk);
}

function repetitionScore(text: string, priorCuts: readonly string[]): number {
  if (!priorCuts.length) return 0;

  const current = new Set(contentWords(text));
  const prior = new Set(priorCuts.flatMap(contentWords));

  if (!current.size) return 1;

  const repeated = [...current].filter((word) => prior.has(word)).length;
  return repeated / current.size;
}

function compressionScore(text: string): number {
  const words = clean(text)
    .split(/\s+/)
    .filter(Boolean).length;

  if (words <= 2) return 1;
  if (words <= 4) return 0.98;
  if (words <= 6) return 0.94;
  if (words === 7) return 0.9;

  return 0;
}

function semanticDensity(text: string): number {
  const raw = clean(text);
  const words = contentWords(raw);

  if (!words.length) return 0;

  let value = 0.2;

  if (words.length >= 2) value += 0.2;
  if (words.length >= 4) value += 0.15;
  if (PHYSICAL_ACTION.test(raw)) value += 0.15;

  if (
    /\b(?:again|already|still|yet|only|even|back|different|same|but|except|until|before|after)\b/i.test(
      raw,
    )
  ) {
    value += 0.15;
  }

  if (GENERIC_EMOTION.test(raw)) value -= 0.05;

  return Math.max(0, Math.min(1, value));
}

function factRestatement(text: string, world: CutWorld): number {
  const normalized = contentWords(text).join(" ");
  if (!normalized) return 1;

  const known = sourceText(world).map((item) =>
    contentWords(item).join(" "),
  );

  return known.includes(normalized) ? 1 : 0;
}

function subjectReferenceCost(
  text: string,
  world: CutWorld,
  priorCuts: readonly string[],
  subjectEstablished: boolean,
): number {
  const subject = clean(world.subject);
  if (!subject || !subjectEstablished) return 0;

  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicit = new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const pronoun = SUBJECT_REFERENCE.test(text);

  if (
    explicit &&
    priorCuts.some((cut) => new RegExp(`\\b${escaped}\\b`, "i").test(cut))
  ) {
    return 0.55;
  }

  if (explicit) return 0.2;
  if (pronoun) return 0.05;

  return 0;
}

function frontierValue(
  text: string,
  intent: CutIntent,
  priorCuts: readonly string[],
): number {
  const frontier = clean(intent.informationFrontier);
  if (!frontier) return 0.2;

  const candidate = new Set(contentWords(text));
  const frontierWords = new Set(contentWords(frontier));
  const hits = [...candidate].filter((word) => frontierWords.has(word)).length;

  return Math.min(
    1,
    (hits / Math.max(1, frontierWords.size)) * 0.55 +
      noveltyScore(text, priorCuts) * 0.45,
  );
}

function characterGroundingSignal(intent: CutIntent): string {
  return [
    ...(intent.characterTraits ?? []),
    ...(intent.characterContradictions ?? []),
    intent.characterStatusPosture ?? "",
    ...(intent.characterFrames ?? []),
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function groundedCharacterInterpretation(
  text: string,
  intent: CutIntent,
): boolean {
  const signal = characterGroundingSignal(intent);
  if (!signal) return false;

  const candidate = text.toLowerCase();

  const interpretiveVocabulary =
    /\b(?:rebel|rebellion|rebelled|defiant|defiance|resist|resistance|negotiate|negotiation|negotiator|lawyer|boss|ceo|diva|queen|king|royalty|terms|deal|contract|case|evidence|operation|mission|status|power|upper hand|called the shots|in charge|guarded|attitude|vulnerable|personality|mini[- ]?rebel|tiny rebel)\b/i;

  const cognitiveAnchor =
    /\b(?:rebel|rebellion|defian|resistan|negotiat|status|power|operation|mission|guarded|attitude|vulnerab|routine|personality|character)\b/i;

  return interpretiveVocabulary.test(candidate) && cognitiveAnchor.test(signal);
}

export function evaluateCut(
  textInput: string,
  world: CutWorld,
  intent: CutIntent = {},
  priorCuts: readonly string[] = [],
): CutPolicyResult {
  const text = clean(textInput);
  const reasons: string[] = [];

  const wordCount =
    text
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const evidence =
    sourceText(world);

  const sourceRich =
    evidence.join(" ");

  const grounded =
    groundedTokenRatio(
      text,
      world,
    );

  const novelty =
    noveltyScore(
      text,
      priorCuts,
    );

  const implication =
    implicationScore(
      text,
    );

  const explanation =
    explanationScore(
      text,
    );

  const questionLeak =
    LITERAL_QUESTION.test(text) &&
    !evidence.some(
      (item) =>
        clean(item).toLowerCase() ===
        text.toLowerCase(),
    )
      ? 1
      : 0;

  const invention =
    inventionRisk(
      text,
      world,
    );

  const repetition =
    repetitionScore(
      text,
      priorCuts,
    );

  const compression =
    compressionScore(
      text,
    );

  const referenceCost =
    subjectReferenceCost(
      text,
      world,
      priorCuts,
      Boolean(
        intent.subjectEstablished,
      ),
    );

  const frontier =
    frontierValue(
      text,
      intent,
      priorCuts,
    );

  const density =
    semanticDensity(
      text,
    );

  const restatement =
    factRestatement(
      text,
      world,
    );

  const role =
    clean(
      intent.role,
    ).toLowerCase();

  const gainKind =
    clean(
      intent.gainKind,
    ).toLowerCase();

  const change =
    clean(
      intent.change,
    );

  const next =
    clean(
      intent.next,
    );

  const frontierText =
    clean(
      intent.informationFrontier,
    );

  const cognitiveSignals = [
    ...(intent.characterTraits ?? []),
    ...(intent.characterContradictions ?? []),
    intent.characterStatusPosture ?? "",
    ...(intent.characterFrames ?? []),
  ]
    .map(clean)
    .filter(Boolean);

  const cognitiveSignalText =
    cognitiveSignals.join(" ");

  /*
   * ---------------------------------------------------------------
   * UNIVERSAL SEMANTIC GROUNDING
   * ---------------------------------------------------------------
   *
   * A creative interpretation is legal when its language is grounded
   * in one or more approved semantic surfaces:
   *
   *   reality evidence
   *   approved beat change
   *   approved next/frontier
   *   character/frame cognition
   *
   * This replaces domain-specific phrase matching.
   */

  const textWords =
    new Set(
      contentWords(text),
    );

  const semanticSources = [
    ...evidence,
    change,
    next,
    frontierText,
    cognitiveSignalText,
  ]
    .map(clean)
    .filter(Boolean);

  const semanticSourceWords =
    new Set(
      semanticSources.flatMap(
        contentWords,
      ),
    );

  let semanticAnchorHits = 0;

  for (
    const word of textWords
  ) {
    if (
      semanticSourceWords.has(word)
    ) {
      semanticAnchorHits += 1;
    }
  }

  const semanticAnchorRatio =
    textWords.size
      ? semanticAnchorHits /
        textWords.size
      : 0;

  const changeSimilarity =
    change
      ? metric(
          groundedTokenRatio(
            text,
            {
              ...world,
              facts: [
                ...(world.facts ?? []),
                change,
              ],
            },
          ),
        )
      : 0;

  const nextSimilarity =
    next
      ? metric(
          groundedTokenRatio(
            text,
            {
              ...world,
              facts: [
                ...(world.facts ?? []),
                next,
              ],
            },
          ),
        )
      : 0;

  const frontierSimilarity =
    frontierText
      ? metric(
          groundedTokenRatio(
            text,
            {
              ...world,
              facts: [
                ...(world.facts ?? []),
                frontierText,
              ],
            },
          ),
        )
      : 0;

  const cognitiveGrounding =
    cognitiveSignalText
      ? metric(
          groundedTokenRatio(
            text,
            {
              ...world,
              facts: [
                ...(world.facts ?? []),
                cognitiveSignalText,
              ],
            },
          ),
        )
      : 0;

  const semanticGrounding =
    metric(
      semanticAnchorRatio *
        0.35 +
        changeSimilarity *
        0.3 +
        Math.max(
          nextSimilarity,
          frontierSimilarity,
        ) *
        0.2 +
        cognitiveGrounding *
        0.15,
    );

  const interpretiveLanguage =
    STATUS_METAPHOR.test(
      text,
    ) ||
    CHARACTER_INTERPRETATION.test(
      text,
    );

  const groundedInterpretation =
    interpretiveLanguage &&
    (
      semanticGrounding >=
        0.18 ||
      cognitiveGrounding >=
        0.2
    );

  /*
   * ---------------------------------------------------------------
   * INTENT-AWARE FACT RESTATEMENT
   * ---------------------------------------------------------------
   *
   * Restating a fact is not automatically bad.
   *
   * Arrival / establishment / new-fact beats may legitimately say
   * the thing that establishes the story.
   *
   * A later beat repeating the same fact without new semantic value
   * is what we reject.
   */

  const establishmentRole =
    [
      "arrival",
      "hook",
      "question",
      "discovery",
    ].includes(role);

  const explicitBeatChange =
    change &&
    metric(
      overlap(
        new Set(
          contentWords(text),
        ),
        new Set(
          contentWords(change),
        ),
      ),
    ) >= 0.4;

  const legitimateRestatement =
    restatement >= 0.9 &&
    (
      establishmentRole ||
      explicitBeatChange ||
      gainKind === "new_fact" ||
      gainKind === "discovery"
    ) &&
    priorCuts.length === 0;

  /*
   * ---------------------------------------------------------------
   * INTERPRETATION FLOOR
   * ---------------------------------------------------------------
   */

  const interpretationAllowed =
    !PHYSICAL_ACTION.test(
      text,
    ) &&
    groundedInterpretation;

  const groundingFloor =
    interpretationAllowed
      ? 0
      : semanticGrounding >= 0.42
        ? 0
        : 0.1;

  /*
   * ---------------------------------------------------------------
   * SCORE REASONS
   * ---------------------------------------------------------------
   */

  if (!text) {
    reasons.push(
      "empty",
    );
  }

  if (wordCount > 7) {
    reasons.push(
      "too-long",
    );
  }

  if (META.test(text)) {
    reasons.push(
      "meta-language",
    );
  }

  if (CAMERA.test(text)) {
    reasons.push(
      "camera-language",
    );
  }

  if (GENERIC.test(text)) {
    reasons.push(
      "generic-prose",
    );
  }

  if (questionLeak) {
    reasons.push(
      "question-leak",
    );
  }

  /*
   * Concrete unsupported action remains a real boundary.
   */
  if (
    invention >= 0.6 &&
    !groundedInterpretation
  ) {
    reasons.push(
      "invention-risk",
    );
  }

  if (
    explanation >= 0.75
  ) {
    reasons.push(
      "explanation-heavy",
    );
  }

  /*
   * Grounding now considers approved beat semantics,
   * not just literal source vocabulary.
   */
  if (
    grounded <
      groundingFloor &&
    wordCount > 2 &&
    !groundedInterpretation
  ) {
    reasons.push(
      "weak-grounding",
    );
  }

  /*
   * Repetition is only fatal when the later beat provides
   * no approved semantic advancement.
   */
  if (
    repetition >= 0.92 &&
    priorCuts.length &&
    !groundedInterpretation &&
    frontier < 0.3
  ) {
    reasons.push(
      "repetition",
    );
  }

  if (
    referenceCost >= 0.5 &&
    explanation >= 0.6 &&
    novelty < 0.35
  ) {
    reasons.push(
      "wasted-subject-reference",
    );
  }

  if (
    wordCount === 1 &&
    density < 0.5
  ) {
    reasons.push(
      "subject-or-label-only",
    );
  }

  /*
   * A source phrase may be a legitimate realization of the
   * currently approved beat. Do not reject it automatically.
   */
  if (
    restatement >= 0.9 &&
    !legitimateRestatement &&
    !groundedInterpretation &&
    priorCuts.length
  ) {
    reasons.push(
      "known-fact-restatement",
    );
  }

  if (
    density < 0.2 &&
    wordCount <= 3 &&
    !groundedInterpretation
  ) {
    reasons.push(
      "low-semantic-density",
    );
  }

  if (
    [
      "hook",
      "reframe",
      "callback",
    ].includes(role) &&
    compression < 0.85
  ) {
    reasons.push(
      "low-impact-density",
    );
  }

  if (
    gainKind === "question" &&
    questionLeak
  ) {
    reasons.push(
      "cognitive-question-in-mouth",
    );
  }

  /*
   * Frontier starvation should only fire when the beat's approved
   * semantic frontier actually exists.
   */
  if (
    frontierText &&
    frontier < 0.08 &&
    novelty < 0.15 &&
    wordCount > 2 &&
    !groundedInterpretation
  ) {
    reasons.push(
      "frontier-starvation",
    );
  }

  /*
   * ---------------------------------------------------------------
   * APPROVED SEMANTIC MOVEMENT
   * ---------------------------------------------------------------
   *
   * A line may be valuable even when its literal vocabulary is light,
   * provided it executes the approved change or frame.
   */
  const approvedMovement =
    metric(
      Math.max(
        changeSimilarity,
        cognitiveGrounding,
        frontierSimilarity,
        semanticAnchorRatio,
      ),
    );

  /*
   * A middle beat that executes its approved semantic change should
   * not be rejected merely because it doesn't repeat literal source
   * words.
   */
  if (
    priorCuts.length > 0 &&
    approvedMovement < 0.12 &&
    novelty < 0.08 &&
    !groundedInterpretation &&
    !explicitBeatChange
  ) {
    reasons.push(
      "no-semantic-advance",
    );
  }

  const accepted =
    reasons.length === 0;

  return {
    accepted,
    reasons,
    metrics: {
      wordCount,
      groundedTokenRatio:
        Number(
          grounded.toFixed(3),
        ),
      novelty:
        Number(
          novelty.toFixed(3),
        ),
      implication:
        Number(
          implication.toFixed(3),
        ),
      explanation:
        Number(
          explanation.toFixed(3),
        ),
      questionLeak,
      inventionRisk:
        Number(
          invention.toFixed(3),
        ),
      repetition:
        Number(
          repetition.toFixed(3),
        ),
      compression:
        Number(
          compression.toFixed(3),
        ),
      subjectReferenceCost:
        Number(
          referenceCost.toFixed(3),
        ),
      frontierValue:
        Number(
          frontier.toFixed(3),
        ),
      semanticDensity:
        Number(
          density.toFixed(3),
        ),
      factRestatement:
        Number(
          restatement.toFixed(3),
        ),
    },
  };
}