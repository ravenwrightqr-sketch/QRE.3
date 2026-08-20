/**
 * QRE AUTHOR MOUTH · CANONICAL CANDIDATE REALIZATION
 *
 * PRODUCTION STATUS:
 * - CANONICAL PRODUCTION SERVICE
 *
 * OWNER:
 * - AUTHOR / MOUTH
 *
 * UPSTREAM:
 * - authorMeaningSpine.ts
 * - authorMouthRealizationSlot.ts
 * - RealityEnvelope
 *
 * DOWNSTREAM:
 * - authorBrainUniversal.ts
 * - authorMouthSequenceBeamSearch.ts
 *
 * OWNS:
 * - per-beat language realization
 * - candidate normalization
 * - concrete-reality truth detection
 * - forbidden-move detection
 * - semantic candidate scoring
 * - candidate rejection diagnostics
 * - one bounded repair attempt per beat
 *
 * DOES NOT OWN:
 * - reality construction
 * - movie discovery
 * - meaning selection
 * - endpoint selection
 * - sequence planning
 * - beam selection
 *
 * CORE LAW:
 * - NEW LANGUAGE IS NOT NEW REALITY.
 * - CREATIVE FRAMING IS ALLOWED.
 * - UNSUPPORTED CONCRETE REALITY IS NOT.
 *
 * MODEL ROLE:
 * - supplies language only.
 *
 * QRE ROLE:
 * - owns truth, semantics, sequence, and final gating.
 */
import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

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

export type MouthCandidateModel = (
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>,
) => Promise<{ text: string }>;

const MAX_CANDIDATES = 8;
const MAX_REPAIRS_PER_BEAT = 1;

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten"
    .split(/\s+/),
);

const INTERPRETIVE = new Set([
  "apparently",
  "almost",
  "already",
  "again",
  "still",
  "only",
  "instead",
  "somehow",
  "perhaps",
  "maybe",
  "finally",
  "naturally",
  "clearly",
  "quietly",
  "barely",
  "exactly",
  "enough",
  "anyway",
  "temporary",
  "temporarily",
  "oddly",
  "fairly",
  "rather",
  "somewhat",
  "obviously",
  "definitely",
  "indeed",
]);

const META =
  /\b(?:beat|viewer|audience|strategy|planner|planning|cognition|realization|writing process|author brief|meaning spine|beat graph|sequence model|candidate pool|truth gate|attention editor)\b/i;

const GENERIC =
  /\b(?:beautiful|magical|unforgettable|incredible|journey|special|meaningful|cinematic|perfect day|new chapter|happy ending)\b/i;

const QUESTION = /\?/;

const OPERATION_LANGUAGE =
  /\b(?:contrast(?:s|ed)?|reframe|reframing|transformation|transforms?|highlight(?:s|ed)?|explains?|shows? the contrast|changes? the meaning|conclusion)\b/i;

const PLACEHOLDER =
  /^(?:\.\.\.|candidate[_\s-]?(?:one|two|three|four|five)|line[_\s-]?(?:one|two|three|four|five)|short line(?: one| two| three| four| five)?)$/i;

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

function unique(values: readonly unknown[]): string[] {
  return [
    ...new Set(
      values
        .map(clean)
        .filter(Boolean),
    ),
  ];
}

function tokens(text: string): string[] {
  return unique(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );
}

function stem(token: string): string {
  const value = token.toLowerCase();

  if (value.length > 6 && value.endsWith("ing")) {
    return value.slice(0, -3);
  }

  if (value.length > 5 && value.endsWith("ed")) {
    return value.slice(0, -2);
  }

  if (value.length > 5 && value.endsWith("es")) {
    return value.slice(0, -2);
  }

  if (value.length > 4 && value.endsWith("s")) {
    return value.slice(0, -1);
  }

  return value;
}

function setOf(text: string): Set<string> {
  return new Set(tokens(text).map(stem));
}

function overlap(
  left: Set<string>,
  right: Set<string>,
): number {
  if (!left.size || !right.size) return 0;

  let hits = 0;

  for (const token of left) {
    if (right.has(token)) {
      hits += 1;
    }
  }

  return hits / Math.max(1, left.size);
}

function similarity(
  left: string,
  right: string,
): number {
  return metric(
    overlap(
      setOf(left),
      setOf(right),
    ),
  );
}

