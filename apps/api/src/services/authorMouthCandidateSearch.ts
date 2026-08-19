/**
 * QRE AUTHORMOUTHCANDIDATESEARCH.TS Ã‚Â· CANONICAL SEMANTIC GATE
 *
 * The Mouth receives an approved Meaning Spine / Realization Slot and
 * generates language candidates.
 *
 * QRE then decides:
 *
 *   grounding
 *   + semantic execution
 *   + transition execution
 *   + obligation execution
 *   + relation execution
 *   + sequence continuity
 *   + compression
 *   + novelty
 *   + endpoint exactness
 *   - invention
 *   - repetition
 *   - source-anchor collage
 *   - forbidden realization moves
 *
 * The model does NOT choose meaning.
 * The model does NOT choose the movie.
 * The model does NOT choose the endpoint.
 *
 * It only proposes language.
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

const STOP = new Set(
  [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "for",
    "to",
    "of",
    "in",
    "on",
    "at",
    "with",
    "from",
    "this",
    "that",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "as",
    "into",
    "by",
    "through",
    "after",
    "before",
    "then",
    "now",
    "very",
    "just",
    "still",
    "again",
    "his",
    "her",
    "their",
    "its",
    "it's",
    "he",
    "she",
    "they",
    "them",
    "you",
    "we",
    "me",
    "my",
    "our",
    "your",
    "what",
    "when",
    "where",
    "why",
    "how",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ],
);

const INTERPRETIVE = new Set(
  [
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
  ],
);

const GENERIC_FILLER =
  /\b(?:beautiful|magical|unforgettable|incredible|journey|special|meaningful|cinematic|perfect day|new chapter|happy ending|what a day)\b/i;

const QUESTION = /\?/;

const META =
  /\b(?:beat|viewer|audience|strategy|operator|cognition|frontier|planner|planning|narrative|realization|writing process|author brief)\b/i;

const REALIZATION_META =
  /\b(?:contrast(?:s|ed)?|conclusion|concludes|completes?|highlight(?:s|ed)?|demeanor|appearance|transforms?|transformation|reframe|reframing|changes? the meaning|shows? the contrast|explains?)\b/i;

const MULTI_SIGNAL_MODE =
  /\b(?:contrast|contrasts|changes|reframe|recontextualize|recontextualization|turn|callback|reversal|consequence|escalat(?:e|ion))\b/i;

const clean = (
  value: unknown,
): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (
  value: number,
): number =>
  Number(
    Math.max(
      0,
      Math.min(1, value),
    ).toFixed(3),
  );

function unique(
  values: readonly string[],
): string[] {
  return [
    ...new Set(
      values
        .map(clean)
        .filter(Boolean),
    ),
  ];
}

function tokens(
  text: string,
): string[] {
  return unique(
    clean(text)
      .toLowerCase()
      .split(
        /[^a-z0-9'-]+/i,
      )
      .filter(
        (token) =>
          token.length >= 3,
      ),
  );
}

function stem(
  token: string,
): string {
  const value =
    token.toLowerCase();

  if (
    value.length > 6 &&
    value.endsWith("ing")
  ) {
    return value.slice(
      0,
      -3,
    );
  }

  if (
    value.length > 5 &&
    value.endsWith("ed")
  ) {
    return value.slice(
      0,
      -2,
    );
  }

  if (
    value.length > 5 &&
    value.endsWith("es")
  ) {
    return value.slice(
      0,
      -2,
    );
  }

  if (
    value.length > 4 &&
    value.endsWith("s")
  ) {
    return value.slice(
      0,
      -1,
    );
  }

  return value;
}

function tokenSet(
  text: string,
): Set<string> {
  return new Set(
    tokens(text).map(stem),
  );
}

function overlap(
  left: Set<string>,
  right: Set<string>,
): number {
  if (
    !left.size ||
    !right.size
  ) {
    return 0;
  }

  let hits = 0;

  for (const token of left) {
    if (
      right.has(token)
    ) {
      hits += 1;
    }
  }

  return (
    hits /
    Math.max(
      1,
      left.size,
    )
  );
}

function phraseSimilarity(
  text: string,
  phrase: string,
): number {
  return metric(
    overlap(
      tokenSet(text),
      tokenSet(phrase),
    ),
  );
}

function suppliedTerms(
  envelope: RealityEnvelope,
): Set<string> {
  return new Set(
    envelope.suppliedTerms.map(
      stem,
    ),
  );
}

function supportedEventIds(
  text: string,
  envelope: RealityEnvelope,
): string[] {
  return envelope.events
    .filter(
      (event) =>
        phraseSimilarity(
          text,
          event.label,
        ) >= 0.34,
    )
    .map(
      (event) =>
        event.id,
    );
}

function relationKey(
  from: string,
  to: string,
): string {
  return `${from}->${to}`;
}

function supportedRelationPairs(
  eventIds: readonly string[],
  envelope: RealityEnvelope,
): string[] {
  const ids =
    new Set(eventIds);

  return envelope.relations
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
        relationKey(
          relation.from,
          relation.to,
        ),
    );
}

function groundingScore(
  text: string,
  envelope: RealityEnvelope,
): number {
  const source =
    suppliedTerms(
      envelope,
    );

  const sourceOverlap =
    overlap(
      tokenSet(text),
      source,
    );

  const phraseSupport =
    envelope.events.length
      ? Math.max(
          ...envelope.events.map(
            (event) =>
              phraseSimilarity(
                text,
                event.label,
              ),
          ),
        )
      : 0;

  const relationSupport =
    supportedRelationPairs(
      supportedEventIds(
        text,
        envelope,
      ),
      envelope,
    ).length > 0
      ? 1
      : 0;

  return metric(
    sourceOverlap * 0.45 +
      phraseSupport * 0.4 +
      relationSupport * 0.15,
  );
}

function concreteTokenRisk(
  text: string,
  envelope: RealityEnvelope,
): number {
  const source =
    suppliedTerms(
      envelope,
    );

  const words =
    tokens(text);

  if (!words.length) {
    return 1;
  }

  let unsupported = 0;

  for (const word of words) {
    const normalized =
      stem(word);

    if (
      STOP.has(normalized) ||
      INTERPRETIVE.has(
        normalized,
      )
    ) {
      continue;
    }

    if (
      !source.has(
        normalized,
      )
    ) {
      unsupported += 1;
    }
  }

  return metric(
    unsupported /
      Math.max(
        1,
        words.length,
      ),
  );
}

function requiredEventCoverage(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const required =
    unique(
      beat.eventIds ?? [],
    );

  if (!required.length) {
    return 0.5;
  }

  const supported =
    new Set(
      supportedEventIds(
        text,
        envelope,
      ),
    );

  const hits =
    required.filter(
      (id) =>
        supported.has(id),
    ).length;

  return metric(
    hits /
      Math.max(
        1,
        required.length,
      ),
  );
}

function isPayoffBeat(
  beat: MouthCandidateBeat,
): boolean {
  const mode =
    clean(
      beat.realizationMode,
    ).toLowerCase();

  const role =
    clean(
      beat.role,
    ).toLowerCase();

  const attention =
    clean(
      beat.attentionFunction,
    ).toLowerCase();

  return (
    mode.includes("payoff") ||
    role === "payoff" ||
    attention === "payoff"
  );
}

function endpointText(
  beat: MouthCandidateBeat,
): string {
  const targets =
    unique(
      beat.paysOff ?? [],
    );

  return (
    targets[0] ??
    ""
  );
}

function endpointExactness(
  text: string,
  beat: MouthCandidateBeat,
): number {
  if (
    !isPayoffBeat(
      beat,
    )
  ) {
    return 0;
  }

  const endpoint =
    endpointText(
      beat,
    );

  if (!endpoint) {
    return 0;
  }

  const actual =
    clean(text)
      .replace(
        /[.!?]+$/g,
        "",
      )
      .toLowerCase();

  const expected =
    clean(endpoint)
      .replace(
        /[.!?]+$/g,
        "",
      )
      .toLowerCase();

  return actual === expected
    ? 1
    : 0;
}

function semanticMode(
  beat: MouthCandidateBeat,
): string {
  return clean(
    [
      beat.realizationMode,
      beat.creativeMove,
      beat.attentionFunction,
      beat.role,
      ...(beat.relationKinds ?? []),
    ].join(" "),
  ).toLowerCase();
}

function hasSemanticSignal(
  beat: MouthCandidateBeat,
): boolean {
  return MULTI_SIGNAL_MODE.test(
    semanticMode(
      beat,
    ),
  );
}

function relationMeaningScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const eventIds =
    supportedEventIds(
      text,
      envelope,
    );

  const beatEventIds =
    unique(
      beat.eventIds ?? [],
    );

  const direct =
    requiredEventCoverage(
      text,
      beat,
      envelope,
    );

  const relationCount =
    supportedRelationPairs(
      eventIds,
      envelope,
    ).length;

  const multiSignal =
    hasSemanticSignal(
      beat,
    );

  const requiredSignalCount =
    multiSignal
      ? Math.min(
          2,
          Math.max(
            1,
            beatEventIds.length,
          ),
        )
      : 1;

  const supportedSignals =
    beatEventIds.filter(
      (id) =>
        eventIds.includes(id),
    ).length;

  const signalCoverage =
    metric(
      supportedSignals /
        requiredSignalCount,
    );

  const relationalBonus =
    multiSignal
      ? Math.min(
          1,
          relationCount / 2,
        )
      : Math.min(
          1,
          relationCount / 3,
        );

  return metric(
    direct * 0.35 +
      signalCoverage * 0.35 +
      relationalBonus * 0.3,
  );
}

function semanticTransitionScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  if (
    isPayoffBeat(
      beat,
    )
  ) {
    return endpointExactness(
      text,
      beat,
    );
  }

  const change =
    clean(
      beat.change,
    );

  const next =
    clean(
      beat.next ||
        beat.frontier,
    );

  const eventIds =
    supportedEventIds(
      text,
      envelope,
    );

  const relationCount =
    supportedRelationPairs(
      eventIds,
      envelope,
    ).length;

  const changeSimilarity =
    change
      ? phraseSimilarity(
          text,
          change,
        )
      : 0;

  const nextSimilarity =
    next
      ? phraseSimilarity(
          text,
          next,
        )
      : 0;

  const multiSignal =
    hasSemanticSignal(
      beat,
    );

  const relationScore =
    multiSignal
      ? Math.min(
          1,
          relationCount / 2,
        )
      : Math.min(
          1,
          relationCount / 3,
        );

  const sourceEchoPenalty =
    beat.eventIds?.length &&
    beat.eventIds.some(
      (id) => {
        const event =
          envelope.events.find(
            (candidate) =>
              candidate.id === id,
          );

        return Boolean(
          event &&
          phraseSimilarity(
            text,
            event.label,
          ) >= 0.92,
        );
      },
    )
      ? 0.35
      : 0;

  return metric(
    relationScore * 0.42 +
      changeSimilarity * 0.28 +
      nextSimilarity * 0.2 +
      0.1 -
      sourceEchoPenalty,
  );
}

function anchorCollageRisk(
  beat: MouthCandidateBeat,
  text: string,
  envelope: RealityEnvelope,
): number {
  if (
    !hasSemanticSignal(
      beat,
    )
  ) {
    return 0;
  }

  const requiredIds =
    unique(
      beat.eventIds ?? [],
    );

  if (
    requiredIds.length < 2
  ) {
    return 0;
  }

  const anchorVocabulary =
    new Set<string>();

  for (
    const event of envelope.events
  ) {
    if (
      !requiredIds.includes(
        event.id,
      )
    ) {
      continue;
    }

    for (
      const token of tokens(
        event.label,
      )
    ) {
      const normalized =
        stem(token);

      if (
        !STOP.has(
          normalized,
        ) &&
        !INTERPRETIVE.has(
          normalized,
        )
      ) {
        anchorVocabulary.add(
          normalized,
        );
      }
    }
  }

  const substantive =
    tokens(text)
      .map(stem)
      .filter(
        (token) =>
          !STOP.has(
            token,
          ) &&
          !INTERPRETIVE.has(
            token,
          ),
      );

  if (
    !substantive.length
  ) {
    return 0.9;
  }

  const outsideAnchor =
    substantive.filter(
      (token) =>
        !anchorVocabulary.has(
          token,
        ),
    );

  return outsideAnchor.length === 0
    ? 0.9
    : 0;
}

function sourceRestatementRisk(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  if (
    isPayoffBeat(
      beat,
    )
  ) {
    return 0;
  }

  const requiredIds =
    unique(
      beat.eventIds ?? [],
    );

  if (
    !requiredIds.length
  ) {
    return 0;
  }

  const strongest =
    Math.max(
      ...requiredIds.map(
        (id) => {
          const event =
            envelope.events.find(
              (candidate) =>
                candidate.id === id,
            );

          return event
            ? phraseSimilarity(
                text,
                event.label,
              )
            : 0;
        },
      ),
    );

  return strongest >= 0.92
    ? 0.8
    : strongest >= 0.82
      ? 0.45
      : 0;
}

function cohesionScore(
  text: string,
  priorTexts: readonly string[],
): number {
  if (
    !priorTexts.length
  ) {
    return 0.5;
  }

  return metric(
    overlap(
      tokenSet(text),
      tokenSet(
        priorTexts.join(" "),
      ),
    ),
  );
}

function repetitionRisk(
  text: string,
  priorTexts: readonly string[],
): number {
  if (
    !priorTexts.length
  ) {
    return 0;
  }

  return Math.max(
    ...priorTexts.map(
      (prior) =>
        phraseSimilarity(
          text,
          prior,
        ),
    ),
  );
}

function noveltyScore(
  text: string,
  priorTexts: readonly string[],
): number {
  return metric(
    1 -
      repetitionRisk(
        text,
        priorTexts,
      ),
  );
}

function compressionScore(
  text: string,
): number {
  const count =
    tokens(text).length;

  if (!count) {
    return 0;
  }

  if (count <= 4) {
    return 1;
  }

  if (count <= 7) {
    return 0.86;
  }

  if (count <= 10) {
    return 0.45;
  }

  return 0;
}

function inventionRisk(
  text: string,
  envelope: RealityEnvelope,
): number {
  const concreteRisk =
    concreteTokenRisk(
      text,
      envelope,
    );

  return Math.max(
    concreteRisk,
    GENERIC_FILLER.test(text)
      ? 0.8
      : 0,
    META.test(text)
      ? 0.8
      : 0,
    REALIZATION_META.test(text)
      ? 0.7
      : 0,
  );
}

function forbiddenMoveRisk(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const forbidden =
    (beat.forbiddenMoves ?? [])
      .map(clean)
      .filter(Boolean);

  if (!forbidden.length) {
    return 0;
  }

  const lower =
    clean(text).toLowerCase();

  const source =
    suppliedTerms(envelope);

  const riskyPatterns: Record<
    string,
    RegExp
  > = {
    "new person":
      /\b(?:someone|man|woman|groomer|owner|technician|stranger|person)\b/i,

    "new object":
      /\b(?:table|door|window|chair|car|leash|scissors|phone|bag)\b/i,

    "new location":
      /\b(?:street|park|room|kitchen|salon|store|office|outside|inside)\b/i,

    "new concrete action":
      /\b(?:walked|ran|jumped|grabbed|threw|opened|closed|smiled|laughed|cried)\b/i,

    "new body reaction":
      /\b(?:trembled|blinked|sighed|stared|shrugged|winked|flinched)\b/i,

    "new dialogue":
      /["Ã¢â‚¬Å“Ã¢â‚¬Â]/i,

    "new sound":
      /\b(?:bang|buzz|ring|whistle|bark|laugh|scream)\b/i,

    "new outcome":
      /\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived)\b/i,

    "new chronology":
      /\b(?:later|earlier|tomorrow|yesterday|the next day|years later)\b/i,

    "planner vocabulary":
      /\b(?:beat|viewer|audience|strategy|planner|frontier|cognition|realization)\b/i,

    "analytic explanation":
      /\b(?:this means|reveals that|symbolizes|represents|in other words)\b/i,

    "naming the operation instead of performing it":
      REALIZATION_META,

    "source-keyword collage":
      /^(?:\S+\s*(?:;|,)\s*){2,}\S+$/i,
  };

  let highestRisk = 0;

  for (
    const rule of forbidden
  ) {
    const pattern =
      riskyPatterns[rule];

    if (!pattern) {
      continue;
    }

    const match =
      lower.match(pattern);

    if (!match) {
      continue;
    }

    if (
      rule ===
        "planner vocabulary" ||
      rule ===
        "analytic explanation" ||
      rule ===
        "naming the operation instead of performing it" ||
      rule ===
        "source-keyword collage"
    ) {
      highestRisk =
        Math.max(
          highestRisk,
          1,
        );
      continue;
    }

    if (
      rule ===
      "new dialogue"
    ) {
      highestRisk =
        Math.max(
          highestRisk,
          1,
        );
      continue;
    }

    /*
     * For concrete forbidden moves, permit vocabulary already established by
     * the RealityEnvelope. Unsupported concrete language remains forbidden.
     */
    const matchedTokens =
      tokens(
        match[0],
      )
        .map(stem)
        .filter(
          (token) =>
            !STOP.has(
              token,
            ) &&
            !INTERPRETIVE.has(
              token,
            ),
        );

    const unsupported =
      matchedTokens.filter(
        (token) =>
          !source.has(
            token,
          ),
      );

    if (
      unsupported.length > 0
    ) {
      highestRisk =
        Math.max(
          highestRisk,
          1,
        );
    }
  }

  return metric(
    highestRisk,
  );
}

