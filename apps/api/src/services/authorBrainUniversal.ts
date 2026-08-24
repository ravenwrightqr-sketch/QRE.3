/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * REALITY
 *   ↓
 * COGNITION
 *   ↓
 * LATENT MOVIE
 *   ↓
 * BEAT GRAPH
 *   ↓
 * REALITY ENVELOPE
 *   ↓
 * MEANING SPINE
 *   ↓
 * REALIZATION SLOTS
 *   ↓
 * MOUTH CANDIDATES
 *   ↓
 * DETERMINISTIC BEAM
 *   ↓
 * ATTENTION EDITOR
 *   ↓
 * CUT POLICY
 *   ↓
 * SEQUENCE ARC
 *   ↓
 * FINAL SCENES
 *
 * The model never owns reality.
 * The model never owns the movie.
 * The model never owns sequence selection.
 *
 * QRE owns:
 *   reality,
 *   semantic trajectory,
 *   meaning obligations,
 *   candidate scoring,
 *   sequence selection,
 *   endpoint preservation,
 *   final gating.
 *
 * The model supplies language only.
 */
import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  InformationFrontier,
  MagnetCircle,
  SequenceCut,
  SequencePlay,
  SubjectContinuity,
  ViewerAttentionRole,
  ViewerMomentum,
} from "@qre/contracts";

import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";

import {
  buildMeaningSpine,
  meaningSpineForBeat,
  type MeaningSpine,
} from "./authorMeaningSpine.js";

import {
  buildRealizationSlots,
  type RealizationSlot,
} from "./authorMouthRealizationSlot.js";

import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";

import {
  selectBestMouthSequence,
  type MouthCandidatePool,
} from "./authorMouthSequenceBeamSearch.js";

import {
  editAttentionSequence,
  buildAttentionRewritePrompt,
} from "./authorAttentionEditor.js";

import {
  evaluateCut,
  type CutWorld,
} from "./authorCutPolicy.js";

import {
  evaluateSequenceArc,
  type SequenceArcBeat,
} from "./authorSequenceArcGate.js";

import { localModelGenerate } from "./localModelRuntime.js";

import {
  recoverBeatPlanFromLatentMovie,
} from "./authorBeatPlanRecovery.js";

import {
  groundAuthorBeat,
} from "./authorBeatTruthGate.js";
const ROLES: readonly ViewerAttentionRole[] = [
  "arrival",
  "hook",
  "question",
  "pressure",
  "reframe",
  "escalation",
  "discovery",
  "consequence",
  "release",
  "payoff",
  "callback",
  "continuation",
];

const ROLE_ALIASES: Record<string, ViewerAttentionRole> = {
  setup: "arrival",
  opening: "arrival",
  introduction: "arrival",
  development: "pressure",
  hypothesis: "pressure",
  turn: "reframe",
  contrast: "reframe",
  status_inversion: "reframe",
  reveal: "discovery",
  complication: "escalation",
  consequence: "consequence",
  resolution: "payoff",
  coda: "continuation",
  personification: "reframe",
  sensory_hook: "hook",
  meaning_shift: "reframe",
  callback: "callback",
  payoff: "payoff",
  escalation: "escalation",
  arrival: "arrival",
};

const GAIN_ALIASES: Record<
  string,
  NonNullable<SequenceCut["gainKind"]>
> = {
  novelty: "new_fact",
  context: "new_fact",
  emotional_state: "new_fact",
  sensory: "new_fact",
  information: "new_fact",
  personality: "reframe",
  trait: "new_fact",
  humor: "surprise",
  comic_turn: "surprise",
  status: "reframe",
  emotional: "reframe",
  memory: "callback",
  private_meaning: "reframe",
  satisfaction: "payoff",
  resolution: "payoff",
  reveal: "discovery",
  anticipation: "question",
  uncertainty: "question",
  escalation: "escalation",
  information_value: "discovery",
  contrast: "reframe",
  replay: "callback",
  role: "reframe",
  afterglow: "payoff",
  meaning_shift: "reframe",
};

const ATTENTION_ALIASES: Record<
  string,
  BeatAttentionFunction
> = {
  establish: "hook",
  establishment: "hook",
  opening: "hook",
  contrast: "reframe",
  status_inversion: "reframe",
  curiosity: "hook",
  build_curiosity: "hook",
  increase_tension: "escalation",
  surprise: "turn",
  relief: "release",
  conclude_scene: "payoff",
  reveal_joke: "reframe",
  humor: "payoff",
  paying_off: "payoff",
  attention: "hook",
  meaning: "reframe",
  uncertainty_reduction: "release",
};

const CREATIVE_MOVE_ALIASES: Record<
  string,
  BeatCreativeMove
> = {
  status_language: "status_inversion",
  rebellion: "status_inversion",
  comic_framing: "recontextualization",
  comic_framing_move: "recontextualization",
  status_inversion: "status_inversion",
  recontextualization: "recontextualization",
  double_meaning: "double_meaning",
  implication: "implication",
  understatement: "understatement",
  personification: "personification",
  callback: "callback",
  contrast: "contrast",
  none: "none",
};

const BAD_INTERNAL =
  /\b(?:attention strategy|operator(?: mix|s)?|build from beat|round\s*\d|cognitive(?: plan| brain)?|cognition|preserve forward|land the chosen|find subtle tension|contradictions?:\s*none|why this beat|viewer-facing|writing process|information frontier|narrative engagement|authoring process|planning language)\b/i;

const BAD_SUMMARY =
  /\b(?:discover .*backstory|build (?:the |viewer|character)|provide closure|highlight the theme|journey from .* to|transformation from .* to|true character|eventual happiness|viewers?['’] interest|customer satisfaction|cleaning process|closing remarks|thank you for choosing|comedy of character contrasts|final revelation)\b/i;

const BAD_VAGUE =
  /^(?:the unexpected|the unknown|unseen chaos|hidden intentions|the next step|what happens next|more to come|details? of .*|the end|closure|a new identity|viewer interest|information seeking|what is the punchline)$/i;

const BAD_INTERPRETIVE_EXPLANATION =
  /\b(?:the viewer|this reveals|this means|which means|in this context|is now transformed into|was a cover for|reveals? that|symbolizes?|represents?|the mystery|what does .* mean|why does .* mean|the supplied (?:relationship|relationships|detail|details).*may support|may support (?:a|the) .* reading|the supplied .* reading|support (?:a|the) .* reading|relationships? may support|the final revelation|the punchline here)\b/i;

const CONCRETE_CLAIM =
  /\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|jumps?|jumping|leaps?|leaping|sits?|sitting|stands?|standing|ties?|tied|wrapping|wrapped|throws?|threw|laughs?|laughing|surprised|shocked|everyone|someone|nobody)\b/i;

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten a new one more"
    .split(/\s+/),
);

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const uniq = (
  values: readonly unknown[] | undefined,
  limit = 24,
): string[] =>
  [
    ...new Set(
      (values ?? [])
        .map(clean)
        .filter(Boolean),
    ),
  ].slice(0, limit);

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

type BeatAttentionFunction =
  | "hook"
  | "question"
  | "turn"
  | "escalation"
  | "reframe"
  | "callback"
  | "payoff"
  | "release";

type BeatCreativeMove =
  | "contrast"
  | "status_inversion"
  | "understatement"
  | "double_meaning"
  | "personification"
  | "callback"
  | "recontextualization"
  | "implication"
  | "none";

type AuthorBeat = {
  order: number;
  role: string;
  gainKind: string;
  change: string;
  next: string;
  frontier: string;
  necessity: string;
  eventIds?: string[];
  attentionFunction?: BeatAttentionFunction;
  setsUp?: string[];
  paysOff?: string[];
  creativeMove?: BeatCreativeMove;
  nextBeatPullTarget?: number;
};

type BeatPlan = {
  premise: string;
  baselineFacts: string[];
  attentionArc: string;
  beats: AuthorBeat[];
  closing?: string;
};