function suppliedTerms(
  envelope: RealityEnvelope,
): Set<string> {
  return new Set(
    envelope.suppliedTerms.map(stem),
  );
}

function eventLabel(
  envelope: RealityEnvelope,
  id: string,
): string {
  return (
    envelope.events.find(
      (event) => event.id === id,
    )?.label ?? ""
  );
}

function supportedEventIds(
  text: string,
  envelope: RealityEnvelope,
): string[] {
  return envelope.events
    .filter(
      (event) =>
        similarity(text, event.label) >= 0.34,
    )
    .map((event) => event.id);
}

function supportedRelations(
  eventIds: readonly string[],
  envelope: RealityEnvelope,
): string[] {
  const ids = new Set(eventIds);

  return envelope.relations
    .filter(
      (relation) =>
        ids.has(relation.from) &&
        ids.has(relation.to),
    )
    .map(
      (relation) =>
        `${relation.from}->${relation.to}`,
    );
}

function isPayoffBeat(
  beat: MouthCandidateBeat,
): boolean {
  const mode = clean(
    beat.realizationMode,
  ).toLowerCase();

  const role = clean(
    beat.role,
  ).toLowerCase();

  const attention = clean(
    beat.attentionFunction,
  ).toLowerCase();

  /*
   * paysOff is NOT itself sufficient to make a beat terminal.
   *
   * Only an explicitly terminal semantic designation can make
   * this the payoff beat. The upstream Author owns that decision.
   */
  return (
    role === "payoff" ||
    attention === "payoff" ||
    mode === "payoff" ||
    mode === "payoff_compression" ||
    mode.includes("payoff")
  );
}

function endpointText(
  beat: MouthCandidateBeat,
): string {
  return unique(
    beat.paysOff ?? [],
  )[0] ?? "";
}

function endpointExactness(
  text: string,
  beat: MouthCandidateBeat,
): number {
  if (!isPayoffBeat(beat)) return 0;

  const actual = clean(text)
    .replace(/[.!?]+$/g, "")
    .toLowerCase();

  const expected = clean(
    endpointText(beat),
  )
    .replace(/[.!?]+$/g, "")
    .toLowerCase();

  return expected && actual === expected
    ? 1
    : 0;
}

/**
 * Unsupported vocabulary is NOT automatically invention.
 *
 * The Mouth may introduce:
 * - framing
 * - attitude
 * - implication
 * - status language
 * - rhetorical language
 * - genre flavor
 *
 * The Mouth may NOT introduce unsupported concrete reality.
 */
function concreteRisk(
  text: string,
  envelope: RealityEnvelope,
): number {
  const lower = clean(text).toLowerCase();
  const source = suppliedTerms(envelope);

  if (!lower) return 1;

  const concretePatterns: Array<{
    kind: string;
    pattern: RegExp;
    terminal?: boolean;
  }> = [
    {
      kind: "body",
      pattern:
        /\b(?:eyes?|tail|ears?|hands?|feet?|fingers?|shoulders?|face|mouth|head|legs?|paws?)\b/i,
    },
    {
      kind: "body-reaction",
      pattern:
        /\b(?:trembled|blinked|sighed|stared|shrugged|winked|flinched|wagged|smiled|cried|laughed|smirked|gasped)\b/i,
    },
    {
      kind: "physical-action",
      pattern:
        /\b(?:walked|ran|jumped|grabbed|threw|opened|closed|snatched|stalked|entered|picked|held|carried|touched|pulled|pushed|dragged|hugged|kissed)\b/i,
    },
    {
      kind: "sound",
      pattern:
        /\b(?:roar|roared|growl|growled|bark|barked|scream|screamed|whistle|whistled|buzz|buzzed|bang|banged|shouted|yelled)\b/i,
    },
    {
      kind: "person",
      pattern:
        /\b(?:someone|man|woman|stranger|lawyer|judge|handler|owner|employee|customer|person|friend|enemy|guest)\b/i,
    },
    {
      kind: "place",
      pattern:
        /\b(?:street|park|room|kitchen|salon|store|office|arena|courtroom|backstage|hotel|house|car|red carpet|restaurant|stage)\b/i,
    },
    {
      kind: "object",
      pattern:
        /\b(?:table|door|window|chair|phone|bag|leash|scissors|camera|weapon|ticket|box|microphone|car|dress|suit)\b/i,
    },
    {
      kind: "new-outcome",
      pattern:
        /\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived|celebrated|failed|succeeded)\b/i,
      terminal: true,
    },
    {
      kind: "new-chronology",
      pattern:
        /\b(?:later|earlier|tomorrow|yesterday|the next day|years later|weeks later|months later)\b/i,
      terminal: true,
    },
  ];

  for (const rule of concretePatterns) {
    const match =
      lower.match(rule.pattern)?.[0];

    if (!match) continue;

    if (rule.terminal) {
      return 1;
    }

    const words = tokens(match).map(stem);

    const unsupported = words.some(
      (word) => !source.has(word),
    );

    if (unsupported) {
      return 1;
    }
  }

  return 0;
}

