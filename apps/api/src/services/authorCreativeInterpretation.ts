/**
 * QRE CREATIVE INTERPRETATION DISCOVERY
 *
 * Canonical cognition-side compression of supplied reality into competing
 * grounded semantic possibilities.
 *
 * Law:
 *   DO NOT SUMMARIZE THE EVENTS.
 *   COMPRESS THE RELATIONSHIP THAT MAKES THE EVENTS FEEL DIFFERENT TOGETHER.
 *
 * This layer never creates a concrete event, object, actor, chronology, or
 * outcome. It can only interpret relationships already supported by supplied
 * evidence and sequence structure.
 *
 * Search law:
 *   Do not let "state change" automatically win.
 *   Search the whole supplied reality for:
 *     - state movement
 *     - concrete action/object significance
 *     - direct graph relationships
 *     - recurrence/callback
 *     - contrast
 *     - expectation shift
 *     - accumulation/convergence
 *     - return with new status
 *
 * Downstream thesis selection decides which grounded possibility has the
 * greatest whole-experience value.
 */

import type {
  LatentMovieCandidate,
  LatentSemanticMechanism,
  LatentSemanticRealization,
  RealityGraph,
} from "@qre/contracts";

export type CreativeInterpretationMechanism =
  LatentSemanticMechanism;

export type CreativeInterpretation =
  LatentSemanticRealization & {
    /** Diagnostic text only. Downstream realization must use semanticRealization fields. */
    statement: string;
  };

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (value: number): number =>
  Number(
    Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(value) ? value : 0,
      ),
    ).toFixed(3),
  );

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function labelFor(
  graph: RealityGraph,
  eventId: string,
): string {
  return clean(
    graph.events.find(
      (event) => event.id === eventId,
    )?.label,
  );
}

function tokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter(
        (token) => token.length >= 3,
      ),
  );
}

function overlap(
  left: string,
  right: string,
): number {
  const a = tokens(left);
  const b = tokens(right);

  if (!a.size || !b.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) hits += 1;
  }

  return hits /
    Math.max(
      1,
      Math.min(a.size, b.size),
    );
}

function subjectName(
  graph: RealityGraph,
): string {
  const continuity = [
    ...(graph.entityContinuity ?? []),
  ]
    .sort(
      (a, b) =>
        b.salienceScore -
        a.salienceScore,
    )[0];

  return clean(
    continuity?.name,
  );
}

const NEGATIVE_STATE =
  /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|apprehensive)\b/i;

const POSITIVE_STATE =
  /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|sharp|dapper|ready|beautiful|handsome|radiant|unburdened)\b/i;

const STATE_WORD =
  /\b(?:felt|feel|feels|seemed|seem|became|become|was|were|is|are|looked|looks|look|different|changed|new|old|quiet|wild|gentle|clean|finished|gone|unburdened)\b/i;

const CONTINUATION =
  /\b(?:kept|continued|continue|continues|still|again|returned|return|back|second|third|another|repeated|repeat|once\s+more|later|years?)\b/i;

const CALLBACK =
  /\b(?:same|still|remember(?:ed|ing|s)?|again|returned|return|back|kept)\b/i;