/**
 * Obligations are internal semantic instructions.
 *
 * They are NOT phrases the model should literally repeat.
 * We therefore evaluate whether the candidate performs the contract through
 * evidence coverage, semantic transition, relation execution, and forward
 * movement.
 */
function obligationCoverage(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const obligations =
    (beat.obligations ?? [])
      .map(clean)
      .filter(Boolean);

  if (
    !obligations.length
  ) {
    return 0.5;
  }

  const evidenceCoverage =
    requiredEventCoverage(
      text,
      beat,
      envelope,
    );

  const transition =
    semanticTransitionScore(
      text,
      beat,
      envelope,
    );

  const relation =
    relationContractScore(
      text,
      beat,
      envelope,
    );

  const next =
    clean(
      beat.next ||
        beat.frontier,
    );

  const forwardExecution =
    next
      ? phraseSimilarity(
          text,
          next,
        )
      : 0.5;

  const semanticMode =
    hasSemanticSignal(
      beat,
    );

  if (
    semanticMode
  ) {
    return metric(
      evidenceCoverage * 0.2 +
        transition * 0.4 +
        relation * 0.25 +
        forwardExecution * 0.15,
    );
  }

  return metric(
    evidenceCoverage * 0.4 +
      transition * 0.3 +
      relation * 0.15 +
      forwardExecution * 0.15,
  );
}

function relationContractScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const expectedKinds =
    new Set<string>(
      (beat.relationKinds ?? [])
        .map(clean)
        .filter(Boolean),
    );

  if (
    !expectedKinds.size
  ) {
    return 0.5;
  }

  const supportedIds =
    supportedEventIds(
      text,
      envelope,
    );

  const actualKinds =
    new Set<string>(
      envelope.relations
        .filter(
          (relation) =>
            supportedIds.includes(
              relation.from,
            ) &&
            supportedIds.includes(
              relation.to,
            ),
        )
        .map(
          (relation) =>
            relation.kind,
        ),
    );

  let hits = 0;

  for (
    const kind of expectedKinds
  ) {
    if (
      actualKinds.has(
        kind,
      )
    ) {
      hits += 1;
    }
  }

  const kindCoverage =
    metric(
      hits /
        Math.max(
          1,
          expectedKinds.size,
        ),
    );

  const expectedStrength =
    Number.isFinite(
      beat.relationStrength,
    )
      ? beat.relationStrength ?? 0
      : 0;

  if (
    !expectedStrength ||
    !hits
  ) {
    return kindCoverage;
  }

  const strongestActual =
    envelope.relations
      .filter(
        (relation) =>
          actualKinds.has(
            relation.kind,
          ) &&
          supportedIds.includes(
            relation.from,
          ) &&
          supportedIds.includes(
            relation.to,
          ),
      )
      .reduce(
        (
          strongest,
          relation,
        ) =>
          Math.max(
            strongest,
            relation.strength,
          ),
        0,
      );

  const strengthFit =
    metric(
      Math.min(
        1,
        strongestActual /
          Math.max(
            0.01,
            expectedStrength,
          ),
      ),
    );

  return metric(
    kindCoverage * 0.7 +
      strengthFit * 0.3,
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
  const text =
    clean(input.text);

  const priorTexts =
    input.priorTexts ?? [];

  const eventIds =
    supportedEventIds(
      text,
      input.envelope,
    );

  const relations =
    supportedRelationPairs(
      eventIds,
      input.envelope,
    );

  const grounding =
    groundingScore(
      text,
      input.envelope,
    );

  const endpoint =
    endpointExactness(
      text,
      input.beat,
    );

  const meaning =
    relationMeaningScore(
      text,
      input.beat,
      input.envelope,
    );

  const transition =
    semanticTransitionScore(
      text,
      input.beat,
      input.envelope,
    );

  const contract =
    obligationCoverage(
      text,
      input.beat,
      input.envelope,
    );

  const relationContract =
    relationContractScore(
      text,
      input.beat,
      input.envelope,
    );

  const forbiddenRisk =
    forbiddenMoveRisk(
      text,
      input.beat,
      input.envelope,
    );

  const collage =
    anchorCollageRisk(
      input.beat,
      text,
      input.envelope,
    );

  const restatement =
    sourceRestatementRisk(
      text,
      input.beat,
      input.envelope,
    );

  const invented =
    inventionRisk(
      text,
      input.envelope,
    );

  const operationLanguage =
    REALIZATION_META.test(
      text,
    );

  const cohesion =
    cohesionScore(
      text,
      priorTexts,
    );

  const repetition =
    repetitionRisk(
      text,
      priorTexts,
    );

  const novelty =
    noveltyScore(
      text,
      priorTexts,
    );

  const compression =
    compressionScore(
      text,
    );

  const payoff =
    isPayoffBeat(
      input.beat,
    );

  const payoffViolation =
    payoff &&
    endpoint !== 1
      ? 1
      : 0;

  const questionPenalty =
    QUESTION.test(text)
      ? 0.5
      : 0;

  const score =
    payoff
      ? metric(
          endpoint * 0.82 +
            grounding * 0.06 +
            contract * 0.04 +
            relationContract *
              0.03 +
            compression * 0.05 +
            novelty * 0.05 -
            invented * 0.4 -
            forbiddenRisk * 0.5 -
            payoffViolation * 1,
        )
      : metric(
          grounding * 0.16 +
            meaning * 0.18 +
            transition * 0.24 +
            contract * 0.14 +
            relationContract *
              0.1 +
            cohesion * 0.06 +
            novelty * 0.06 +
            compression * 0.06 -
            invented * 0.22 -
            forbiddenRisk * 0.24 -
            collage * 0.16 -
            restatement * 0.16 -
            repetition * 0.08 -
            questionPenalty * 0.1,
        );

  const reasons: string[] =
    [];

  if (
    grounding < 0.42
  ) {
    reasons.push(
      "weak-grounding",
    );
  }

  if (
    meaning < 0.4
  ) {
    reasons.push(
      "weak-meaning-execution",
    );
  }

  if (
    transition < 0.4
  ) {
    reasons.push(
      "weak-meaning-transition",
    );
  }

  if (
    contract < 0.4
  ) {
    reasons.push(
      "weak-obligation-coverage",
    );
  }

  if (
    relationContract < 0.4
  ) {
    reasons.push(
      "weak-relation-contract",
    );
  }

  if (
    invented > 0.45
  ) {
    reasons.push(
      "high-invention-risk",
    );
  }

  if (
    forbiddenRisk > 0
  ) {
    reasons.push(
      "forbidden-slot-move",
    );
  }

  if (
    operationLanguage
  ) {
    reasons.push(
      "analytic-realization-language",
    );
  }

  if (
    repetition > 0.8
  ) {
    reasons.push(
      "high-repetition",
    );
  }

  if (
    compression < 0.45
  ) {
    reasons.push(
      "poor-compression",
    );
  }

  if (
    collage > 0
  ) {
    reasons.push(
      "keyword-assembly",
    );
  }

  if (
    restatement > 0
  ) {
    reasons.push(
      "source-restatement",
    );
  }

  if (
    payoff &&
    endpoint !== 1
  ) {
    reasons.push(
      "non-exact-payoff",
    );
  }

  if (
    QUESTION.test(text)
  ) {
    reasons.push(
      "question-leak",
    );
  }

  return {
    text,
    beatOrder:
      input.beat.order,

    supportedEventIds:
      eventIds,

    supportedRelationPairs:
      relations,

    groundingScore:
      grounding,

    meaningScore:
      meaning,

    transitionScore:
      transition,

    obligationCoverage:
      contract,

    relationContractScore:
      relationContract,

    forbiddenMoveRisk:
      forbiddenRisk,

    cohesionScore:
      cohesion,

    noveltyScore:
      novelty,

    compressionScore:
      compression,

    inventionRisk:
      invented,

    repetitionRisk:
      repetition,

    collageRisk:
      collage,

    endpointExactness:
      endpoint,

    score,
    reasons,
  };
}