function forbiddenRisk(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const lower = clean(text).toLowerCase();
  const source = suppliedTerms(envelope);
  const forbidden = unique(
    beat.forbiddenMoves ?? [],
  ).map((value) =>
    value.toLowerCase(),
  );

  let risk = 0;

  /*
   * IMPORTANT:
   *
   * forbiddenMoves are PROHIBITIONS, not automatic failures.
   *
   * Example:
   *   forbiddenMoves includes "planner vocabulary"
   *
   * That does NOT mean the candidate is guilty.
   * The candidate is guilty only if its actual text
   * contains planner vocabulary.
   */

  if (META.test(lower)) {
    risk = 1;
  }

  if (OPERATION_LANGUAGE.test(lower)) {
    risk = 1;
  }

  if (GENERIC.test(lower)) {
    risk = Math.max(risk, 0.8);
  }

  if (QUESTION.test(lower)) {
    risk = Math.max(risk, 0.7);
  }

  const concreteRules: Array<
    [string, RegExp]
  > = [
    [
      "new person",
      /\b(?:someone|man|woman|stranger|person)\b/i,
    ],
    [
      "new object",
      /\b(?:table|door|window|chair|phone|bag|leash|scissors)\b/i,
    ],
    [
      "new location",
      /\b(?:street|park|room|kitchen|salon|store|office|outside|inside)\b/i,
    ],
    [
      "new action",
      /\b(?:walked|ran|jumped|grabbed|threw|opened|closed|smiled|laughed|cried|snatched|stalked|entered)\b/i,
    ],
    [
      "new body reaction",
      /\b(?:trembled|blinked|sighed|stared|shrugged|winked|flinched|eyes|tail)\b/i,
    ],
    [
      "new sound",
      /\b(?:roar|growl|bark|scream|whistle|buzz|bang)\b/i,
    ],
    [
      "new outcome",
      /\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived)\b/i,
    ],
    [
      "new chronology",
      /\b(?:later|earlier|tomorrow|yesterday|the next day|years later)\b/i,
    ],
  ];

  for (const [name, pattern] of concreteRules) {
    if (!pattern.test(lower)) {
      continue;
    }

    if (
      name === "new outcome" ||
      name === "new chronology"
    ) {
      risk = Math.max(risk, 1);
      continue;
    }

    const match =
      lower.match(pattern)?.[0] ?? "";

    const unsupported = tokens(match)
      .map(stem)
      .some(
        (word) => !source.has(word),
      );

    if (unsupported) {
      risk = Math.max(risk, 1);
    }
  }

  /*
   * These rules are deliberately checked against the TEXT.
   * Their presence in beat.forbiddenMoves alone does nothing.
   */

  if (
    forbidden.includes(
      "planner vocabulary",
    )
  ) {
    if (META.test(lower)) {
      risk = 1;
    }
  }

  if (
    forbidden.includes(
      "analytic explanation",
    )
  ) {
    const analytic =
      /\b(?:this means|this reveals|this shows|the point is|the reason is|the meaning is|which means|in other words|therefore)\b/i;

    if (analytic.test(lower)) {
      risk = 1;
    }
  }

  if (
    forbidden.includes(
      "new dialogue",
    )
  ) {
    if (
      /["“”]/.test(text) ||
      /^(?:said|says|asked|asks|replied|replies)\b/i.test(
        lower,
      )
    ) {
      risk = 1;
    }
  }

  

  return metric(risk);
}