const EXPECTATION =
  /\b(?:didn'?t|did not|never)\s+(?:expect|plan|think|assume)|\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|unlike\s+expected)\b/i;

const PROFILE_RELATION =
  /\b(?:likes?|loves?|prefers?|enjoys?|hates?|avoids?|favorite|favourite|known for)\b/i;

const CONTRAST =
  /\b(?:but|yet|although|instead|rather|except|while|however|still)\b/i;

const ACTION =
  /\b(?:arrived|arrive|visited|started|called|texted|messaged|talked|spoke|worked|played|danced|went|came|left|returned|watched|looked|chose|chosen|selected|picked|remembered|met|made|gave|found|lost|fixed|repaired|groomed|dyed|tailored|installed|built|bought|sold|celebrated|stole|steal|stolen|took|take|taken|grabbed|snatched|borrowed|carried|used|changed|finished)\b/i;

const OBJECT =
  /\b(?:bow|collar|tag|mirror|photo|picture|gift|key|keys|ring|flower|flowers|coat|dress|shirt|shoe|shoes|ticket|receipt|book|letter|phone|screen|car|room|bathroom|house|home|table|door|window|box|bag|cake|towel|towels|leash|tool|tools|food|drink|coffee|music|water)\b/i;

const CONCRETE_OBJECTS = new Set([
  "bow",
  "collar",
  "tag",
  "mirror",
  "photo",
  "picture",
  "gift",
  "key",
  "keys",
  "ring",
  "flower",
  "flowers",
  "coat",
  "dress",
  "shirt",
  "shoe",
  "shoes",
  "ticket",
  "receipt",
  "book",
  "letter",
  "phone",
  "screen",
  "car",
  "room",
  "bathroom",
  "house",
  "home",
  "table",
  "door",
  "window",
  "box",
  "bag",
  "cake",
  "towel",
  "towels",
  "leash",
  "tool",
  "tools",
  "food",
  "drink",
  "coffee",
  "music",
  "water",
]);

function isState(
  label: string,
): boolean {
  return (
    STATE_WORD.test(label) ||
    NEGATIVE_STATE.test(label) ||
    POSITIVE_STATE.test(label)
  );
}

function stateKind(
  label: string,
): "negative" | "positive" | "other" {
  if (NEGATIVE_STATE.test(label)) {
    return "negative";
  }

  if (POSITIVE_STATE.test(label)) {
    return "positive";
  }

  return "other";
}

function concreteTokens(
  label: string,
): string[] {
  return [
    ...tokens(label),
  ].filter((token) =>
    CONCRETE_OBJECTS.has(token),
  );
}

function orderedEventIds(
  candidate: LatentMovieCandidate,
): string[] {
  return unique(
    candidate.trajectory.flatMap(
      (step) => step.eventIds,
    ),
  );
}

function eventPosition(
  ids: readonly string[],
  id: string,
): number {
  return ids.indexOf(id);
}

function eventDistance(
  ids: readonly string[],
  left: string,
  right: string,
): number {
  const leftIndex = eventPosition(
    ids,
    left,
  );
  const rightIndex = eventPosition(
    ids,
    right,
  );

  if (
    leftIndex < 0 ||
    rightIndex < 0
  ) {
    return 0;
  }

  return Math.abs(
    leftIndex - rightIndex,
  );
}

function buildCandidate(
  statement: string,
  mechanism: CreativeInterpretationMechanism,
  evidenceEventIds: readonly string[],
  confidence: number,
  semantic: Partial<LatentSemanticRealization> = {},
): CreativeInterpretation {
  return {
    statement: clean(statement),
    mechanism,
    evidenceEventIds: unique(
      evidenceEventIds,
    ),
    beforeEventIds:
      semantic.beforeEventIds ?? [],
    afterEventIds:
      semantic.afterEventIds ?? [],
    before: semantic.before,
    after: semantic.after,
    subject: semantic.subject,
    callback: semantic.callback,
    relation: semantic.relation,
    realizationMove:
      semantic.realizationMove ??
      "recognize",
    creativeOpportunity:
      semantic.creativeOpportunity,
    confidence: metric(
      confidence,
    ),
  };
}

function bestStateTransition(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  startId: string;
  endId: string;
  startLabel: string;
  endLabel: string;
  score: number;
} | undefined {
  const states = orderedEventIds
    .map((id, index) => ({
      id,
      index,
      label: labelFor(
        graph,
        id,
      ),
    }))
    .filter((item) =>
      isState(item.label),
    );

  let best:
    | {
        startId: string;
        endId: string;
        startLabel: string;
        endLabel: string;
        score: number;
      }
    | undefined;

  for (const start of states) {
    for (const end of states) {
      if (
        end.index <=
        start.index
      ) {
        continue;
      }

      const from =
        stateKind(
          start.label,
        );

      const to =
        stateKind(
          end.label,
        );

      const polarity =
        from === "negative" &&
        to === "positive"
          ? 1
          : from !== to &&
              from !== "other" &&
              to !== "other"
            ? 0.92
            : from === "negative" ||
                to === "positive"
              ? 0.78
              : 0.55;

      const distance =
        Math.min(
          0.2,
          (end.index -
            start.index) *
            0.035,
        );

      const score =
        polarity * 0.7 +
        distance;

      if (
        !best ||
        score > best.score
      ) {
        best = {
          startId: start.id,
          endId: end.id,
          startLabel:
            start.label,
          endLabel:
            end.label,
          score,
        };
      }
    }
  }

  return best;
}

function bestConcreteCallback(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  earlierId: string;
  laterId: string;
  object: string;
  score: number;
} | undefined {
  let best:
    | {
        earlierId: string;
        laterId: string;
        object: string;
        score: number;
      }
    | undefined;

  for (
    let i = 0;
    i < orderedEventIds.length;
    i += 1
  ) {
    const earlierId =
      orderedEventIds[i]!;

    const earlierObjects =
      concreteTokens(
        labelFor(
          graph,
          earlierId,
        ),
      );

    if (
      !earlierObjects.length
    ) {
      continue;
    }

    for (
      let j = i + 1;
      j <
        orderedEventIds.length;
      j += 1
    ) {
      const laterId =
        orderedEventIds[j]!;

      const laterLabel =
        labelFor(
          graph,
          laterId,
        );

      const laterObjects =
        concreteTokens(
          laterLabel,
        );

      const shared =
        earlierObjects.filter(
          (object) =>
            laterObjects.includes(
              object,
            ),
        );

      if (!shared.length) {
        continue;
      }

      const callback =
        CALLBACK.test(
          laterLabel,
        );

      const distance =
        Math.min(
          0.2,
          (j - i) * 0.035,
        );

      const score =
        (callback
          ? 0.82
          : 0.5) +
        Math.min(
          0.12,
          shared.length *
            0.06,
        ) +
        distance;

      if (
        !best ||
        score > best.score
      ) {
        best = {
          earlierId,
          laterId,
          object:
            shared[0]!,
          score,
        };
      }
    }
  }

  return best;
}

function strongestDirectRelation(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  from: string;
  to: string;
  kind: string;
  strength: number;
  distance: number;
} | undefined {
  const ranked: Array<{
    from: string;
    to: string;
    kind: string;
    strength: number;
    distance: number;
  }> = [];

  for (
    let i = 0;
    i < orderedEventIds.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j <
        orderedEventIds.length;
      j += 1
    ) {
      const left =
        orderedEventIds[i]!;

      const right =
        orderedEventIds[j]!;

      const relation =
        graph.relations
          .filter(
            (candidate) =>
              (
                candidate.from === left &&
                candidate.to === right
              ) ||
              (
                candidate.from === right &&
                candidate.to === left
              ),
          )
          .sort(
            (a, b) =>
              b.strength -
              a.strength,
          )[0];

      if (!relation) {
        continue;
      }

      if (
        [
          "before",
          "after",
          "involves",
          "belongs_to",
        ].includes(
          relation.kind,
        )
      ) {
        continue;
      }

      ranked.push({
        from: left,
        to: right,
        kind: relation.kind,
        strength:
          relation.strength,
        distance: j - i,
      });
    }
  }

  const priority = (
    kind: string,
  ): number => {
    switch (kind) {
      case "recontextualizes":
        return 1;
      case "repeats":
        return 0.98;
      case "contrasts":
        return 0.97;
      case "changes":
        return 0.96;
      case "causes":
        return 0.94;
      case "converges":
        return 0.75;
      default:
        return 0.5;
    }
  };

  return ranked.sort(
    (a, b) =>
      (
        b.strength *
          0.72 +
        priority(b.kind) *
          0.28 +
        (b.distance > 1
          ? 0.05
          : 0)
      ) -
      (
        a.strength *
          0.72 +
        priority(a.kind) *
          0.28 +
        (a.distance > 1
          ? 0.05
          : 0)
      ),
  )[0];
}