type TruthNote = {
  order: number;
  creativeOpportunity: string;
  forbiddenClaims: string[];
};

function parseJson<T>(
  raw: string,
): T | null {
  const text = clean(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    const repaired = text.replace(
      /\\_/g,
      "_",
    );

    try {
      return JSON.parse(repaired) as T;
    } catch {
      return null;
    }
  }
}

function debug(
  label: string,
  raw: string,
): void {
  if (
    process.env.QRE_AUTHOR_DEBUG_RAW !==
    "true"
  ) {
    return;
  }

  console.log(
    `\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`,
  );
}

function normalizeRole(
  value: unknown,
): ViewerAttentionRole {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_");

  const role =
    ROLE_ALIASES[normalized] ??
    normalized;

  return ROLES.includes(
    role as ViewerAttentionRole,
  )
    ? (role as ViewerAttentionRole)
    : "discovery";
}

function normalizeGain(
  value: unknown,
): NonNullable<
  SequenceCut["gainKind"]
> {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_");

  const gain =
    GAIN_ALIASES[normalized] ??
    normalized;

  const allowed = new Set<
    NonNullable<
      SequenceCut["gainKind"]
    >
  >([
    "new_fact",
    "surprise",
    "question",
    "escalation",
    "reframe",
    "discovery",
    "consequence",
    "callback",
    "payoff",
  ]);

  return allowed.has(
    gain as NonNullable<
      SequenceCut["gainKind"]
    >,
  )
    ? (gain as NonNullable<
        SequenceCut["gainKind"]
      >)
    : "discovery";
}

function normalizeAttentionFunction(
  value: unknown,
): BeatAttentionFunction {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (
    ATTENTION_ALIASES[normalized]
  ) {
    return ATTENTION_ALIASES[
      normalized
    ];
  }

  const allowed: readonly BeatAttentionFunction[] =
    [
      "hook",
      "question",
      "turn",
      "escalation",
      "reframe",
      "callback",
      "payoff",
      "release",
    ];

  return allowed.includes(
    normalized as BeatAttentionFunction,
  )
    ? (normalized as BeatAttentionFunction)
    : "reframe";
}

function normalizeCreativeMove(
  value: unknown,
): BeatCreativeMove {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (
    CREATIVE_MOVE_ALIASES[
      normalized
    ]
  ) {
    return CREATIVE_MOVE_ALIASES[
      normalized
    ];
  }

  const allowed: readonly BeatCreativeMove[] =
    [
      "contrast",
      "status_inversion",
      "understatement",
      "double_meaning",
      "personification",
      "callback",
      "recontextualization",
      "implication",
      "none",
    ];

  return allowed.includes(
    normalized as BeatCreativeMove,
  )
    ? (normalized as BeatCreativeMove)
    : "none";
}

function normalizeFacts(
  value: unknown,
): string[] {
  if (Array.isArray(value)) {
    return uniq(value, 16);
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [];
  }

  return uniq(
    Object.entries(
      value as Record<
        string,
        unknown
      >,
    )
      .filter(
        ([, state]) =>
          Boolean(state),
      )
      .map(([fact]) => fact),
    16,
  );
}

function normalizeAttentionArc(
  value: unknown,
  beats: AuthorBeat[],
): string {
  const supplied = clean(value);

  if (supplied) {
    const words =
      supplied
        .split(/\s+/)
        .filter(Boolean);

    if (
      words.length >= 2 &&
      words.length <= 8 &&
      !BAD_INTERNAL.test(
        supplied,
      )
    ) {
      return supplied;
    }
  }

  return beats
    .map(
      (beat) =>
        beat.attentionFunction ??
        "reframe",
    )
    .join(" → ");
}

function normalizeBeatPlan(
  value: unknown,
): BeatPlan | undefined {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return undefined;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const rawBeats =
    Array.isArray(
      record.beats,
    )
      ? record.beats
      : [];

  const beats: AuthorBeat[] =
    [];

  for (const raw of rawBeats) {
    if (
      !raw ||
      typeof raw !== "object"
    ) {
      continue;
    }

    const item =
      raw as Record<
        string,
        unknown
      >;

    const change =
      clean(item.change);
    const next =
      clean(item.next);
    const frontier =
      clean(
        item.frontier ??
          item.informationFrontier,
      );
    const necessity =
      clean(
        item.necessity ??
          item.whyNext,
      );

    if (!change) {
      continue;
    }

    if (
      BAD_INTERNAL.test(
        change,
      ) ||
      BAD_SUMMARY.test(
        change,
      ) ||
      BAD_INTERPRETIVE_EXPLANATION.test(
        change,
      )
    ) {
      continue;
    }

    if (
      BAD_INTERNAL.test(
        next,
      ) ||
      BAD_SUMMARY.test(
        next,
      ) ||
      BAD_INTERPRETIVE_EXPLANATION.test(
        next,
      )
    ) {
      continue;
    }

    if (
      BAD_INTERPRETIVE_EXPLANATION.test(
        necessity,
      )
    ) {
      continue;
    }

    if (
      BAD_INTERNAL.test(
        frontier,
      ) ||
      BAD_SUMMARY.test(
        frontier,
      ) ||
      BAD_VAGUE.test(
        frontier,
      )
    ) {
      continue;
    }

    if (
      change.split(/\s+/)
        .length > 14 ||
      next.split(/\s+/)
        .length > 12 ||
      frontier.split(/\s+/)
        .length > 10 ||
      necessity.split(/\s+/)
        .length > 12
    ) {
      continue;
    }

    beats.push({
      order:
        beats.length + 1,
      role:
        clean(item.role) ||
        "discovery",
      gainKind:
        clean(
          item.gainKind,
        ) ||
        "discovery",
      change,
      next,
      frontier:
        frontier || next,
      necessity:
        necessity ||
        "Preserves the next change in the discovered movie.",
      eventIds:
        Array.isArray(
          item.eventIds,
        )
          ? item.eventIds
              .map(clean)
              .filter(Boolean)
          : [],
      attentionFunction:
        normalizeAttentionFunction(
          item.attentionFunction,
        ),
      setsUp:
        Array.isArray(
          item.setsUp,
        )
          ? uniq(
              item.setsUp,
              6,
            )
          : [],
      paysOff:
        Array.isArray(
          item.paysOff,
        )
          ? uniq(
              item.paysOff,
              6,
            )
          : [],
      creativeMove:
        normalizeCreativeMove(
          item.creativeMove,
        ),
      nextBeatPullTarget:
        typeof item.nextBeatPullTarget ===
        "number"
          ? metric(
              item.nextBeatPullTarget,
            )
          : 0.5,
    });
  }

  if (!beats.length) {
    return undefined;
  }

  return {
    premise:
      clean(record.premise),
    baselineFacts:
      normalizeFacts(
        record.baselineFacts,
      ),
    attentionArc:
      normalizeAttentionArc(
        record.attentionArc ??
          record.attention ??
          record.arc,
        beats,
      ),
    beats:
      beats.slice(0, 6),
    closing:
      clean(
        record.closing ??
          record.continuation,
      ),
  };
}