function relationMeaning(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const supported = new Set(
    supportedEventIds(
      text,
      envelope,
    ),
  );

  const required = unique(
    beat.eventIds ?? [],
  );

  const coverage = required.length
    ? required.filter(
        (id) => supported.has(id),
      ).length /
      required.length
    : 0.5;

  const relationCount =
    supportedRelations(
      [...supported],
      envelope,
    ).length;

  const relationBonus =
    beat.relationKinds?.length
      ? Math.min(
          1,
          relationCount /
            Math.max(
              1,
              beat.relationKinds.length,
            ),
        )
      : Math.min(
          1,
          relationCount / 2,
        );

  return metric(
    coverage * 0.55 +
      relationBonus * 0.45,
  );
}

function transitionScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  if (isPayoffBeat(beat)) {
    return endpointExactness(
      text,
      beat,
    );
  }

  const change = clean(
    beat.change,
  );

  const next = clean(
    beat.next || beat.frontier,
  );

  const relations =
    supportedRelations(
      supportedEventIds(
        text,
        envelope,
      ),
      envelope,
    ).length;

  return metric(
    Math.min(
      1,
      relations / 2,
    ) *
      0.4 +
      (change
        ? similarity(
            text,
            change,
          )
        : 0.2) *
        0.35 +
      (next
        ? similarity(
            text,
            next,
          )
        : 0.2) *
        0.25,
  );
}

function compressionScore(
  text: string,
): number {
  const count =
    tokens(text).length;

  if (!count) return 0;

  if (count <= 7) {
    return 1;
  }

  if (count <= 10) {
    return 0.45;
  }

  return 0;
}

function repetitionRisk(
  text: string,
  priorTexts: readonly string[],
): number {
  if (!priorTexts.length) {
    return 0;
  }

  return Math.max(
    ...priorTexts.map(
      (prior) =>
        similarity(
          text,
          prior,
        ),
    ),
  );
}

function normalizeLine(
  value: unknown,
): string {
  return clean(value)
    .replace(
      /^[-*\d.)\s]+/,
      "",
    )
    .replace(
      /^['"]|['"]$/g,
      "",
    )
    .trim();
}

function hasPlaceholder(
  value: unknown,
): boolean {
  const text = normalizeLine(
    value,
  );

  return (
    !text ||
    PLACEHOLDER.test(text)
  );
}