function strongestActionObjectPair(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  actionId: string;
  objectId: string;
  actionLabel: string;
  objectLabel: string;
  object: string;
  score: number;
} | undefined {
  const actions = orderedEventIds
    .map((id, index) => ({
      id,
      index,
      label: labelFor(
        graph,
        id,
      ),
    }))
    .filter((item) =>
      ACTION.test(item.label),
    );

  let best:
    | {
        actionId: string;
        objectId: string;
        actionLabel: string;
        objectLabel: string;
        object: string;
        score: number;
      }
    | undefined;

  for (const action of actions) {
    for (
      let i = 0;
      i < orderedEventIds.length;
      i += 1
    ) {
      const objectId =
        orderedEventIds[i]!;

      if (
        objectId === action.id
      ) {
        continue;
      }

      const objectLabel =
        labelFor(
          graph,
          objectId,
        );

      const objects =
        concreteTokens(
          objectLabel,
        );

      if (!objects.length) {
        continue;
      }

      const distance =
        Math.abs(
          action.index - i,
        );

      const temporal =
        distance === 1
          ? 1
          : distance === 2
            ? 0.82
            : 0.62;

      const objectSpecificity =
        Math.min(
          0.16,
          objects.length *
            0.05,
        );

      const actionIntensity =
        STEAL_ACTION.test(
          action.label,
        )
          ? 0.16
          : 0;

      const score =
        temporal *
          0.72 +
        objectSpecificity +
        actionIntensity +
        overlap(
          action.label,
          objectLabel,
        ) *
          0.12;

      if (
        !best ||
        score > best.score
      ) {
        best = {
          actionId:
            action.id,
          objectId,
          actionLabel:
            action.label,
          objectLabel,
          object:
            objects[0]!,
          score,
        };
      }
    }
  }

  return best;
}

const STEAL_ACTION =
  /\b(?:stole|steal|stolen|took|take|taken|grabbed|snatched|borrowed)\b/i;