export function selectBestMouthCandidate(
  input: {
    texts: readonly string[];
    beat: MouthCandidateBeat;
    envelope: RealityEnvelope;
    priorTexts?: readonly string[];
  },
): MouthCandidateSelection {
  const candidates =
    input.texts
      .map(
        (text) =>
          scoreMouthCandidate({
            text,
            beat: input.beat,
            envelope:
              input.envelope,
            priorTexts:
              input.priorTexts,
          }),
      )
      .filter(
        (candidate) =>
          candidate.text.length >
          0,
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );

  return {
    selected:
      candidates[0],
    candidates,
  };
}

function isPayoffCandidateBeat(
  beat: MouthCandidateBeat,
): boolean {
  return isPayoffBeat(
    beat,
  );
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{
  role: "system" | "user";
  content: string;
}> {
  const system = [
    "QRE MOUTH CANDIDATE GENERATOR.",
    "The movie, Meaning Spine, Beat Graph, Reality Envelope, and endpoint are already approved.",
    "Generate language variants only. QRE chooses the winner.",
    "",
    "MOVING-MESSAGE CUT LAW:",
    "Every variant is one viewer-facing cinematic text-message cut.",
    "One dominant thought. One semantic move. 2-7 words preferred.",
    "The next cut must feel desirable because this cut changes the reading.",
    "Prefer short punchy messages over compressed prose.",
    "",
    "REFERENCE RHYTHM:",
    "Came in nervous.",
    "Fierce anyway.",
    "Then came the bow.",
    "Blue, apparently.",
    "Peace was temporary.",
    "These examples define rhythm only. Do not copy unsupplied facts.",
    "",
    "CREATIVE MOVES:",
    "Use contrast, implication, status shift, understatement, callback, reversal, consequence, wordplay, recontextualization, personification, or genre framing when supported by the approved relationship.",
    "Make the relationship felt. Do not explain the relationship.",
    "",
    "REALITY LOCK:",
    "Never invent a concrete event, object, person, place, action, reaction, body movement, sound, chronology, dialogue, environment, or outcome.",
    "Concrete wording must be traceable to supplied evidence.",
    "Creative framing may be novel. Concrete reality may not.",
    "Do not concatenate multiple source anchors into a list.",
    "Do not use comma-heavy summaries.",
    "Do not use 'subject, trait, then action' scaffolds.",
    "Do not turn the beat graph into prose metadata.",
    "",
    "PAYOFF:",
    "For a payoff beat, output ONLY the supplied endpoint phrase.",
    "Never prepend, append, or rewrite the endpoint.",
    "",
    "Generate 5 materially different variants for each non-payoff beat.",
    'Return JSON only: {"variantsByBeat":[{"order":1,"variants":["...","..."]}]}',
  ].join("\n");

  const user = {
    task:
      "generate_mouth_candidates",

    lens:
      clean(input.lens),

    priorTexts:
      input.priorTexts ?? [],

    realityEnvelope:
      input.envelope,

    beats:
      input.beats.map(
        (beat) => ({
          ...beat,

          anchorEvents:
            (
              beat.eventIds ??
              []
            )
              .map(
                (id) =>
                  input.envelope.events.find(
                    (event) =>
                      event.id ===
                      id,
                  )?.label,
              )
              .filter(Boolean),

          anchorRelations:
            input.envelope.relations.filter(
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
            ),

          semanticContract: {
            change:
              clean(
                beat.change,
              ),

            next:
              clean(
                beat.next ||
                  beat.frontier,
              ),

            realizationMode:
              clean(
                beat.realizationMode,
              ),

            creativeMove:
              clean(
                beat.creativeMove,
              ),

            attentionFunction:
              clean(
                beat.attentionFunction,
              ),

            obligations:
              beat.obligations ??
              [],

            forbiddenMoves:
              beat.forbiddenMoves ??
              [],

            relationKinds:
              beat.relationKinds ??
              [],

            relationStrength:
              beat.relationStrength ??
              0,
          },

          payoffContract:
            isPayoffCandidateBeat(
              beat,
            )
              ? {
                  exact: true,
                  endpoint:
                    endpointText(
                      beat,
                    ),
                }
              : undefined,
        }),
      ),
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
  const text =
    clean(raw)
      .replace(
        /^```(?:json)?/i,
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

  try {
    const value =
      JSON.parse(text) as {
        variantsByBeat?: unknown;
      };

    if (
      !Array.isArray(
        value.variantsByBeat,
      )
    ) {
      return undefined;
    }

    const variantsByBeat =
      value.variantsByBeat
        .filter(
          (entry) =>
            entry &&
            typeof entry ===
              "object",
        )
        .map(
          (entry) => {
            const item =
              entry as Record<
                string,
                unknown
              >;

            const variants =
              Array.isArray(
                item.variants,
              )
                ? item.variants
                    .map(clean)
                    .filter(
                      Boolean,
                    )
                    .slice(
                      0,
                      8,
                    )
                : [];

            return {
              order:
                Number(
                  item.order ??
                    0,
                ),
              variants,
            };
          },
        )
        .filter(
          (entry) =>
            entry.order > 0 &&
            entry.variants
              .length >
              0,
        );

    return {
      variantsByBeat,
    };
  } catch {
    return undefined;
  }
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
  const result =
    await input.model(
      buildMouthCandidateMessages(
        input,
      ),
    );

  const parsed =
    parseMouthCandidateBatch(
      result.text,
    );

  if (!parsed) {
    return {
      texts: [],
      candidates: [],
      rawText:
        result.text,
    };
  }

  const ordered =
    [...input.beats].sort(
      (a, b) =>
        a.order -
        b.order,
    );

  const texts: string[] =
    [];

  const selected:
    MouthCandidate[] =
    [];

  for (
    const beat of ordered
  ) {
    /*
     * The endpoint is not candidate-generated.
     *
     * This is the strongest boundary in the Mouth:
     * the final source-derived endpoint comes directly from approved
     * Beat/Spine data.
     */
    if (
      isPayoffBeat(
        beat,
      ) &&
      endpointText(
        beat,
      )
    ) {
      const candidate =
        scoreMouthCandidate({
          text:
            endpointText(
              beat,
            ),
          beat,
          envelope:
            input.envelope,
          priorTexts:
            texts,
        });

      texts.push(
        candidate.text,
      );

      selected.push(
        candidate,
      );

      continue;
    }

    const entry =
      parsed.variantsByBeat.find(
        (item) =>
          item.order ===
          beat.order,
      );

    const selection =
      selectBestMouthCandidate({
        texts:
          (entry?.variants ?? []).filter(
            (text) =>
              clean(text).split(/\s+/).length <= 10 &&
              !/^.{0,40},.{0,40},/.test(clean(text)),
          ),
        beat,
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

      selected.push(
        selection.selected,
      );
    } else {
      texts.push("");
    }
  }

  return {
    texts,
    candidates:
      selected,
    rawText:
      result.text,
  };
}