export function scoreMouthCandidate(
  input: {
    text: string;
    beat: MouthCandidateBeat;
    envelope: RealityEnvelope;
    priorTexts?: readonly string[];
  },
): MouthCandidate {
  const text = normalizeLine(
    input.text,
  );

  const priorTexts =
    input.priorTexts ?? [];

  const supported =
    supportedEventIds(
      text,
      input.envelope,
    );

  const relations =
    supportedRelations(
      supported,
      input.envelope,
    );

  const grounding = metric(
    overlap(
      setOf(text),
      suppliedTerms(
        input.envelope,
      ),
    ) *
      0.6 +
      (supported.length
        ? 0.4
        : 0),
  );

  const meaning =
    relationMeaning(
      text,
      input.beat,
      input.envelope,
    );

  const transition =
    transitionScore(
      text,
      input.beat,
      input.envelope,
    );

  const endpoint =
    endpointExactness(
      text,
      input.beat,
    );

  const invention =
    concreteRisk(
      text,
      input.envelope,
    );

  const forbidden =
    forbiddenRisk(
      text,
      input.beat,
      input.envelope,
    );

  const repetition =
    repetitionRisk(
      text,
      priorTexts,
    );

  const novelty =
    metric(
      1 - repetition,
    );

  const compression =
    compressionScore(text);

  const obligationCoverage =
    metric(
      meaning * 0.6 +
        transition * 0.4,
    );

  const relationContract =
    input.beat.relationKinds
      ?.length
      ? meaning
      : 0.5;

  const collageRisk =
    input.beat.eventIds &&
    input.beat.eventIds.length >
      1 &&
    tokens(text).length >
      4 &&
    supported.length >=
      input.beat.eventIds.length &&
    meaning < 0.5
      ? 0.7
      : 0;

  const cohesion =
    priorTexts.length
      ? metric(
          overlap(
            setOf(text),
            setOf(
              priorTexts.join(
                " ",
              ),
            ),
          ),
        )
      : 0.5;

  const restatement =
    input.beat.eventIds?.some(
      (id) =>
        similarity(
          text,
          eventLabel(
            input.envelope,
            id,
          ),
        ) >= 0.92,
    )
      ? 0.8
      : 0;

  const score =
    isPayoffBeat(input.beat)
      ? metric(
          endpoint * 0.85 +
            grounding * 0.05 +
            compression * 0.05 +
            novelty * 0.05 -
            invention * 0.4 -
            forbidden * 0.7,
        )
      : metric(
          grounding * 0.18 +
            meaning * 0.2 +
            transition * 0.24 +
            obligationCoverage *
              0.12 +
            relationContract * 0.08 +
            cohesion * 0.04 +
            novelty * 0.06 +
            compression * 0.08 -
            invention * 0.35 -
            forbidden * 0.5 -
            collageRisk * 0.15 -
            restatement * 0.12,
        );

  const reasons: string[] = [];

  if (grounding < 0.42) {
    reasons.push(
      "weak-grounding",
    );
  }

  if (meaning < 0.4) {
    reasons.push(
      "weak-meaning-execution",
    );
  }

  if (transition < 0.4) {
    reasons.push(
      "weak-meaning-transition",
    );
  }

  if (invention > 0.45) {
    reasons.push(
      "high-invention-risk",
    );
  }

  if (forbidden > 0) {
    reasons.push(
      "forbidden-slot-move",
    );
  }

  if (repetition > 0.8) {
    reasons.push(
      "high-repetition",
    );
  }

  if (compression < 0.45) {
    reasons.push(
      "poor-compression",
    );
  }

  if (collageRisk > 0) {
    reasons.push(
      "keyword-assembly",
    );
  }

  if (restatement > 0) {
    reasons.push(
      "source-restatement",
    );
  }

  if (
    isPayoffBeat(
      input.beat,
    ) &&
    endpoint !== 1
  ) {
    reasons.push(
      "non-exact-payoff",
    );
  }

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds:
      supported,
    supportedRelationPairs:
      relations,
    groundingScore:
      grounding,
    meaningScore:
      meaning,
    transitionScore:
      transition,
    obligationCoverage,
    relationContractScore:
      relationContract,
    forbiddenMoveRisk:
      forbidden,
    cohesionScore:
      cohesion,
    noveltyScore:
      novelty,
    compressionScore:
      compression,
    inventionRisk:
      invention,
    repetitionRisk:
      repetition,
    collageRisk,
    endpointExactness:
      endpoint,
    score,
    reasons,
  };
}

function candidateIsLegal(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
): boolean {
  if (!candidate.text) {
    return false;
  }

  if (
    hasPlaceholder(
      candidate.text,
    )
  ) {
    return false;
  }

  if (
    candidate.forbiddenMoveRisk >
    0
  ) {
    return false;
  }

  if (
    candidate.inventionRisk >=
    0.62
  ) {
    return false;
  }

  if (
    candidate.text
      .split(/\s+/)
      .filter(Boolean)
      .length > 10
  ) {
    return false;
  }

  if (
    isPayoffBeat(beat)
  ) {
    return (
      candidate.endpointExactness ===
      1
    );
  }

  return true;
}