function strongestActionStatePair(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  actionId: string;
  stateId: string;
  actionLabel: string;
  stateLabel: string;
  score: number;
} | undefined {
  const actions = orderedEventIds
    .map((id, index) => ({
      id,
      index,
      label: labelFor(
        graph,
        id,
      ),
    }))
    .filter((item) =>
      ACTION.test(item.label),
    );

  const states = orderedEventIds
    .map((id, index) => ({
      id,
      index,
      label: labelFor(
        graph,
        id,
      ),
    }))
    .filter((item) =>
      isState(item.label),
    );

  let best:
    | {
        actionId: string;
        stateId: string;
        actionLabel: string;
        stateLabel: string;
        score: number;
      }
    | undefined;

  for (const action of actions) {
    for (const state of states) {
      if (
        action.id === state.id
      ) {
        continue;
      }

      const distance =
        Math.abs(
          action.index -
            state.index,
        );

      const temporal =
        distance === 1
          ? 1
          : distance === 2
            ? 0.82
            : 0.62;

      const surprisingAction =
        STEAL_ACTION.test(
          action.label,
        ) &&
        (
          stateKind(
            state.label,
          ) ===
            "positive"
        );

      const score =
        temporal * 0.78 +
        (
          surprisingAction
            ? 0.15
            : 0
        ) +
        overlap(
          action.label,
          state.label,
        ) *
          0.07;

      if (
        !best ||
        score > best.score
      ) {
        best = {
          actionId:
            action.id,
          stateId:
            state.id,
          actionLabel:
            action.label,
          stateLabel:
            state.label,
          score,
        };
      }
    }
  }

  return best;
}

function buildAccumulation(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  ids: string[];
  anchors: string[];
  score: number;
} | undefined {
  if (
    orderedEventIds.length <
    3
  ) {
    return undefined;
  }

  const ids =
    orderedEventIds.filter(
      (id) => {
        const label =
          labelFor(
            graph,
            id,
          );

        return (
          isState(label) ||
          ACTION.test(label) ||
          OBJECT.test(label)
        );
      },
    );

  if (ids.length < 3) {
    return undefined;
  }

  const stateCount =
    ids.filter((id) =>
      isState(
        labelFor(graph, id),
      ),
    ).length;

  const actionCount =
    ids.filter((id) =>
      ACTION.test(
        labelFor(graph, id),
      ),
    ).length;

  const objectCount =
    ids.filter((id) =>
      OBJECT.test(
        labelFor(graph, id),
      ),
    ).length;

  const spanValue =
    (
      Math.max(
        ...ids.map((id) =>
          eventPosition(
            orderedEventIds,
            id,
          ),
        ),
      ) -
      Math.min(
        ...ids.map((id) =>
          eventPosition(
            orderedEventIds,
            id,
          ),
        ),
      )
    ) /
    Math.max(
      1,
      orderedEventIds.length -
        1,
    );

  const structural =
    Math.min(
      1,
      stateCount * 0.2 +
        actionCount * 0.18 +
        objectCount * 0.16,
    );

  return {
    ids,
    anchors: ids
      .slice(0, 4)
      .map((id) =>
        labelFor(
          graph,
          id,
        ),
      ),
    score: metric(
      structural * 0.72 +
        spanValue * 0.28,
    ),
  };
}