function canonicalMeaningWords(
  value: string,
  subject: string,
): string[] {
  const subjectWords =
    new Set(
      clean(subject)
        .toLowerCase()
        .split(
          /[^a-z0-9'-]+/i,
        )
        .filter(Boolean),
    );

  return clean(value)
    .toLowerCase()
    .split(
      /[^a-z0-9'-]+/i,
    )
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP.has(word) &&
        !subjectWords.has(
          word,
        ),
    );
}

function enforceBeatMeaningContinuity(
  plan: BeatPlan,
  input: AuthorBrainTruth,
): BeatPlan | undefined {
  if (
    plan.beats.length < 2
  ) {
    return plan;
  }

  const subject =
    clean(input.subject);

  const accepted: AuthorBeat[] =
    [];
  const rejected: number[] =
    [];

  for (const beat of plan.beats) {
    const previous =
      accepted[
        accepted.length - 1
      ];

    const currentMeaning =
      canonicalMeaningWords(
        beat.change,
        subject,
      );

    const previousMeaning =
      previous
        ? canonicalMeaningWords(
            previous.change,
            subject,
          )
        : [];

    const repeatedChange =
      Boolean(previous) &&
      currentMeaning.length > 0 &&
      currentMeaning.join(
        " ",
      ) ===
        previousMeaning.join(
          " ",
        );

    const meaningfulMetadata =
      Boolean(
        beat.attentionFunction &&
          beat.attentionFunction !==
            "hook",
      ) ||
      Boolean(
        beat.creativeMove &&
          beat.creativeMove !==
            "none",
      ) ||
      Boolean(
        beat.setsUp?.length,
      ) ||
      Boolean(
        beat.paysOff?.length,
      ) ||
      Boolean(
        clean(
          beat.frontier,
        ),
      ) ||
      Boolean(
        clean(beat.next),
      );

    if (
      repeatedChange &&
      !meaningfulMetadata
    ) {
      rejected.push(
        beat.order,
      );
      continue;
    }

    accepted.push({
      ...beat,
      order:
        accepted.length + 1,
    });
  }

  if (rejected.length) {
    debug(
      "BEAT-MEANING-GATE",
      JSON.stringify({
        rejected,
        originalBeatCount:
          plan.beats.length,
        acceptedBeatCount:
          accepted.length,
        reason:
          "duplicate beat meaning without graph contribution",
      }),
    );
  }

  if (!accepted.length) {
    return undefined;
  }

  return {
    ...plan,
    beats: accepted,
  };
}

function world(
  input: AuthorBrainTruth,
): CutWorld {
  return {
    prompt:
      clean(input.prompt),
    subject:
      clean(input.subject),
    place:
      clean(input.place),
    identity:
      input.subjectTruth
        ?.identityFacts ??
      [],
    facts:
      input.facts,
    moments:
      input.sourceMoments,
    memory:
      input.memoryContext ??
      [],
    trajectory:
      input.trajectory ??
      [],
    presence:
      input.presenceSummary ??
      [],
  };
}

function wordSet(
  value: string,
): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(
        /[^a-z0-9'-]+/i,
      )
      .filter(
        (word) =>
          word.length >= 4 &&
          !STOP.has(word),
      ),
  );
}

function overlap(
  a: Set<string>,
  b: Set<string>,
): number {
  if (!a.size) return 0;

  let hits = 0;

  for (const word of a) {
    if (b.has(word)) {
      hits += 1;
    }
  }

  return (
    hits /
    Math.max(1, a.size)
  );
}

function computeMagnet(
  before: ViewerMomentum,
  change: string,
  next: string,
  gain: string,
): MagnetCircle {
  const known =
    wordSet(
      before.known.join(" "),
    );

  const changeWords =
    wordSet(change);

  const nextWords =
    wordSet(next);

  const novelty =
    metric(
      1 -
        overlap(
          changeWords,
          known,
        ),
    );

  const vagueNext =
    BAD_VAGUE.test(
      clean(next),
    );

  const uncertainty =
    metric(
      (nextWords.size
        ? 0.25
        : 0.02) +
        (before.unresolved ||
        before.curiosityGap
          ? 0.2
          : 0) +
        ([
          "question",
          "surprise",
          "escalation",
        ].includes(gain)
          ? 0.2
          : 0) +
        (next.includes("?")
          ? 0.08
          : 0) -
        (vagueNext
          ? 0.35
          : 0),
    );

  const informationValue =
    metric(
      novelty * 0.42 +
        (changeWords.size
          ? 0.14
          : 0) +
        (nextWords.size
          ? 0.14
          : 0) +
        ([
          "surprise",
          "reframe",
          "discovery",
          "consequence",
          "callback",
          "payoff",
        ].includes(gain)
          ? 0.28
          : 0),
    );

  const attention =
    metric(
      novelty * 0.5 +
        informationValue *
          0.5,
    );

  const tension =
    metric(
      uncertainty *
        Math.max(
          informationValue,
          0.2,
        ),
    );

  const informationSeeking =
    metric(
      (nextWords.size
        ? 0.2
        : 0) +
        (before.unresolved
          ? 0.2
          : 0) +
        (before.forwardPull
          ? 0.18
          : 0) +
        (before.currentWant
          ? 0.08
          : 0) +
        (next.includes("?")
          ? 0.08
          : 0),
    );

  const narrativeEngagement =
    metric(
      (attention +
        tension +
        informationSeeking) /
        3,
    );

  const magnetStrength =
    metric(
      novelty * 0.16 +
        uncertainty * 0.16 +
        informationValue *
          0.2 +
        attention * 0.16 +
        tension * 0.18 +
        informationSeeking *
          0.1 +
        narrativeEngagement *
          0.04,
    );

  return {
    novelty,
    uncertainty,
    informationValue,
    attention,
    tension,
    informationSeeking,
    narrativeEngagement,
    magnetStrength,
    unresolved:
      next ||
      change ||
      before.unresolved,
    nextNeed:
      next ||
      before.forwardPull,
  };
}

function frontier(
  before: ViewerMomentum,
  change: string,
  next: string,
  magnet: MagnetCircle,
): InformationFrontier {
  const candidate = clean(
    next ||
      change ||
      before.unresolved ||
      "",
  );

  const safe =
    BAD_INTERNAL.test(
      candidate,
    ) ||
    BAD_VAGUE.test(
      candidate,
    )
      ? ""
      : candidate;

  return {
    known:
      before.known,
    frontier: safe,
    novelty:
      magnet.novelty,
    uncertainty:
      magnet.uncertainty,
    informationValue:
      magnet.informationValue,
    tension:
      magnet.tension,
    nextNeed:
      safe ||
      undefined,
  };
}

function subjectContinuity(
  subject: string,
  established: boolean,
  text: string,
  order: number,
): SubjectContinuity {
  const escaped =
    subject.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const explicit =
    Boolean(subject) &&
    new RegExp(
      `\\b${escaped}\\b`,
      "i",
    ).test(text);

  const pronoun =
    /\b(?:he|she|they|it|him|her|them|his|their|its)\b/i.test(
      text,
    );

  return {
    established:
      established ||
      Boolean(subject),
    subject,
    referenceMode:
      explicit
        ? "name"
        : pronoun
          ? "pronoun"
          : "implicit",
    referenceCost:
      explicit && established
        ? 0.35
        : pronoun && established
          ? 0.1
          : 0,
    lastExplicitReference:
      explicit
        ? order
        : undefined,
  };
}