export function selectBestMouthCandidate(
  input: {
    texts: readonly string[];
    beat: MouthCandidateBeat;
    envelope: RealityEnvelope;
    priorTexts?: readonly string[];
  },
): MouthCandidateSelection {
  const scored = input.texts
    .map((text) =>
      scoreMouthCandidate({
        text,
        beat: input.beat,
        envelope:
          input.envelope,
        priorTexts:
          input.priorTexts,
      }),
    );

  const candidates =
    scored
      .filter(
        (candidate) =>
          candidateIsLegal(
            candidate,
            input.beat,
          ),
      )
      .sort(
        (a, b) =>
          b.score - a.score,
      );

  const rejected =
    scored.filter(
      (candidate) =>
        !candidateIsLegal(
          candidate,
          input.beat,
        ),
    );

  if (
    rejected.length &&
    (
      candidates.length ===
        0 ||
      process.env
        .QRE_AUTHOR_DEBUG_MOUTH_REJECTIONS ===
        "true"
    )
  ) {
    console.log(
      `[QRE MOUTH REJECT] beat=${input.beat.order} rejected=${rejected.length} accepted=${candidates.length}`,
    );

    for (const candidate of rejected) {
      console.log(
        JSON.stringify({
          beat:
            input.beat.order,
          text:
            candidate.text,
          score:
            candidate.score,
          inventionRisk:
            candidate.inventionRisk,
          forbiddenMoveRisk:
            candidate.forbiddenMoveRisk,
          meaningScore:
            candidate.meaningScore,
          transitionScore:
            candidate.transitionScore,
          groundingScore:
            candidate.groundingScore,
          reasons:
            candidate.reasons,
        }),
      );
    }
  }

  return {
    selected:
      candidates[0],
    candidates,
  };
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{
  role: "system" | "user";
  content: string;
}> {
  const beat = input.beats[0];

  if (!beat) {
    return [
      {
        role: "system",
        content:
          "QRE CANONICAL MOUTH: no approved beat.",
      },
      {
        role: "user",
        content:
          JSON.stringify({
            task: "none",
          }),
      },
    ];
  }

  const anchors =
    (
      beat.eventIds ?? []
    ).map((id) => ({
      id,
      label:
        eventLabel(
          input.envelope,
          id,
        ),
    }));

  const relations =
    input.envelope.relations
      .filter(
        (relation) =>
          (
            beat.eventIds ??
            []
          ).includes(
            relation.from,
          ) ||
          (
            beat.eventIds ??
            []
          ).includes(
            relation.to,
          ),
      )
      .map((relation) => ({
        from: eventLabel(
          input.envelope,
          relation.from,
        ),
        to: eventLabel(
          input.envelope,
          relation.to,
        ),
        kind:
          relation.kind,
        strength:
          relation.strength,
      }));

  const system = [
    "QRE CANONICAL MOUTH · ONE APPROVED BEAT.",
    "The upstream Author already chose reality, movie, meaning, relationship, and endpoint.",
    "Your only job is language realization.",
    "Write 5 materially different short viewer-facing lines for this beat.",
    "2-7 words preferred. One dominant thought. One semantic move.",
    "Make the next cut feel desirable without inventing a new event.",
    "",
    "REALITY LOCK: never invent concrete actions, body reactions, facial expressions, objects, people, places, sounds, dialogue, chronology, or outcomes.",
    "Creative framing MAY introduce new wording, attitude, status language, implication, rhythm, rhetorical pressure, or genre flavor.",
    "New wording is not new reality.",
    "Never write planner language, explain the relationship, or turn the beat into a summary.",
    "Never use a comma-chain or a subject/trait/action scaffold.",
    "",
    "GOOD RHYTHM REFERENCES:",
    "Came in nervous.",
    "Fierce anyway.",
    "Then came the bow.",
    "Blue, apparently.",
    "Peace was temporary.",
    "",
    "These are rhythm references only.",
    "Do not copy unsupplied facts.",
    "",
    "PAYOFF: if this beat is the payoff, return only the exact supplied endpoint phrase.",
    "",
    "RETURN JSON ONLY:",
    '{"variantsByBeat":[{"order":NUMBER,"variants":["LINE 1","LINE 2","LINE 3","LINE 4","LINE 5"]}]}',
  ].join("\n");

  const user = {
    task:
      "realize_one_approved_beat",
    subject:
      input.envelope.subject,
    lens:
      clean(input.lens),
    priorTexts:
      input.priorTexts ?? [],
    suppliedEvidence:
      input.envelope
        .suppliedPhrases,
    beat: {
      order:
        beat.order,
      role:
        beat.role,
      attentionFunction:
        beat.attentionFunction,
      creativeMove:
        beat.creativeMove,
      realizationMode:
        beat.realizationMode,
      eventIds:
        beat.eventIds ?? [],
      anchors,
      relationKinds:
        beat.relationKinds ?? [],
      relationStrength:
        beat.relationStrength ??
        0,
      relations,
      change:
        clean(beat.change),
      next:
        clean(
          beat.next ||
            beat.frontier,
        ),
      obligations:
        beat.obligations ??
        [],
      forbiddenMoves:
        beat.forbiddenMoves ??
        [],
      payoff:
        isPayoffBeat(beat),
      endpoint:
        endpointText(beat),
    },
  };

  return [
    {
      role: "system",
      content: system,
    },
    {
      role: "user",
      content:
        JSON.stringify(
          user,
        ),
    },
  ];
}

export function parseMouthCandidateBatch(
  raw: string,
): MouthCandidateBatch | undefined {
  const original = clean(raw);

  const text = original
    .replace(
      /^```(?:json|text|txt)?/i,
      "",
    )
    .replace(
      /```$/i,
      "",
    )
    .trim();

  if (!text) {
    return undefined;
  }

  const normalizeVariants = (
    value: unknown,
  ): string[] =>
    Array.isArray(value)
      ? unique(
          value
            .map(normalizeLine)
            .filter(
              (line) =>
                !hasPlaceholder(
                  line,
                ),
            ),
        ).slice(
          0,
          MAX_CANDIDATES,
        )
      : [];

  try {
    const value = JSON.parse(
      text,
    ) as Record<
      string,
      unknown
    >;

    if (
      Array.isArray(
        value.variantsByBeat,
      )
    ) {
      const variantsByBeat =
        value
          .variantsByBeat
          .filter(
            (
              entry,
            ): entry is Record<
              string,
              unknown
            > =>
              Boolean(entry) &&
              typeof entry ===
                "object",
          )
          .map(
            (entry) => ({
              order:
                Number(
                  entry.order ??
                    0,
                ),
              variants:
                normalizeVariants(
                  entry.variants,
                ),
            }),
          )
          .filter(
            (entry) =>
              entry.order > 0 &&
              entry.variants
                .length > 0,
          );

      if (
        variantsByBeat.length
      ) {
        return {
          variantsByBeat,
        };
      }
    }

    if (
      Array.isArray(
        value.variants,
      )
    ) {
      const variants =
        normalizeVariants(
          value.variants,
        );

      if (variants.length) {
        return {
          variantsByBeat: [
            {
              order: 1,
              variants,
            },
          ],
        };
      }
    }

    if (
      Array.isArray(
        value.texts,
      )
    ) {
      const variants =
        normalizeVariants(
          value.texts,
        );

      if (variants.length) {
        return {
          variantsByBeat: [
            {
              order: 1,
              variants,
            },
          ],
        };
      }
    }
  } catch {
    // Fall through to bounded line parsing.
  }

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean)
    .filter(
      (line) =>
        !PLACEHOLDER.test(line),
    )
    .filter(
      (line) =>
        !/^variantsByBeat\b/i.test(
          line,
        ),
    )
    .filter(
      (line) =>
        !/^[\[\]{}]$/.test(
          line,
        ),
    )
    .filter(
      (line) =>
        tokens(line).length >= 2 &&
        tokens(line).length <= 10,
    )
    .slice(0, MAX_CANDIDATES);

  return lines.length
    ? {
        variantsByBeat: [
          {
            order: 1,
            variants: lines,
          },
        ],
      }
    : undefined;
}
export async function generateAndSelectMouthCandidates(
  input: MouthCandidateGenerationInput & {
    model: MouthCandidateModel;
  },
): Promise<{
  texts: string[];
  candidates: MouthCandidate[];
  rawText: string;
}> {
  const ordered = [
    ...input.beats,
  ].sort(
    (a, b) =>
      a.order - b.order,
  );

  const MAX_CONCURRENT_REQUESTS = 3;

  type BeatJobResult = {
    beat: MouthCandidateBeat;
    exact?: MouthCandidate;
    variants: string[];
    rawParts: string[];
    repairsUsed: number;
  };

  const basePriorTexts =
    input.priorTexts ?? [];

  const runBeatJob = async (
    beat: MouthCandidateBeat,
  ): Promise<BeatJobResult> => {
    /*
     * Payoff beats are deterministic.
     * Never spend a model request rewriting an exact supplied endpoint.
     */
    if (
      isPayoffBeat(beat) &&
      endpointText(beat)
    ) {
      const exact =
        scoreMouthCandidate({
          text:
            endpointText(
              beat,
            ),
          beat,
          envelope:
            input.envelope,
          priorTexts:
            basePriorTexts,
        });

      return {
        beat,
        exact,
        variants: [],
        rawParts: [],
        repairsUsed: 0,
      };
    }

    const messages =
      buildMouthCandidateMessages({
        ...input,
        beats: [beat],
        priorTexts:
          basePriorTexts,
      });

    const rawParts: string[] = [];
    let repairsUsed = 0;

    let result =
      await input.model(
        messages,
      );

    rawParts.push(
      `BEAT ${beat.order} PRIMARY\n${result.text}`,
    );

    let parsed =
      parseMouthCandidateBatch(
        result.text,
      );

    let variants =
      parsed?.variantsByBeat.find(
        (entry) =>
          entry.order ===
          beat.order,
      )?.variants ??
      [];

    /*
     * One bounded repair only.
     * Repair depends only on this beat,
     * so it can remain inside this beat job.
     */
    if (
      variants.length < 2 &&
      repairsUsed <
        MAX_REPAIRS_PER_BEAT
    ) {
      repairsUsed += 1;

      const repairMessages:
        Array<{
          role:
            | "system"
            | "user";
          content: string;
        }> = [
        messages[0]!,
        {
          role: "user",
          content:
            messages[1]!.content +
            "\n\nREPAIR THIS BEAT ONLY." +
            "\nReturn 5 actual language realizations." +
            "\nDo not return placeholders." +
            "\nDo not invent concrete reality." +
            "\nNew wording, attitude, status, implication, and rhetorical framing are allowed." +
            "\nReturn JSON only.",
        },
      ];

      result =
        await input.model(
          repairMessages,
        );

      rawParts.push(
        `BEAT ${beat.order} REPAIR\n${result.text}`,
      );

      parsed =
        parseMouthCandidateBatch(
          result.text,
        );

      const repairedVariants =
        parsed?.variantsByBeat.find(
          (entry) =>
            entry.order ===
            beat.order,
        )?.variants ??
        [];

      variants = unique([
        ...variants,
        ...repairedVariants,
      ]).slice(
        0,
        MAX_CANDIDATES,
      );
    }

    return {
      beat,
      variants,
      rawParts,
      repairsUsed,
    };
  };

  /*
   * Bounded concurrency.
   *
   * We intentionally do not Promise.all() every beat at once.
   * Local inference can saturate the model server and increase
   * total latency when too many requests compete for the same GPU.
   */
  const jobs: BeatJobResult[] = [];

  for (
    let start = 0;
    start < ordered.length;
    start += MAX_CONCURRENT_REQUESTS
  ) {
    const batch =
      ordered.slice(
        start,
        start +
          MAX_CONCURRENT_REQUESTS,
      );

    const batchResults =
      await Promise.all(
        batch.map(runBeatJob),
      );

    jobs.push(
      ...batchResults,
    );
  }

  /*
   * Preserve author order for the downstream sequence.
   *
   * Model generation is concurrent.
   * Candidate selection remains sequential so each selected
   * beat can influence repetition/cohesion scoring of the next.
   */
  const texts: string[] = [
    ...basePriorTexts,
  ];

  const candidates: MouthCandidate[] =
    [];

  const rawParts: string[] = [];

  for (const job of jobs) {
    rawParts.push(
      ...job.rawParts,
    );

    if (job.exact) {
      texts.push(
        job.exact.text,
      );

      candidates.push(
        job.exact,
      );

      continue;
    }

    const selection =
      selectBestMouthCandidate({
        texts: job.variants,
        beat: job.beat,
        envelope:
          input.envelope,
        priorTexts:
          texts,
      });

    if (
      selection.selected
    ) {
      texts.push(
        selection.selected.text,
      );

      candidates.push(
        selection.selected,
      );

      continue;
    }

    console.log(
      `[QRE MOUTH POOL EMPTY] beat=${job.beat.order} variants=${job.variants.length} repairs=${job.repairsUsed}`,
    );

    texts.push("");
  }

  /*
   * The public result's texts contain only the newly authored
   * sequence lines, not caller-provided prior context.
   */
  const authoredTexts =
    texts.slice(
      basePriorTexts.length,
    );

  return {
    texts:
      authoredTexts,
    candidates,
    rawText:
      rawParts.join(
        "\n--- BEAT ---\n",
      ),
  };
}