function buildStatusTurnCandidate(
  graph: RealityGraph,
  transition:
    | {
        startId: string;
        endId: string;
        startLabel: string;
        endLabel: string;
        score: number;
      }
    | undefined,
  actionState:
    | {
        actionId: string;
        stateId: string;
        actionLabel: string;
        stateLabel: string;
        score: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  if (!transition) {
    return undefined;
  }

  const evidence = [
    transition.startId,
    transition.endId,
  ];

  if (
    actionState &&
    !evidence.includes(
      actionState.actionId,
    )
  ) {
    evidence.push(
      actionState.actionId,
    );
  }

  if (
    actionState &&
    !evidence.includes(
      actionState.stateId,
    )
  ) {
    evidence.push(
      actionState.stateId,
    );
  }

  const subject =
    subjectName(graph);

  return buildCandidate(
    `${subject || "The supplied subject"} moves from ${transition.startLabel} to ${transition.endLabel}, with the supplied middle events acting as the change in status.`,
    "state_change",
    evidence,
    metric(
      0.84 +
        Math.min(
          0.12,
          transition.score *
            0.08,
        ) +
        (
          actionState
            ? 0.03
            : 0
        ),
    ),
    {
      subject,
      beforeEventIds: [
        transition.startId,
      ],
      afterEventIds: [
        transition.endId,
      ],
      before:
        transition.startLabel,
      after:
        transition.endLabel,
      realizationMove:
        "feel_state_transition",
      creativeOpportunity:
        "status_turn",
    },
  );
}

function buildConcreteRecontextualization(
  graph: RealityGraph,
  callback:
    | {
        earlierId: string;
        laterId: string;
        object: string;
        score: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  if (!callback) {
    return undefined;
  }

  return buildCandidate(
    `The supplied ${callback.object} carries continuity from the earlier moment into the later one.`,
    "recurrence",
    [
      callback.earlierId,
      callback.laterId,
    ],
    metric(
      0.84 +
        Math.min(
          0.1,
          callback.score *
            0.08,
        ),
    ),
    {
      beforeEventIds: [
        callback.earlierId,
      ],
      afterEventIds: [
        callback.laterId,
      ],
      before:
        labelFor(
          graph,
          callback.earlierId,
        ),
      after:
        labelFor(
          graph,
          callback.laterId,
        ),
      callback: {
        detail:
          callback.object,
        eventIds: [
          callback.earlierId,
          callback.laterId,
        ],
        role:
          "recontextualization",
      },
      realizationMove:
        "recontextualize_callback",
      creativeOpportunity:
        "callback_recontextualization",
    },
  );
}

function buildStealObjectCandidate(
  graph: RealityGraph,
  pair:
    | {
        actionId: string;
        objectId: string;
        actionLabel: string;
        objectLabel: string;
        object: string;
        score: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  if (!pair) {
    return undefined;
  }

  if (
    !STEAL_ACTION.test(
      pair.actionLabel,
    )
  ) {
    return undefined;
  }

  return buildCandidate(
    `The supplied act of taking the ${pair.object} changes the role that detail plays in the experience.`,
    "consequence",
    [
      pair.objectId,
      pair.actionId,
    ],
    metric(
      0.82 +
        Math.min(
          0.12,
          pair.score * 0.1,
        ),
    ),
    {
      beforeEventIds: [
        pair.objectId,
      ],
      afterEventIds: [
        pair.actionId,
      ],
      before:
        pair.objectLabel,
      after:
        pair.actionLabel,
      realizationMove:
        "recognize",
      creativeOpportunity:
        "recognition",
    },
  );
}

function buildActionObjectCandidate(
  graph: RealityGraph,
  pair:
    | {
        actionId: string;
        objectId: string;
        actionLabel: string;
        objectLabel: string;
        object: string;
        score: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  if (!pair) {
    return undefined;
  }

  if (
    STEAL_ACTION.test(
      pair.actionLabel,
    )
  ) {
    return undefined;
  }

  return buildCandidate(
    `The supplied action gives the concrete ${pair.object} greater significance in the sequence.`,
    "consequence",
    [
      pair.actionId,
      pair.objectId,
    ],
    metric(
      0.7 +
        pair.score * 0.12,
    ),
    {
      beforeEventIds: [
        pair.objectId,
      ],
      afterEventIds: [
        pair.actionId,
      ],
      before:
        pair.objectLabel,
      after:
        pair.actionLabel,
      realizationMove:
        "recognize",
      creativeOpportunity:
        "recognition",
    },
  );
}

function buildContrastCandidate(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): CreativeInterpretation | undefined {
  const transition =
    bestStateTransition(
      graph,
      orderedEventIds,
    );

  if (!transition) {
    return undefined;
  }

  const from =
    stateKind(
      transition.startLabel,
    );

  const to =
    stateKind(
      transition.endLabel,
    );

  if (from === to) {
    return undefined;
  }

  return buildCandidate(
    `The supplied experience holds ${transition.startLabel} against ${transition.endLabel}; the contrast changes the reading.`,
    "contrast",
    [
      transition.startId,
      transition.endId,
    ],
    0.84,
    {
      beforeEventIds: [
        transition.startId,
      ],
      afterEventIds: [
        transition.endId,
      ],
      before:
        transition.startLabel,
      after:
        transition.endLabel,
      realizationMove:
        "hold_contrast",
      creativeOpportunity:
        "contrast_reframe",
    },
  );
}

function buildExpectationCandidate(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): CreativeInterpretation | undefined {
  const expectationId =
    orderedEventIds.find(
      (id) =>
        EXPECTATION.test(
          labelFor(
            graph,
            id,
          ),
        ),
    );

  if (!expectationId) {
    return undefined;
  }

  const expectationIndex =
    eventPosition(
      orderedEventIds,
      expectationId,
    );

  const laterIds =
    orderedEventIds.filter(
      (id) =>
        eventPosition(
          orderedEventIds,
          id,
        ) >
        expectationIndex,
    );

  const laterInteresting =
    laterIds.find(
      (id) => {
        const label =
          labelFor(
            graph,
            id,
          );

        return (
          isState(label) ||
          ACTION.test(label) ||
          OBJECT.test(label)
        );
      },
    );

  if (!laterInteresting) {
    return undefined;
  }

  return buildCandidate(
    "The later supplied material changes what the earlier expectation means.",
    "expectation_shift",
    [
      expectationId,
      laterInteresting,
    ],
    0.82,
    {
      beforeEventIds: [
        expectationId,
      ],
      afterEventIds: [
        laterInteresting,
      ],
      before:
        labelFor(
          graph,
          expectationId,
        ),
      after:
        labelFor(
          graph,
          laterInteresting,
        ),
      realizationMove:
        "recognize",
      creativeOpportunity:
        "recognition",
    },
  );
}

function buildAccumulationCandidate(
  graph: RealityGraph,
  accumulation:
    | {
        ids: string[];
        anchors: string[];
        score: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  if (
    !accumulation ||
    accumulation.ids.length <
      3
  ) {
    return undefined;
  }

  return buildCandidate(
    "Several supplied details accumulate into one later reading; no single event carries the entire meaning alone.",
    "convergence",
    accumulation.ids,
    metric(
      0.68 +
        accumulation.score *
          0.22,
    ),
    {
      beforeEventIds: [
        accumulation.ids[0]!,
      ],
      afterEventIds: [
        accumulation.ids[
          accumulation.ids.length -
            1
        ]!,
      ],
      before:
        accumulation.anchors[0],
      after:
        accumulation.anchors[
          accumulation.anchors.length -
            1
        ],
      realizationMove:
        "recognize",
      creativeOpportunity:
        "recognition",
    },
  );
}

function buildRelationCandidate(
  graph: RealityGraph,
  relation:
    | {
        from: string;
        to: string;
        kind: string;
        strength: number;
        distance: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  if (!relation) {
    return undefined;
  }

  const fromLabel =
    labelFor(
      graph,
      relation.from,
    );

  const toLabel =
    labelFor(
      graph,
      relation.to,
    );

  switch (relation.kind) {
    case "recontextualizes":
      return buildCandidate(
        "The later supplied detail recontextualizes the earlier detail.",
        "recurrence",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.84 +
            relation.strength *
              0.12,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "recontextualize_callback",
          creativeOpportunity:
            "callback_recontextualization",
        },
      );

    case "repeats":
      return buildCandidate(
        "The later supplied detail returns with new relevance.",
        "recurrence",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.82 +
            relation.strength *
              0.12,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "recognize_callback",
          creativeOpportunity:
            "callback_recontextualization",
        },
      );

    case "contrasts":
      return buildCandidate(
        "The supplied contrast makes one reading compete with another.",
        "contrast",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.84 +
            relation.strength *
              0.12,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "hold_contrast",
          creativeOpportunity:
            "contrast_reframe",
        },
      );

    case "changes":
      return buildCandidate(
        "The later supplied event changes the reading of the earlier state or detail.",
        "state_change",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.84 +
            relation.strength *
              0.12,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "feel_state_transition",
          creativeOpportunity:
            "status_turn",
        },
      );

    case "causes":
      return buildCandidate(
        "A supplied consequence follows from an earlier supplied event.",
        "consequence",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.8 +
            relation.strength *
              0.14,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "recognize",
          creativeOpportunity:
            "recognition",
        },
      );

    case "converges":
      return buildCandidate(
        "Separate supplied details converge into one later reading.",
        "convergence",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.7 +
            relation.strength *
              0.16,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "recognize",
          creativeOpportunity:
            "recognition",
        },
      );

    default:
      return buildCandidate(
        "The supplied relationship changes how the two details read together.",
        "continuation",
        [
          relation.from,
          relation.to,
        ],
        metric(
          0.64 +
            relation.strength *
              0.18,
        ),
        {
          beforeEventIds: [
            relation.from,
          ],
          afterEventIds: [
            relation.to,
          ],
          before: fromLabel,
          after: toLabel,
          relation: {
            kind:
              relation.kind,
            fromEventId:
              relation.from,
            toEventId:
              relation.to,
          },
          realizationMove:
            "recognize",
          creativeOpportunity:
            "recognition",
        },
      );
  }
}