function buildViewerMomentum(
  subject: string,
  plan: BeatPlan,
): SequencePlay | undefined {
  if (!plan.beats.length) {
    return undefined;
  }

  const baselineFacts =
    uniq(
      plan.baselineFacts,
      16,
    );

  let momentum: ViewerMomentum =
    {
      known:
        baselineFacts,
      subjectContinuity: {
        established: false,
        subject,
        referenceMode:
          "implicit",
        referenceCost: 0,
      },
      informationFrontier: {
        known:
          baselineFacts,
        frontier: "",
        novelty: 0,
        uncertainty: 0,
        informationValue: 0,
        tension: 0,
      },
    };

  const cuts: SequenceCut[] =
    [];

  let established =
    false;

  for (const beat of plan.beats) {
    const role =
      normalizeRole(
        beat.role,
      );

    const gainKind =
      normalizeGain(
        beat.gainKind,
      );

    const next =
      clean(
        beat.frontier ||
          beat.next,
      );

    const safeFrontier =
      BAD_INTERNAL.test(
        next,
      ) ||
      BAD_VAGUE.test(
        next,
      )
        ? ""
        : next;

    const magnet =
      computeMagnet(
        momentum,
        beat.change,
        safeFrontier,
        gainKind,
      );

    const state =
      subjectContinuity(
        subject,
        established,
        beat.change,
        beat.order,
      );

    established =
      established ||
      Boolean(subject);

    const after:
      ViewerMomentum = {
      known:
        momentum.known,
      expected:
        safeFrontier ||
        undefined,
      activeQuestion:
        gainKind ===
        "question"
          ? safeFrontier ||
            beat.change
          : momentum.activeQuestion,
      curiosityGap:
        safeFrontier ||
        momentum.curiosityGap,
      predictionShift:
        beat.change,
      currentWant:
        safeFrontier ||
        undefined,
      unresolved:
        magnet.unresolved,
      forwardPull:
        safeFrontier ||
        undefined,
      payoffDebt:
        momentum.payoffDebt,
      magnet,
      subjectContinuity:
        state,
      informationFrontier:
        frontier(
          momentum,
          beat.change,
          safeFrontier,
          magnet,
        ),
    };

    cuts.push({
      id:
        `cut-${beat.order}`,
      order:
        beat.order,
      role,
      gainKind,
      sourceIds:
        beat.eventIds ??
        [],
      informationGain:
        beat.change,
      attentionDelta:
        safeFrontier ||
        beat.change,
      viewerBefore: {
        known:
          momentum.known,
        expected:
          momentum.expected,
        unresolved:
          momentum.unresolved,
        currentWant:
          momentum.currentWant,
        recentChange:
          momentum.predictionShift,
      },
      viewerAfter: {
        known:
          after.known,
        expected:
          after.expected,
        unresolved:
          after.unresolved,
        currentWant:
          after.currentWant,
        recentChange:
          after.predictionShift,
      },
      momentum: {
        before:
          momentum,
        change:
          beat.change,
        after,
        nextPressure:
          safeFrontier ||
          undefined,
      },
      necessity: {
        necessary:
          beat.order ===
            plan.beats.length ||
          magnet.magnetStrength >=
            0.34,
        reason:
          beat.necessity,
        removalDamage:
          `Weakens the next want: ${
            safeFrontier ||
            beat.change
          }`,
      },
      nextPromise:
        safeFrontier ||
        undefined,
      noveltyScore:
        magnet.novelty,
      confidence:
        0.95,
    });

    momentum = after;
  }

  return {
    subject,
    premise:
      plan.premise,
    openingState: {
      known:
        baselineFacts,
    },
    baselineFacts,
    openingMomentum:
      cuts[0]?.momentum
        ?.before,
    cuts,
    closingMomentum:
      momentum,
    closingState: {
      known:
        momentum.known,
      unresolved:
        momentum.unresolved,
      currentWant:
        momentum.currentWant,
    },
    continuity: [],
    antiCrutch: [],
    continuation:
      plan.closing,
  };
}

function inferRiskDial(
  input: AuthorBrainTruth,
  cognition: ReturnType<
    typeof buildAuthorCognitivePlan
  >,
):
  | "safe"
  | "playful"
  | "bold"
  | "strange"
  | "dark"
  | "surreal"
  | "chaotic" {
  const text =
    `${input.prompt} ${input.lens ?? ""}`
      .toLowerCase();

  if (
    /demented|chaotic|absurd|unhinged/.test(
      text,
    )
  ) {
    return "chaotic";
  }

  if (
    /surreal|dreamlike|weird|strange/.test(
      text,
    )
  ) {
    return "surreal";
  }

  if (
    /horror|dark|creepy|knives|unsettling/.test(
      text,
    )
  ) {
    return "dark";
  }

  if (
    /bold|wild|extreme/.test(
      text,
    )
  ) {
    return "bold";
  }

  if (
    /funny|comedy|humor|romance|romantic|playful|living memory/.test(
      text,
    ) ||
    cognition.mode ===
      "living_memory"
  ) {
    return "playful";
  }

  if (
    cognition.mode ===
    "concept"
  ) {
    return "bold";
  }

  return "safe";
}

function brief(
  input: AuthorBrainTruth,
  strategy: string,
): AuthorCreativeBrief {
  return {
    angle:
      `attention strategy: ${strategy}`,
    engine:
      "latent movie discovery → Beat Graph → Meaning Spine → realization slots → candidate beam → attention edit → cut gate",
    question:
      "what changes the viewer's mental model next?",
    strongestImage:
      input.facts[0] ??
      input.sourceMoments[0] ??
      "the strongest supplied detail",
    tension:
      "novelty → uncertainty → information value → attention → tension → information seeking → consequence",
    payoff:
      "a character-specific consequence or reframe",
    callback:
      input.memoryContext?.[0] ??
      input.trajectory?.[0] ??
      "none yet",
    rhythm:
      [
        "hit",
        "standard",
        "hit",
        "short",
      ] as AuthorCreativeBrief["rhythm"],
    avoid: [
      "fact parade",
      "identity repetition",
      "generic emotion arc",
      "invented reality",
      "labels in viewer prose",
      "literal questions",
      "padding",
      "explaining the joke",
    ],
  };
}

function shouldTruthCheckBeat(
  beat: AuthorBeat,
  evidence: string[],
): boolean {
  const change =
    beat.change;

  if (!change) {
    return false;
  }

  if (
    !CONCRETE_CLAIM.test(
      change,
    )
  ) {
    return false;
  }

  const source =
    wordSet(
      evidence.join(" "),
    );

  const normalizedChange =
    wordSet(change);

  return (
    overlap(
      normalizedChange,
      source,
    ) < 0.55
  );
}

async function buildTruthNotes(
  input: AuthorBrainTruth,
  plan: BeatPlan,
): Promise<TruthNote[]> {
  const evidence = [
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ??
      []),
  ]
    .map(clean)
    .filter(Boolean);

  const notes:
    TruthNote[] = [];

  for (const beat of plan.beats) {
    if (
      !shouldTruthCheckBeat(
        beat,
        evidence,
      )
    ) {
      continue;
    }

    const grounded =
      await groundAuthorBeat({
        subject:
          input.subject,
        facts:
          input.facts,
        moments:
          input.sourceMoments,
        memory:
          input.memoryContext ??
          [],
        beat: {
          order:
            beat.order,
          role:
            beat.role,
          gainKind:
            beat.gainKind,
          change:
            beat.change,
          frontier:
            beat.frontier,
          nextNeed:
            beat.next,
          necessity:
            beat.necessity,
        },
      });

    notes.push({
      order:
        beat.order,
      creativeOpportunity:
        grounded.creativeOpportunity,
      forbiddenClaims:
        grounded.forbiddenClaims,
    });
  }

  return notes;
}

function buildAttentionBeatInputs(
  sequence: SequencePlay,
  texts: string[],
  plan: BeatPlan,
) {
  return sequence.cuts.map(
    (
      cut,
      index,
    ) => {
      const beat =
        plan.beats[index];

      return {
        order:
          index + 1,
        role:
          cut.role,
        gainKind:
          cut.gainKind,
        text:
          clean(
            texts[index] ?? "",
          ),
        change:
          cut.informationGain,
        next:
          cut.nextPromise,
        frontier:
          cut.momentum
            ?.after
            .informationFrontier
            ?.frontier,
        sourceIds:
          cut.sourceIds,
        attentionFunction:
          beat
            ?.attentionFunction,
        setsUp:
          beat?.setsUp ??
          [],
        paysOff:
          beat?.paysOff ??
          [],
        creativeMove:
          beat?.creativeMove,
        nextBeatPullTarget:
          beat?.nextBeatPullTarget,
      };
    },
  );
}

function scenesFromSequence(
  sequence: SequencePlay,
  texts: string[],
  input: AuthorBrainTruth,
  cognition: ReturnType<
    typeof buildAuthorCognitivePlan
  >,
) {
  const attempted =
    sequence.cuts.length;

  const scenes:
    AuthorScene[] = [];

  const prior:
    string[] = [];

  const rejectionReasons:
    Record<
      string,
      number
    > = {};

  const worldValue =
    world(input);

  for (
    let i = 0;
    i < attempted;
    i += 1
  ) {
    const cut =
      sequence.cuts[i];

    const text =
      clean(
        texts[i] ?? "",
      );

    if (!text) {
      rejectionReasons[
        "missing-text"
      ] =
        (rejectionReasons[
          "missing-text"
        ] ?? 0) + 1;
      continue;
    }

    const policy =
      evaluateCut(
        text,
        worldValue,
        {
          role:
            cut.role,
          gainKind:
            cut.gainKind,
          change:
            cut.informationGain,
          next:
            cut.nextPromise,
          text,
          subjectEstablished:
            Boolean(
              cut.momentum
                ?.before
                .subjectContinuity
                ?.established,
            ),
          informationFrontier:
            cut.momentum
              ?.after
              .informationFrontier
              ?.frontier,
          characterTraits:
            cognition
              .characterRead
              ?.coreTraits ??
            [],
          characterContradictions:
            cognition
              .characterRead
              ?.contradictions ??
            [],
          characterStatusPosture:
            cognition
              .characterRead
              ?.statusPosture ??
            "",
          characterFrames:
            cognition
              .characterRead
              ?.creativeFrames
              ?.map(
                (frame) =>
                  frame.frame,
              ) ?? [],
        },
        prior,
      );

    if (!policy.accepted) {
      for (
        const reason of
          policy.reasons
      ) {
        rejectionReasons[
          reason
        ] =
          (rejectionReasons[
            reason
          ] ?? 0) + 1;
      }

      continue;
    }

    scenes.push({
      text,
      kind:
        cut.role ===
        "hook"
          ? "hook"
          : cut.role ===
              "payoff"
            ? "payoff"
            : "line",
    });

    prior.push(text);
  }

  return {
    scenes,
    attempted,
    rejected:
      attempted -
      scenes.length,
    rejectionReasons,
  };
}

function endpointLabel(
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
): string {
  return (
    envelope.events.find(
      (event) =>
        event.id ===
        envelope.endpointEventId,
    )?.label ??
    ""
  );
}

function candidateBeatFromSlot(
  slot: RealizationSlot,
  spine: MeaningSpine,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  originalBeat?: MouthCandidateBeat,
): MouthCandidateBeat {
  const spineBeat = meaningSpineForBeat(
    spine,
    slot.order,
  );

  if (!spineBeat) {
    throw new Error(
      `CANONICAL MOUTH INVARIANT FAILED: missing spine beat ${slot.order}.`,
    );
  }

  const endpoint = endpointLabel(envelope);

  const isPayoff =
    slot.kind === "payoff" ||
    originalBeat?.attentionFunction === "payoff" ||
    originalBeat?.role === "payoff";

  const sourceEventIds = uniq(
    [
      ...slot.sourceEventIds,
      ...slot.inheritedEventIds,
    ],
    8,
  );

  const sourceLabels = uniq(
    slot.sourceLabels,
    8,
  );

  const targetLabels = uniq(
    [
      ...slot.targetLabels,
      ...(isPayoff && endpoint
        ? [endpoint]
        : []),
    ],
    8,
  );

return {
  order: slot.order,
  role:
    originalBeat?.role ||
    (isPayoff ? "payoff" : slot.kind),

  attentionFunction:
    originalBeat?.attentionFunction ||
    (isPayoff ? "payoff" : "reframe"),

  creativeMove:
    originalBeat?.creativeMove ||
    (isPayoff ? "callback" : "none"),

  realizationMode:
    `${slot.kind} ${slot.mode}`.trim(),

  eventIds: sourceEventIds,

  change:
    clean(spineBeat.change) ||
    clean(originalBeat?.change),

  next:
    clean(spineBeat.next) ||
    clean(originalBeat?.next) ||
    targetLabels.join("; "),

  frontier:
    clean(spineBeat.next) ||
    clean(originalBeat?.next) ||
    targetLabels.join("; "),

  setsUp:
    originalBeat?.setsUp?.length
      ? uniq(originalBeat.setsUp, 6)
      : sourceLabels,

  paysOff:
    isPayoff
      ? [endpoint].filter(Boolean)
      : targetLabels,

  obligations:
    slot.obligations,

  forbiddenMoves:
    slot.forbiddenMoves,

  relationKinds:
    slot.relationKinds,

  relationStrength:
    slot.relationStrength,
};
}

async function generateCandidatePools(
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
  beats: readonly MouthCandidateBeat[],
  lens: string | undefined,
  priorTexts: readonly string[],
  risk: string,
  feedback?: string,
): Promise<{
  pools: MouthCandidatePool[];
  rawText: string;
}> {
  const messages =
    buildMouthCandidateMessages({
      envelope,
      beats,
      priorTexts,
      lens,
    });

  if (
    feedback
  ) {
    const last =
      messages[
        messages.length -
          1
      ];

    if (
      last?.role ===
      "user"
    ) {
      last.content +=
        `\n\nQRE REPAIR FEEDBACK:\n${feedback}`;
    }
  }
   console.log(
    "\n=== QRE CANDIDATE PROMPT DEBUG ===\n" +
      messages
        .map(
          (message) =>
            `[${message.role}]\n${message.content}`,
        )
        .join("\n\n") +
      "\n=== END QRE CANDIDATE PROMPT DEBUG ===\n",
       );
  const result =
    await localModelGenerate(
      messages,
      "json",
      {
        numPredict:
          1536,
        temperature:
          risk ===
          "safe"
            ? 0.55
            : 0.72,
      },
    );

  debug(
    feedback
      ? "MOUTH-CANDIDATE-REPAIR"
      : "MOUTH-CANDIDATE-GENERATION",
    result.text,
  );

  const parsed =
    parseMouthCandidateBatch(
      result.text,
    );

  if (!parsed) {
    return {
      pools: [],
      rawText:
        result.text,
    };
  }

  const pools:
    MouthCandidatePool[] =
    beats.map(
      (beat) => {
        const entry =
          parsed.variantsByBeat.find(
            (item) =>
              item.order ===
              beat.order,
          );

        const candidates =
          (entry?.variants ??
            [])
            .map(
              (text) =>
                scoreMouthCandidate(
                  {
                    text,
                    beat,
                    envelope,
                    priorTexts,
                  },
                ),
            )
            .filter(
              (
                candidate,
              ) =>
                candidate.text.length >
                0,
            )
            .sort(
              (a, b) =>
                b.score -
                a.score,
            );

        return {
          order:
            beat.order,
          candidates,
        };
      },
    );

  return {
    pools,
    rawText:
      result.text,
  };
}

function ensureEndpointCandidate(
  pools: MouthCandidatePool[],
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
  beats: readonly MouthCandidateBeat[],
): void {
  const endpoint =
    endpointLabel(
      envelope,
    );

  if (!endpoint) {
    return;
  }

  const payoffBeat =
    beats.find(
      (beat) =>
        clean(
          beat.role,
        ).toLowerCase() ===
          "payoff" ||
        clean(
          beat.attentionFunction,
        ).toLowerCase() ===
          "payoff",
    );

  if (!payoffBeat) {
    return;
  }

  const pool =
    pools.find(
      (item) =>
        item.order ===
        payoffBeat.order,
    );

  if (!pool) {
    return;
  }

  const existing =
    pool.candidates.some(
      (candidate) =>
        clean(
          candidate.text,
        ).replace(
          /[.!?]+$/g,
          "",
        ).toLowerCase() ===
        endpoint
          .replace(
            /[.!?]+$/g,
            "",
          )
          .toLowerCase(),
    );

  if (existing) {
    return;
  }

  const exact =
    scoreMouthCandidate({
      text:
        endpoint,
      beat:
        payoffBeat,
      envelope,
      priorTexts: [],
    });

  pool.candidates.push(
    exact,
  );

  pool.candidates.sort(
    (a, b) =>
      b.score -
      a.score,
  );
}