function buildIdentityConstellationCandidate(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): CreativeInterpretation | undefined {
  const subject = subjectName(graph);
  if (!subject) return undefined;

  const profile = orderedEventIds
    .map((id) => ({
      id,
      label: labelFor(graph, id),
    }))
    .filter((item) => PROFILE_RELATION.test(item.label));

  if (profile.length < 2) return undefined;

  const evidence = profile.map((item) => item.id);
  const first = profile[0]!;
  const last = profile[profile.length - 1]!;

  return buildCandidate(
    "Several supplied preferences or stable attributes form one character reading when experienced together.",
    "convergence",
    evidence,
    metric(0.78 + Math.min(0.14, profile.length * 0.03)),
    {
      subject,
      beforeEventIds: [first.id],
      afterEventIds: [last.id],
      before: first.label,
      after: last.label,
      realizationMove: "recognize",
      creativeOpportunity: "recognition",
      feltEffect:
        "The viewer should recognize a distinct personality from the supplied preferences without being told a personality summary.",
      viewerShift:
        "Separate profile facts become one recognizable character impression.",
      languageAim:
        "Compress the supplied preferences into sharp character signals; imply more than you explain and do not invent behavior.",
    },
  );
}

function buildSubjectReturnCandidate(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
  transition:
    | {
        startId: string;
        endId: string;
        startLabel: string;
        endLabel: string;
        score: number;
      }
    | undefined,
): CreativeInterpretation | undefined {
  const subject =
    subjectName(graph);

  if (!subject) {
    return undefined;
  }

  const direct = orderedEventIds
    .map((id, index) => ({
      id,
      index,
      label: labelFor(
        graph,
        id,
      ),
    }))
    .filter((item) =>
      item.label
        .toLowerCase()
        .includes(
          subject.toLowerCase(),
        ),
    );

  if (direct.length < 2) {
    return undefined;
  }

  const start = direct[0]!;

  const returnCandidate =
    direct
      .filter(
        (item) =>
          item.index >
            start.index &&
          CONTINUATION.test(
            item.label,
          ),
      )
      .sort(
        (a, b) =>
          b.index -
          a.index,
      )[0];

  if (!returnCandidate) {
    return undefined;
  }

  const evidence = [
    start.id,
    returnCandidate.id,
  ];

  if (transition) {
    evidence.push(
      transition.startId,
      transition.endId,
    );
  }

  return buildCandidate(
    `${subject} returns after the supplied experience has changed the earlier reading.`,
    "continuation",
    evidence,
    metric(
      0.82 +
        Math.min(
          0.12,
          (
            returnCandidate.index -
            start.index
          ) * 0.02,
        ),
    ),
    {
      subject,
      beforeEventIds:
        transition
          ? [transition.startId]
          : [start.id],
      afterEventIds: [
        returnCandidate.id,
      ],
      before: transition
        ? transition.startLabel
        : labelFor(
            graph,
            start.id,
          ),
      after: labelFor(
        graph,
        returnCandidate.id,
      ),
      realizationMove:
        "return_with_new_status",
      creativeOpportunity:
        "return_with_new_status",
    },
  );
}