async function realizeMouth(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  plan: BeatPlan,
  cognition: ReturnType<
    typeof buildAuthorCognitivePlan
  >,
  truthNotes: TruthNote[],
  risk: string,
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
  spine: MeaningSpine,
): Promise<{
  texts: string[];
  attentionEdit: ReturnType<
    typeof editAttentionSequence
  >;
  attentionRetry: number;
  cutRepair: number;
  candidateRawText: string;
  candidatePools: MouthCandidatePool[];
  beamScore: number;
}> {
  const slotBeats =
    sequence.cuts.map(
      (cut, index) => {
        const beat =
          plan.beats[index];

        return {
          order:
            index + 1,
          role:
            cut.role,
          attentionFunction:
            beat
              ?.attentionFunction,
          creativeMove:
            beat?.creativeMove,
          realizationMode:
            beat
              ?.attentionFunction ??
            cut.gainKind,
          eventIds:
            cut.sourceIds,
          change:
            cut.informationGain,
          next:
            cut.nextPromise,
          frontier:
            cut
              .momentum
              ?.after
              .informationFrontier
              ?.frontier,
          setsUp:
            beat?.setsUp ??
            [],
          paysOff:
            beat?.paysOff ??
            [],
        } satisfies MouthCandidateBeat;
      },
    );

  const slots =
    buildRealizationSlots({
      envelope,
      beats:
        slotBeats,
      spine,
      fast:
        risk === "safe",
    });
   const canonicalBeats =
  slots.map(
    (slot) =>
      candidateBeatFromSlot(
        slot,
        spine,
        envelope,
        slotBeats[slot.order - 1],
      ),
  );
  

  let generated =
    await generateCandidatePools(
      envelope,
      canonicalBeats,
      input.lens,
      [],
      risk,
    );

  ensureEndpointCandidate(
    generated.pools,
    envelope,
    canonicalBeats,
  );

  let beam =
    selectBestMouthSequence(
      generated.pools,
      {
        width: 12,
        candidatesPerBeat: 8,
      },
    );

  let texts =
    beam.texts;

  let attentionEdit =
    editAttentionSequence({
      beats:
        buildAttentionBeatInputs(
          sequence,
          texts,
          plan,
        ),
      evidence: [
        ...input.facts,
        ...input.sourceMoments,
        ...(input.memoryContext ??
          []),
      ],
    });

  let attentionRetry = 0;
  let cutRepair = 0;

  if (
    attentionEdit.rewriteNeeded
  ) {
    attentionRetry = 1;

    const feedback =
      buildAttentionRewritePrompt(
        attentionEdit,
      );

    generated =
      await generateCandidatePools(
        envelope,
        canonicalBeats,
        input.lens,
        [],
        risk,
        feedback,
      );

    ensureEndpointCandidate(
      generated.pools,
      envelope,
      canonicalBeats,
    );

    const retryBeam =
      selectBestMouthSequence(
        generated.pools,
        {
          width: 12,
          candidatesPerBeat: 8,
        },
      );

    const retryTexts =
      retryBeam.texts;

    const retryAttention =
      editAttentionSequence(
        {
          beats:
            buildAttentionBeatInputs(
              sequence,
              retryTexts,
              plan,
            ),
          evidence: [
            ...input.facts,
            ...input.sourceMoments,
            ...(input.memoryContext ??
              []),
          ],
        },
      );

    if (
      retryTexts.length ===
        sequence.cuts.length &&
      (
        retryAttention.accepted ||
        retryAttention.sequenceScore >
          attentionEdit.sequenceScore
      )
    ) {
      texts =
        retryTexts;
      beam =
        retryBeam;
      attentionEdit =
        retryAttention;
    }
  }

  let sequenceResult =
    scenesFromSequence(
      sequence,
      texts,
      input,
      cognition,
    );

  if (
    sequenceResult.rejected > 0 ||
    texts.length !==
      sequence.cuts.length
  ) {
    cutRepair = 1;

    const repairFeedback =
      [
        "The previous candidate sequence failed the final cut gate.",
        "Rewrite only the weak beats.",
        "Preserve the approved semantic trajectory.",
        "Preserve the supplied endpoint exactly.",
        "Do not add concrete facts.",
        "Do not append earlier lines to the endpoint.",
        `Diagnostics: ${JSON.stringify(
          sequenceResult.rejectionReasons,
        )}`,
      ].join(
        "\n",
      );

    generated =
      await generateCandidatePools(
        envelope,
        canonicalBeats,
        input.lens,
        [],
        risk,
        repairFeedback,
      );

    ensureEndpointCandidate(
      generated.pools,
      envelope,
      canonicalBeats,
    );

    const repairBeam =
      selectBestMouthSequence(
        generated.pools,
        {
          width: 16,
          candidatesPerBeat: 8,
        },
      );

    const repairTexts =
      repairBeam.texts;

    const repairAttention =
      editAttentionSequence(
        {
          beats:
            buildAttentionBeatInputs(
              sequence,
              repairTexts,
              plan,
            ),
          evidence: [
            ...input.facts,
            ...input.sourceMoments,
            ...(input.memoryContext ??
              []),
          ],
        },
      );

    const repairResult =
      scenesFromSequence(
        sequence,
        repairTexts,
        input,
        cognition,
      );

    if (
      repairResult.rejected <
        sequenceResult.rejected ||
      (
        repairResult.rejected ===
          0 &&
        repairAttention.accepted
      )
    ) {
      texts =
        repairTexts;
      beam =
        repairBeam;
      attentionEdit =
        repairAttention;
      sequenceResult =
        repairResult;
    }
  }

  return {
    texts,
    attentionEdit,
    attentionRetry,
    cutRepair,
    candidateRawText:
      generated.rawText,
    candidatePools:
      generated.pools,
    beamScore:
      beam.score,
  };
}

function buildFallbackBeatPlan(
  cognition: ReturnType<
    typeof buildAuthorCognitivePlan
  >,
  realityGraph: ReturnType<
    typeof buildAuthorRealityGraph
  >,
): BeatPlan | undefined {
  const selected =
    cognition.latentMovieCandidates?.[0];

  if (!selected) {
    return undefined;
  }

  const recovered =
    recoverBeatPlanFromLatentMovie(
      selected,
      realityGraph,
    );

  return normalizeBeatPlan(
    recovered,
  );
}

function buildBeatMessages(
  input: AuthorBrainTruth,
  cognition: ReturnType<
    typeof buildAuthorCognitivePlan
  >,
): Array<{
  role: "system" | "user";
  content: string;
}> {
  const risk =
    inferRiskDial(
      input,
      cognition,
    );

  const latentMovie =
    cognition
      .latentMovieCandidates?.[0];

  const targetBeats =
    latentMovie
      ? Math.min(
          6,
          Math.max(
            3,
            latentMovie
              .trajectory
              .length,
          ),
        )
      : 4;

  const compactWorld = {
    prompt:
      clean(input.prompt),
    lens:
      clean(input.lens),
    subject:
      clean(input.subject),
    place:
      clean(input.place),
    facts:
      uniq(
        input.facts,
        18,
      ),
    moments:
      uniq(
        input.sourceMoments,
        12,
      ),
    memory:
      uniq(
        input.memoryContext,
        10,
      ),
    trajectory:
      uniq(
        input.trajectory,
        10,
      ),
    realityGraph:
      input.realityGraph
        ? {
            events:
              input
                .realityGraph
                .events
                .slice(
                  0,
                  12,
                )
                .map(
                  (
                    event,
                  ) => ({
                    id:
                      event.id,
                    label:
                      event.label,
                  }),
                ),
            relations:
              input
                .realityGraph
                .relations
                .slice(
                  0,
                  20,
                ),
            tensions:
              input
                .realityGraph
                .unresolvedTensions
                .slice(
                  0,
                  8,
                ),
            recurring:
              input
                .realityGraph
                .recurringSignals
                .slice(
                  0,
                  8,
                ),
            sensory:
              input
                .realityGraph
                .sensorySignals
                .slice(
                  0,
                  8,
                ),
          }
        : null,
    returning:
      Boolean(input.returning),
    visitNumber:
      input.visitNumber,
    cognition: {
      mode:
        cognition.mode,
      chosenAttentionStrategy:
        cognition.chosenAttentionStrategy,
      characterRead:
        cognition.characterRead,
      contradictions:
        cognition.contradictions.slice(
          0,
          8,
        ),
      attentionCandidates:
        cognition.attentionCandidates.slice(
          0,
          6,
        ),
      callbackTargets:
        cognition.callbackTargets.slice(
          0,
          8,
        ),
      latentMovieCandidates:
        cognition.latentMovieCandidates.slice(
          0,
          6,
        ),
      latentMovie:
        latentMovie ??
        null,
      allowedMoves:
        cognition.characterRead
          ?.allowedMoves ??
        [],
      avoidedMoves:
        cognition.characterRead
          ?.avoidedMoves ??
        [],
      creativeFrames:
        cognition.characterRead
          ?.creativeFrames ??
        [],
      statusPosture:
        cognition.characterRead
          ?.statusPosture ??
        "",
      emotionalPosture:
        cognition.characterRead
          ?.emotionalPosture ??
        "",
      objectRelationships:
        cognition.characterRead
          ?.objectRelationships ??
        [],
    },
  };

  const system = [
    "QRE latent-movie director and Beat Graph fallback.",
    "The RealityGraph is immutable source evidence.",
    "If cognition.latentMovie exists, preserve its discovered trajectory and supplied endpoint.",
    "Do not create a different movie.",
    "Do not reorder the supplied endpoint.",
    "Do not create facts.",
    "The opening may establish supplied evidence.",
    "Every later beat must carry an evidence-backed change in interpretation, consequence, status, relationship, expectation, or object meaning.",
    "Supplied concrete events are material, not automatically the destination.",
    "Do not turn the next source fact into meaning merely because it happened next.",
    "Never manufacture a semantic transition unsupported by the evidence graph.",
    "The final beat must earn and land the selected endpoint.",
    "Do not output analyst language.",
    "Do not output planning explanations.",
    "Do not output viewer-directed language.",
    `CREATIVE RISK: ${risk}.`,
    `Fallback target: approximately ${targetBeats} beats.`,
    "Return JSON only:",
    "{premise:string,baselineFacts:string[],attentionArc:string,beats:[{role,gainKind,change,next,frontier,necessity,attentionFunction,setsUp:string[],paysOff:string[],creativeMove,nextBeatPullTarget:number}]}",
  ].join(
    "\n",
  );

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
        JSON.stringify(
          compactWorld,
        ),
    },
  ];
}