export function deriveSequenceBackedCreativeInterpretations(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation[] {
  const orderedEventIds =
    orderedEventIdsForCandidate(
      candidate,
    );

  if (orderedEventIds.length < 2) {
    return [];
  }

  const labels = orderedEventIds
    .map((id) =>
      labelFor(graph, id),
    )
    .filter(Boolean);

  if (labels.length < 2) {
    return [];
  }

  const stateTransition =
    bestStateTransition(
      graph,
      orderedEventIds,
    );

  const concreteCallback =
    bestConcreteCallback(
      graph,
      orderedEventIds,
    );

  const directRelation =
    strongestDirectRelation(
      graph,
      orderedEventIds,
    );

  const actionObject =
    strongestActionObjectPair(
      graph,
      orderedEventIds,
    );

  const actionState =
    strongestActionStatePair(
      graph,
      orderedEventIds,
    );

  const accumulation =
    buildAccumulation(
      graph,
      orderedEventIds,
    );

  const result: CreativeInterpretation[] =
    [];

  /*
   * WHOLE EXPERIENCE STATE TURN
   */
  const statusTurn =
    buildStatusTurnCandidate(
      graph,
      stateTransition,
      actionState,
    );

  if (statusTurn) {
    result.push(statusTurn);
  }

  /*
   * CONCRETE RECONTEXTUALIZATION
   */
  const callback =
    buildConcreteRecontextualization(
      graph,
      concreteCallback,
    );

  if (callback) {
    result.push(callback);
  }

  /*
   * DIRECT GRAPH RELATIONSHIP
   */
  const relationCandidate =
    buildRelationCandidate(
      graph,
      directRelation,
    );

  if (relationCandidate) {
    result.push(
      relationCandidate,
    );
  }

  /*
   * SURPRISING CONCRETE ACTION
   *
   * This is particularly important for facts such as:
   *
   *   stole a blue bow
   *
   * because the action can make the object itself become the memorable
   * semantic carrier, without inventing anything about the subject.
   */
  const stealCandidate =
    buildStealObjectCandidate(
      graph,
      actionObject,
    );

  if (stealCandidate) {
    result.push(
      stealCandidate,
    );
  }

  /*
   * ORDINARY ACTION + OBJECT
   */
  const actionObjectCandidate =
    buildActionObjectCandidate(
      graph,
      actionObject,
    );

  if (actionObjectCandidate) {
    result.push(
      actionObjectCandidate,
    );
  }

  /*
   * ACTION + STATE
   */
  if (
    actionState &&
    actionState.score >= 0.7
  ) {
    result.push(
      buildCandidate(
        `A supplied action becomes part of the subject's changing status.`,
        "state_change",
        [
          actionState.actionId,
          actionState.stateId,
        ],
        metric(
          0.72 +
            actionState.score *
              0.12,
        ),
        {
          beforeEventIds: [
            actionState.actionId,
          ],
          afterEventIds: [
            actionState.stateId,
          ],
          before:
            actionState.actionLabel,
          after:
            actionState.stateLabel,
          realizationMove:
            "feel_state_transition",
          creativeOpportunity:
            "status_turn",
        },
      ),
    );
  }

  /*
   * CONTRAST
   */
  const contrast =
    buildContrastCandidate(
      graph,
      orderedEventIds,
    );

  if (contrast) {
    result.push(contrast);
  }

  /*
   * EXPECTATION SHIFT
   */
  const expectation =
    buildExpectationCandidate(
      graph,
      orderedEventIds,
    );

  if (expectation) {
    result.push(
      expectation,
    );
  }

  /*
   * DAY-ONE IDENTITY / PROFILE CONSTELLATION
   *
   * Stable supplied preferences and attributes are legitimate Author material.
   * They do not require prior event history before QRE may discover character.
   */
  const identityConstellation =
    buildIdentityConstellationCandidate(
      graph,
      orderedEventIds,
    );

  if (identityConstellation) {
    result.push(identityConstellation);
  }

  /*
   * WHOLE EXPERIENCE ACCUMULATION
   */
  const accumulationCandidate =
    buildAccumulationCandidate(
      graph,
      accumulation,
    );

  if (accumulationCandidate) {
    result.push(
      accumulationCandidate,
    );
  }

  /*
   * SUBJECT RETURN
   */
  const returnCandidate =
    buildSubjectReturnCandidate(
      graph,
      orderedEventIds,
      stateTransition,
    );

  if (returnCandidate) {
    result.push(
      returnCandidate,
    );
  }

  /*
   * CLEAN STATE TRANSITION FALLBACK
   *
   * Keep it available, but don't give it privileged confidence merely because
   * a positive state exists.
   */
  if (stateTransition) {
    const richerConcreteStructure =
      Boolean(
        concreteCallback ||
          directRelation ||
          actionObject ||
          actionState,
      );

    result.push(
      buildCandidate(
        `${
          subjectName(graph) ||
          "The supplied experience"
        } moves from ${stateTransition.startLabel} to ${stateTransition.endLabel}.`,
        "state_change",
        [
          stateTransition.startId,
          stateTransition.endId,
        ],
        richerConcreteStructure
          ? 0.72
          : 0.86,
        {
          subject:
            subjectName(graph),
          beforeEventIds: [
            stateTransition.startId,
          ],
          afterEventIds: [
            stateTransition.endId,
          ],
          before:
            stateTransition.startLabel,
          after:
            stateTransition.endLabel,
          realizationMove:
            "feel_state_transition",
          creativeOpportunity:
            "status_turn",
        },
      ),
    );
  }

  /*
   * LAST-RESORT WHOLE-SEQUENCE READING
   */
  if (
    !result.length &&
    orderedEventIds.length >= 3
  ) {
    result.push(
      buildCandidate(
        "The supplied details accumulate into a later reading without requiring a new fact.",
        "convergence",
        orderedEventIds,
        0.58,
        {
          beforeEventIds:
            orderedEventIds.slice(0, 1),
          afterEventIds:
            orderedEventIds.slice(-1),
          before:
            labels[0],
          after:
            labels[labels.length - 1],
          realizationMove:
            "recognize",
          creativeOpportunity:
            "recognition",
        },
      ),
    );
  }

  /*
   * De-duplicate only identical semantic structures.
   *
   * Different mechanisms may legitimately cite the same events because they
   * represent genuinely different ways to experience the same reality.
   */
  const seen = new Set<string>();

  const deduped =
    result.filter(
      (interpretation) => {
        const evidence =
          [...interpretation.evidenceEventIds]
            .sort()
            .join(",");

        const key = [
          interpretation.mechanism,
          interpretation.realizationMove ??
            "",
          interpretation.creativeOpportunity ??
            "",
          evidence,
        ].join("|");

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      },
    );

  /*
   * Keep the possibility space broad here.
   *
   * Do not collapse to one interpretation until the downstream thesis layer
   * has considered whole-experience coverage, relation power, endpoint support,
   * and non-adjacent relationships.
   */
  return deduped.sort(
    (left, right) =>
      right.confidence -
        left.confidence ||
      right.evidenceEventIds.length -
        left.evidenceEventIds.length,
  );
}

function orderedEventIdsForCandidate(
  candidate: LatentMovieCandidate,
): string[] {
  return unique(
    candidate.trajectory.flatMap(
      (step) => step.eventIds,
    ),
  );
}

export function deriveSequenceBackedCreativeInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation | undefined {
  return deriveSequenceBackedCreativeInterpretations(
    graph,
    candidate,
  )[0];
}