export async function authorBrainUniversal(
  input: AuthorBrainTruth,
): Promise<{
  brief: AuthorCreativeBrief;
  scenes: AuthorScene[];
  sequence?: SequencePlay;
  field: Record<
    string,
    unknown
  >;
  diagnostics: Record<
    string,
    unknown
  >;
}> {
  const subject =
    clean(
      input.subject,
    ) ||
    "the subject";

  const realityGraph =
    input.realityGraph ??
    buildAuthorRealityGraph({
      prompt:
        clean(input.prompt),
      subject,
      place:
        clean(input.place),
      facts: [
        ...input.facts,
      ],
      sourceMoments: [
        ...input.sourceMoments,
      ],
      memoryContext: [
        ...(input
          .memoryContext ??
          []),
      ],
      trajectory: [
        ...(input
          .trajectory ??
          []),
      ],
    });

  const realityEnvelope =
    buildAuthorRealityEnvelope({
      graph:
        realityGraph,
      subject,
    });

  const cognition =
    buildAuthorCognitivePlan({
      prompt:
        clean(input.prompt),
      lens:
        clean(input.lens),
      subject,
      place:
        clean(input.place),
      facts: [
        ...input.facts,
      ],
      sourceMoments: [
        ...input.sourceMoments,
      ],
      memoryContext: [
        ...(input
          .memoryContext ??
          []),
      ],
      priorScenes: [
        ...(input
          .trajectory ??
          []),
      ],
      priorStrategies: [
        ...(input
          .creativeLearningContext ??
          []),
      ],
      round:
        Math.max(
          1,
          input
            .trajectory
            ?.length
            ? 2
            : 1,
        ),
      realityGraph,
    });

  const risk =
    inferRiskDial(
      input,
      cognition,
    );

  const field:
    Record<
      string,
      unknown
    > = {
      subjectTruth:
        input.subjectTruth ??
        null,
      realityGraph,
      realityEnvelope,
      facts:
        uniq(
          input.facts,
          24,
        ),
      moments:
        uniq(
          input.sourceMoments,
          18,
        ),
      memory:
        uniq(
          input.memoryContext,
          14,
        ),
      trajectory:
        uniq(
          input.trajectory,
          14,
        ),
      learning:
        uniq(
          input.creativeLearningContext,
          20,
        ),
      prompt:
        clean(input.prompt),
      lens:
        clean(input.lens),
      cognition: {
        mode:
          cognition.mode,
        chosenAttentionStrategy:
          cognition.chosenAttentionStrategy,
        characterRead:
          cognition.characterRead,
        attentionCandidates:
          cognition.attentionCandidates,
        contradictions:
          cognition.contradictions,
        operatorMix:
          cognition.operatorMix,
        callbackTargets:
          cognition.callbackTargets,
        sceneRules:
          cognition.sceneRules,
      },
      creativeRisk:
        risk,
    };

  let beatPlan =
    buildFallbackBeatPlan(
      cognition,
      realityGraph,
    );

  let beatPlanRetries =
    0;

  if (beatPlan) {
    beatPlan =
      enforceBeatMeaningContinuity(
        beatPlan,
        {
          ...input,
          realityGraph,
        },
      );
  }

  if (!beatPlan) {
    const beatMessages =
      buildBeatMessages(
        {
          ...input,
          realityGraph,
        },
        cognition,
      );

    let result =
      await localModelGenerate(
        beatMessages,
        "json",
        {
          numPredict:
            1536,
          temperature:
            risk ===
            "safe"
              ? 0.55
              : 0.74,
        },
      );

    debug(
      "BEAT-DISCOVERY-FALLBACK",
      result.text,
    );

    beatPlan =
      normalizeBeatPlan(
        parseJson<unknown>(
          result.text,
        ),
      );

    if (beatPlan) {
      beatPlan =
        enforceBeatMeaningContinuity(
          beatPlan,
          {
            ...input,
            realityGraph,
          },
        );
    }

    if (!beatPlan) {
      beatPlanRetries =
        1;

      result =
        await localModelGenerate(
          [
            beatMessages[0],
            {
              role:
                "user",
              content:
                `${beatMessages[1].content}\n` +
                "Return ONLY JSON. Preserve the selected latent movie if present. Preserve its endpoint. Every beat must correspond to supplied evidence or an evidence-backed semantic transition.",
            },
          ],
          "json",
          {
            numPredict:
              1536,
            temperature:
              0.45,
          },
        );

      debug(
        "BEAT-DISCOVERY-FALLBACK-RETRY",
        result.text,
      );

      beatPlan =
        normalizeBeatPlan(
          parseJson<unknown>(
            result.text,
          ),
        );

      if (beatPlan) {
        beatPlan =
          enforceBeatMeaningContinuity(
            beatPlan,
            {
              ...input,
              realityGraph,
            },
          );
      }
    }
  }

  if (!beatPlan) {
    return {
      brief:
        brief(
          input,
          cognition.chosenAttentionStrategy,
        ),
      scenes: [],
      sequence:
        undefined,
      field,
      diagnostics: {
        cognitionMode:
          cognition.mode,
        characterRead:
          cognition.characterRead,
        chosenAttentionStrategy:
          cognition.chosenAttentionStrategy,
        creativeRisk:
          risk,
        realityGraphEvents:
          realityGraph.events.length,
        realityGraphRelations:
          realityGraph.relations.length,
        realityGraphTensions:
          realityGraph.unresolvedTensions,
        beatCount:
          0,
        beatPlan: [],
        beatPlanRetries,
        beatPlanParseFailed:
          true,
        beatPlanRecovered:
          false,
        sequenceCutsAttempted:
          0,
        sequenceCutsRejected:
          0,
        finalScenes:
          0,
      },
    };
  }

  const sequence =
    buildViewerMomentum(
      subject,
      beatPlan,
    );

  if (!sequence) {
    return {
      brief:
        brief(
          input,
          cognition.chosenAttentionStrategy,
        ),
      scenes: [],
      sequence:
        undefined,
      field,
      diagnostics: {
        cognitionMode:
          cognition.mode,
        characterRead:
          cognition.characterRead,
        chosenAttentionStrategy:
          cognition.chosenAttentionStrategy,
        creativeRisk:
          risk,
        beatCount:
          0,
        beatPlanRetries,
        finalScenes:
          0,
      },
    };
  }

  const spine =
    buildMeaningSpine({
      envelope:
        realityEnvelope,
      premise:
        beatPlan.premise,
      beats:
        sequence.cuts.map(
          (
            cut,
            index,
          ) => {
            const beat =
              beatPlan.beats[
                index
              ];

            return {
              order:
                index + 1,
              role:
                cut.role,
              attentionFunction:
                beat
                  ?.attentionFunction,
              creativeMove:
                beat
                  ?.creativeMove,
              realizationMode:
                beat
                  ?.attentionFunction ??
                cut.gainKind,
              eventIds:
                cut.sourceIds,
              change:
                cut.informationGain,
              next:
                cut.nextPromise,
              frontier:
                cut
                  .momentum
                  ?.after
                  .informationFrontier
                  ?.frontier,
              setsUp:
                beat?.setsUp ??
                [],
              paysOff:
                beat?.paysOff ??
                [],
            };
          },
        ),
    });

  const truthNotes =
    await buildTruthNotes(
      {
        ...input,
        realityGraph,
      },
      beatPlan,
    );

  debug(
    "BEAT-TRUTH-GATE",
    JSON.stringify(
      truthNotes,
    ),
  );

  const mouth =
    await realizeMouth(
      {
        ...input,
        realityGraph,
      },
      sequence,
      beatPlan,
      cognition,
      truthNotes,
      risk,
      realityEnvelope,
      spine,
    );

  const sequenceResult =
    scenesFromSequence(
      sequence,
      mouth.texts,
      {
        ...input,
        realityGraph,
      },
      cognition,
    );

  const sequenceArcBeats:
    SequenceArcBeat[] =
    sequence.cuts.map(
      (
        cut,
        index,
      ) => {
        const beat =
          beatPlan.beats[
            index
          ];

        return {
          order:
            index + 1,
          role:
            cut.role,
          attentionFunction:
            beat
              ?.attentionFunction,
          creativeMove:
            beat
              ?.creativeMove,
          text:
            mouth
              .texts[
                index
              ] ?? "",
          change:
            cut.informationGain,
          next:
            cut.nextPromise,
          frontier:
            cut
              .momentum
              ?.after
              .informationFrontier
              ?.frontier,
          setsUp:
            beat?.setsUp ??
            [],
          paysOff:
            beat?.paysOff ??
            [],
        };
      },
    );

  const sequenceArc =
    evaluateSequenceArc(
      sequenceArcBeats,
    );

  const magnetValues =
    sequence.cuts
      .map(
        (cut) =>
          cut.momentum
            ?.after
            .magnet
            ?.magnetStrength ??
          0,
      )
      .filter(
        Number.isFinite,
      );

  const magnetAverage =
    magnetValues.length
      ? magnetValues.reduce(
          (a, b) =>
            a + b,
          0,
        ) /
        magnetValues.length
      : 0;

  const magnetPeak =
    magnetValues.length
      ? Math.max(
          ...magnetValues,
        )
      : 0;

  const magnetFloor =
    magnetValues.length
      ? Math.min(
          ...magnetValues,
        )
      : 0;

  const endpoint =
    endpointLabel(
      realityEnvelope,
    );

  const finalText =
    mouth.texts[
      mouth.texts.length -
        1
    ] ?? "";

  const endpointExact =
    endpoint
      ? clean(
          finalText,
        )
          .replace(
            /[.!?]+$/g,
            "",
          )
          .toLowerCase() ===
        endpoint
          .replace(
            /[.!?]+$/g,
            "",
          )
          .toLowerCase()
      : true;

  const complete =
    sequenceResult.rejected ===
      0 &&
    mouth.texts.length ===
      sequence.cuts.length &&
    sequenceResult.scenes.length ===
      sequence.cuts.length &&
    sequenceArc.accepted &&
    endpointExact;

  return {
    brief:
      brief(
        input,
        cognition.chosenAttentionStrategy,
      ),
    scenes:
      complete
        ? sequenceResult.scenes
        : [],
    sequence,
    field,
    diagnostics: {
      cognitionMode:
        cognition.mode,
      characterRead:
        cognition.characterRead,
      chosenAttentionStrategy:
        cognition.chosenAttentionStrategy,
      attentionCandidates:
        cognition.attentionCandidates,
      contradictions:
        cognition.contradictions,
      operatorMix:
        cognition.operatorMix,
      creativeRisk:
        risk,
      realityGraphEvents:
        realityGraph.events.length,
      realityGraphRelations:
        realityGraph.relations.length,
      realityGraphTensions:
        realityGraph.unresolvedTensions,
      realityGraphRecurring:
        realityGraph.recurringSignals,
      realityGraphSensory:
        realityGraph.sensorySignals,
      realityEnvelope,
      meaningSpine:
        spine,
      realizationSlots:
        buildRealizationSlots({
          envelope:
            realityEnvelope,
          beats:
            sequence.cuts.map(
              (
                cut,
                index,
              ) => {
                const beat =
                  beatPlan.beats[
                    index
                  ];

                return {
                  order:
                    index + 1,
                  role:
                    cut.role,
                  attentionFunction:
                    beat
                      ?.attentionFunction,
                  creativeMove:
                    beat
                      ?.creativeMove,
                  realizationMode:
                    beat
                      ?.attentionFunction ??
                    cut.gainKind,
                  eventIds:
                    cut.sourceIds,
                  change:
                    cut.informationGain,
                  next:
                    cut.nextPromise,
                  frontier:
                    cut
                      .momentum
                      ?.after
                      .informationFrontier
                      ?.frontier,
                  setsUp:
                    beat?.setsUp ??
                    [],
                  paysOff:
                    beat?.paysOff ??
                    [],
                };
              },
            ),
          spine,
          fast:
            risk ===
            "safe",
        }),
      beatCount:
        beatPlan.beats.length,
      beatPlan:
        beatPlan.beats,
      attentionArc:
        beatPlan.attentionArc,
      beatPlanRetries,
      beatPlanParseFailed:
        false,
      beatPlanRecovered:
        Boolean(
          cognition
            .latentMovieCandidates
            ?.length,
        ),
      truthNotes,
      candidatePools:
        mouth.candidatePools,
      candidateRawText:
        mouth.candidateRawText,
      beamScore:
        mouth.beamScore,
      sequenceCutsAttempted:
        sequenceResult.attempted,
      sequenceCutsRejected:
        sequenceResult.rejected,
      rejectionReasons:
        sequenceResult.rejectionReasons,
      realizationTexts:
        mouth.texts,
      realizationCountMismatch:
        mouth.texts.length !==
        sequence.cuts.length,
      attentionEditor:
        mouth.attentionEdit,
      sequenceArc,
      attentionRetry:
        mouth.attentionRetry,
      cutRepair:
        mouth.cutRepair,
      endpoint,
      endpointExact,
      finalScenes:
        complete
          ? sequenceResult.scenes.length
          : 0,
      complete,
      magnetAverage:
        metric(
          magnetAverage,
        ),
      magnetPeak:
        metric(
          magnetPeak,
        ),
      magnetFloor:
        metric(
          magnetFloor,
        ),
      magnetCutsMeasured:
        magnetValues.length,
      subjectSpaceEstablished:
        Boolean(
          sequence
            .closingMomentum
            ?.subjectContinuity
            ?.established,
        ),
      informationFrontier:
        sequence
          .closingMomentum
          ?.informationFrontier
          ?.frontier ??
        "",
    },
  };
}