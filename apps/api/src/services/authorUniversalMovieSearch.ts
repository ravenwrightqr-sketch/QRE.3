import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
  RealityPattern,
} from "@qre/contracts";

/**
 * ONE universal movie search.
 *
 * Reality is evidence. Movie search discovers competing ways to look at that
 * evidence; it does not create new facts, actors, objects, chronology, or outcomes.
 *
 * LENS BOUNDARY:
 * Universal discovery is completely lens-blind. A lens is not accepted by this
 * function because perceptual preference must not alter which latent opportunities
 * exist in the supplied RealityGraph. Lens bias belongs after discovery.
 *
 * Critical distinction:
 * - subject relevance is not the same thing as mere presence in the input
 * - ambient facts may remain in RealityGraph without becoming the subject's movie
 * - explicit callbacks such as "same" / "remembered" can legitimately reconnect
 *   a detail that was not repeated with the subject's name
 *
 * MOVIE SELECTION LAW:
 * - the graph may be huge
 * - the movie must be selective
 * - selection should explore the available reality dimensions
 * - strong relationships between dimensions should outrank shallow repetition
 * - state change is one signal, not the governing signal
 * - chronology is useful, but "first seven events" is not a movie strategy
 *
 * COMPRESSION BOUNDARY:
 * Movie search discovers dramatic material.
 * It does not decide sentence length.
 * Mouth later realizes the selected beats and may combine connected supplied facts
 * into one stronger cut.
 */

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3),
  );

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const NEGATIVE =
  /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;

const POSITIVE =
  /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper)\b/i;

const STATE =
  /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|different|changed|clean|broken|fixed|gone|back|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;

const CONTINUATION =
  /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;

const IDENTITY_CALLBACK =
  /\b(?:same|remember(?:ed|s|ing)?|still)\b/i;

type RealityDimensionKind =
  | "identity"
  | "attribute"
  | "object"
  | "action"
  | "state"
  | "affinity"
  | "relationship"
  | "place"
  | "role"
  | "status"
  | "time"
  | "recurrence"
  | "sensory"
  | "consequence"
  | "pattern";

type RealityDimension = {
  kind: RealityDimensionKind;
  eventIds: string[];
  strength: number;
};

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(event(graph, id)?.label);
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}

function tokens(text: string): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4),
  );
}

function sharedTokenScore(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);

  if (!a.size || !b.size) return 0;

  let shared = 0;

  for (const token of a) {
    if (b.has(token)) shared += 1;
  }

  return shared / Math.max(1, Math.min(a.size, b.size));
}

function explicitSubjectMention(
  labelText: string,
  subject?: string,
): boolean {
  const normalizedSubject = clean(subject).toLowerCase();

  return (
    Boolean(normalizedSubject) &&
    labelText.toLowerCase().includes(normalizedSubject)
  );
}

function eventStructureFor(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function relationBetween(
  graph: RealityGraph,
  left: string,
  right: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === left && relation.to === right) ||
        (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function callbackRelation(
  relation: RealityRelation | undefined,
): boolean {
  return Boolean(
    relation &&
      (relation.kind === "repeats" ||
        relation.kind === "recontextualizes"),
  );
}

function explicitCallback(labelText: string): boolean {
  return CONTINUATION.test(labelText) || IDENTITY_CALLBACK.test(labelText);
}

function callbackPair(
  graph: RealityGraph,
  left: string,
  right: string,
): boolean {
  const relation = relationBetween(graph, left, right);

  if (callbackRelation(relation)) return true;

  return (
    explicitCallback(label(graph, left)) &&
    explicitCallback(label(graph, right))
  );
}

/**
 * Universal subject connectivity.
 *
 * This deliberately remains broader than direct subject mentions, but it is
 * no longer treated as the movie itself. It is only the candidate search field.
 */
function subjectConnectedIds(
  graph: RealityGraph,
  subject?: string,
): string[] {
  const ids = graph.events.map((item) => item.id);

  if (!ids.length) return [];

  if (!clean(subject)) return ids;

  const explicitAnchors = ids.filter((id) =>
    explicitSubjectMention(label(graph, id), subject),
  );

  const selected = new Set<string>(explicitAnchors);

  if (!selected.size) {
    selected.add(ids[0]!);
  } else if (
    position(graph, ids[0]!) === 0 &&
    position(graph, [...selected][0]!) > 0
  ) {
    selected.add(ids[0]!);
  }

  for (const relation of graph.relations) {
    if (!callbackRelation(relation)) continue;

    const leftLabel = label(graph, relation.from);
    const rightLabel = label(graph, relation.to);

    if (
      relation.strength >= 0.88 &&
      (IDENTITY_CALLBACK.test(leftLabel) ||
        IDENTITY_CALLBACK.test(rightLabel))
    ) {
      selected.add(relation.from);
      selected.add(relation.to);
    }
  }

  const queue = [...selected];
  const seen = new Set(queue);

  while (queue.length) {
    const current = queue.shift()!;
    const currentLabel = label(graph, current);

    for (const candidate of ids) {
      if (seen.has(candidate)) continue;

      const relation = relationBetween(
        graph,
        current,
        candidate,
      );

      const relationConnects = Boolean(
        relation &&
          relation.strength >= 0.72 &&
          [
            "repeats",
            "recontextualizes",
            "contrasts",
            "causes",
            "changes",
            "converges",
          ].includes(relation.kind),
      );

      const callbackConnects = callbackPair(
        graph,
        current,
        candidate,
      );

      const sharedMeaning =
        sharedTokenScore(
          currentLabel,
          label(graph, candidate),
        ) >= 0.6;

      if (
        !relationConnects &&
        !callbackConnects &&
        !sharedMeaning
      ) {
        continue;
      }

      selected.add(candidate);
      seen.add(candidate);
      queue.push(candidate);
    }
  }

  return ids.filter((id) => selected.has(id));
}

/**
 * Universal dimension inference.
 *
 * Important:
 * This does not create semantic facts.
 * It classifies already-derived structural anatomy so Movie Search can
 * diversify attention across the supplied reality.
 *
 * It intentionally does NOT contain domain-specific cases such as:
 * pet / restaurant / wedding / real-estate.
 */
function dimensionKindsFor(
  graph: RealityGraph,
  id: string,
): RealityDimensionKind[] {
  const current = event(graph, id);
  const structure = eventStructureFor(graph, id);

  if (!current) return [];

  const kinds = new Set<RealityDimensionKind>();

  const relations = graph.relations.filter(
    (relation) =>
      relation.from === id || relation.to === id,
  );

  const continuity = graph.entityContinuity?.filter(
    (entity) => entity.eventIds.includes(id),
  );

  const eventPatterns = graph.patterns?.filter(
    (pattern) => pattern.eventIds.includes(id),
  );

  if (
    current.entities.length > 0 ||
    (structure?.subjects.length ?? 0) > 0 ||
    (continuity?.length ?? 0) > 0
  ) {
    kinds.add("identity");
  }

  if (
    structure?.semanticTags.some((tag) =>
      /\b(?:trait|attribute|property|character|personality|style|habit|temperament|quality|size|color|type)\b/i.test(
        tag,
      ),
    ) ||
    structure?.states.length ||
    structure?.subjects.length
  ) {
    kinds.add("attribute");
  }

  if ((structure?.objects.length ?? 0) > 0) {
    kinds.add("object");
  }

  if ((structure?.actions.length ?? 0) > 0) {
    kinds.add("action");
  }

  if (
    (structure?.states.length ?? 0) > 0 ||
    current.emotionalState
  ) {
    kinds.add("state");
  }

  if (
    structure?.semanticTags.some((tag) =>
      /\b(?:like|likes|love|loves|prefer|prefers|favorite|affinity|interest|enjoy|enjoys|want|wants)\b/i.test(
        tag,
      ),
    ) ||
    /\b(?:likes?|loves?|prefers?|favorite|enjoys?|wants?)\b/i.test(
      current.label,
    )
  ) {
    kinds.add("affinity");
  }

  if (
    relations.some(
      (relation) =>
        [
          "involves",
          "belongs_to",
          "converges",
          "causes",
          "changes",
          "contrasts",
        ].includes(relation.kind),
    ) ||
    (current.entities.length > 1)
  ) {
    kinds.add("relationship");
  }

  if (
    current.place ||
    structure?.semanticTags.some((tag) =>
      /\b(?:place|location|venue|street|home|house|room|site|neighborhood|destination)\b/i.test(
        tag,
      ),
    )
  ) {
    kinds.add("place");
  }

  if (
    current.goal ||
    structure?.semanticTags.some((tag) =>
      /\b(?:role|job|position|purpose|function|responsibility)\b/i.test(
        tag,
      ),
    )
  ) {
    kinds.add("role");
  }

  if (
    structure?.semanticTags.some((tag) =>
      /\b(?:status|rank|standing|approved|selected|owned|available|open|closed|ready|finished|complete)\b/i.test(
        tag,
      ),
    )
  ) {
    kinds.add("status");
  }

  if ((structure?.temporalMarkers.length ?? 0) > 0) {
    kinds.add("time");
  }

  if (
    (structure?.recurrenceScore ?? 0) >= 0.65 ||
    structure?.semanticTags.some((tag) =>
      /\b(?:recurrence|repetition|repeat|again|return)\b/i.test(
        tag,
      ),
    ) ||
    relations.some((relation) => relation.kind === "repeats")
  ) {
    kinds.add("recurrence");
  }

  if ((structure?.sensoryMarkers.length ?? 0) > 0) {
    kinds.add("sensory");
  }

  if (
    (structure?.transitionScore ?? 0) >= 0.65 ||
    relations.some(
      (relation) =>
        relation.kind === "causes" ||
        relation.kind === "changes",
    )
  ) {
    kinds.add("consequence");
  }

  if (
    (structure?.anomalyScore ?? 0) >= 0.65 ||
    eventPatterns?.some(
      (pattern) => pattern.kind === "anomaly",
    )
  ) {
    kinds.add("pattern");
  }

  if (!kinds.size) {
    kinds.add("pattern");
  }

  return [...kinds];
}

function dimensionStrengthFor(
  graph: RealityGraph,
  id: string,
): number {
  const current = event(graph, id);
  const structure = eventStructureFor(graph, id);

  if (!current) return 0;

  const relationStrength = graph.relations
    .filter(
      (relation) =>
        relation.from === id || relation.to === id,
    )
    .reduce(
      (best, relation) =>
        Math.max(best, relation.strength),
      0,
    );

  return metric(
    0.38 +
      (structure?.salienceScore ?? 0) * 0.22 +
      (structure?.transitionScore ?? 0) * 0.12 +
      (structure?.recurrenceScore ?? 0) * 0.1 +
      (structure?.anomalyScore ?? 0) * 0.1 +
      relationStrength * 0.08 +
      (current.salient ? 0.08 : 0),
  );
}

function buildRealityDimensions(
  graph: RealityGraph,
  ids: readonly string[],
): RealityDimension[] {
  return ids.flatMap((id) =>
    dimensionKindsFor(graph, id).map((kind) => ({
      kind,
      eventIds: [id],
      strength: dimensionStrengthFor(graph, id),
    })),
  );
}

/**
 * How much of the candidate path exposes distinct kinds of reality?
 *
 * This is deliberately not "use every fact".
 * It is "do not spend the entire movie on one narrow interpretation
 * when the supplied world contains more meaningful dimensions."
 */
function dimensionCoverage(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  if (!ids.length) return 0;

  const dimensions = buildRealityDimensions(graph, ids);
  const kinds = unique(
    dimensions.map((dimension) => dimension.kind),
  );

  return metric(
    kinds.length / Math.min(8, 6),
  );
}

/**
 * Rewards transitions into a dimension that was not already dominating
 * the previous portion of the trajectory.
 */
function dimensionNovelty(
  graph: RealityGraph,
  previousIds: readonly string[],
  currentId: string,
): number {
  const prior = new Set(
    previousIds.flatMap((id) =>
      dimensionKindsFor(graph, id),
    ),
  );

  const current = dimensionKindsFor(graph, currentId);

  if (!current.length) return 0;

  const newKinds = current.filter(
    (kind) => !prior.has(kind),
  );

  return metric(
    newKinds.length /
      Math.max(1, current.length),
  );
}

/**
 * Penalizes shallow dimension repetition.
 *
 * Repetition remains fully legal when an actual supplied relationship is
 * developing. We only penalize repeated selection with no relational reason.
 */
function sameDimensionPenalty(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  if (ids.length < 2) return 0;

  let repeated = 0;

  for (let index = 1; index < ids.length; index += 1) {
    const previousId = ids[index - 1]!;
    const currentId = ids[index]!;

    const previousKinds = new Set(
      dimensionKindsFor(graph, previousId),
    );

    const currentKinds = dimensionKindsFor(
      graph,
      currentId,
    );

    if (!currentKinds.length) continue;

    const onlyRepeatedKinds = currentKinds.every(
      (kind) => previousKinds.has(kind),
    );

    const relation = relationBetween(
      graph,
      previousId,
      currentId,
    );

    const meaningfulRelation = Boolean(
      relation &&
        relation.strength >= 0.7 &&
        [
          "repeats",
          "recontextualizes",
          "contrasts",
          "causes",
          "changes",
          "converges",
        ].includes(relation.kind),
    );

    if (onlyRepeatedKinds && !meaningfulRelation) {
      repeated += 1;
    }
  }

  return metric(
    repeated / Math.max(1, ids.length - 1),
  );
}

function forwardScore(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  const positions = ids
    .map((id) => position(graph, id))
    .filter((index) => index >= 0);

  if (positions.length < 2) return 1;

  let forward = 0;

  for (
    let index = 1;
    index < positions.length;
    index += 1
  ) {
    if (
      positions[index]! >
      positions[index - 1]!
    ) {
      forward += 1;
    }
  }

  return metric(
    forward /
      Math.max(1, positions.length - 1),
  );
}

function breadthScore(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  const positions = ids
    .map((id) => position(graph, id))
    .filter((index) => index >= 0);

  if (
    positions.length < 2 ||
    graph.events.length < 2
  ) {
    return 0;
  }

  const span =
    Math.max(...positions) -
    Math.min(...positions);

  return metric(
    span /
      Math.max(1, graph.events.length - 1),
  );
}

function eventSpecificity(
  graph: RealityGraph,
  id: string,
): number {
  const item = event(graph, id);

  if (!item) return 0;

  const structure = eventStructureFor(
    graph,
    id,
  );

  const tokenCount = clean(item.label)
    .split(/\s+/)
    .filter(Boolean).length;

  const entityCount =
    item.entities?.length ?? 0;

  const objectCount =
    structure?.objects.length ?? 0;

  const semanticCount =
    structure?.semanticTags.length ?? 0;

  const actionCount =
    structure?.actions.length ?? 0;

  const stateCount =
    structure?.states.length ?? 0;

  return metric(
    Math.min(
      1,
      tokenCount / 10 +
        entityCount / 14 +
        objectCount / 10 +
        semanticCount / 16 +
        actionCount / 10 +
        stateCount / 10 +
        (item.salient ? 0.16 : 0),
    ),
  );
}

function repetition(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  const labels = ids.map((id) =>
    label(graph, id).toLowerCase(),
  );

  const seen = new Set<string>();
  let dupes = 0;

  for (const value of labels) {
    if (seen.has(value)) dupes += 1;
    seen.add(value);
  }

  return metric(
    dupes /
      Math.max(1, labels.length),
  );
}

function statePair(
  graph: RealityGraph,
  ids: readonly string[],
): { from: string; to: string; score: number } | undefined {
  let best:
    | {
        from: string;
        to: string;
        score: number;
      }
    | undefined;

  for (let i = 0; i < ids.length; i += 1) {
    const from = label(graph, ids[i]!);

    if (!STATE.test(from)) continue;

    const fromNeg = NEGATIVE.test(from);
    const fromPos = POSITIVE.test(from);

    for (
      let j = i + 1;
      j < ids.length;
      j += 1
    ) {
      const to = label(graph, ids[j]!);

      if (
        !STATE.test(to) ||
        from.toLowerCase() ===
          to.toLowerCase()
      ) {
        continue;
      }

      const toNeg = NEGATIVE.test(to);
      const toPos = POSITIVE.test(to);

      const polarity =
        fromNeg && toPos
          ? 1
          : fromNeg !== toNeg
            ? 0.9
            : fromPos !== toPos
              ? 0.84
              : 0.62;

      const spread = Math.min(
        0.08,
        (j - i) * 0.02,
      );

      const score =
        polarity + spread;

      if (
        !best ||
        score > best.score
      ) {
        best = {
          from: ids[i]!,
          to: ids[j]!,
          score,
        };
      }
    }
  }

  return best;
}

function operationFor(
  relation: RealityRelation | undefined,
  previous: string,
  current: string,
  final: boolean,
): LatentMovieTrajectoryStep["operation"] {
  if (final) return "payoff";

  switch (relation?.kind) {
    case "recontextualizes":
      return "reframe";

    case "repeats":
      return "recur";

    case "contrasts":
      return "contrast";

    case "causes":
      return "consequence";

    case "changes":
      return "reveal";

    case "converges":
      return "converge";

    default:
      return STATE.test(previous) &&
        STATE.test(current)
        ? "reveal"
        : "reveal";
  }
}

function questionFor(
  operation: LatentMovieTrajectoryStep["operation"],
): string {
  switch (operation) {
    case "contrast":
      return "What changed the reading?";

    case "reframe":
      return "What becomes newly meaningful?";

    case "recur":
      return "Why does this detail return?";

    case "converge":
      return "What do these details reveal together?";

    case "consequence":
      return "What follows from what is already here?";

    case "payoff":
      return "What remains when the pieces meet?";

    default:
      return "What is becoming noticeable?";
  }
}

function structuralEventPhrase(
  graph: RealityGraph,
  id: string,
): string {
  const current = event(graph, id);
  const structure = eventStructureFor(
    graph,
    id,
  );

  const action =
    structure?.actions[0] ?? "";

  const object =
    structure?.objects[0] ?? "";

  const state =
    structure?.states[0] ??
    current?.emotionalState ??
    "";

  if (action && object) {
    return `${action} involving ${object}`;
  }

  if (action) return action;

  if (object) return `the ${object}`;

  if (state) return `the ${state} state`;

  return label(graph, id);
}

function structuralViewerChange(
  graph: RealityGraph,
  previousId: string | undefined,
  currentId: string,
  relation: RealityRelation | undefined,
  final: boolean,
): string {
  const current = event(
    graph,
    currentId,
  );

  const previous = previousId
    ? event(graph, previousId)
    : undefined;

  const currentStructure =
    eventStructureFor(
      graph,
      currentId,
    );

  const previousStructure =
    previousId
      ? eventStructureFor(
          graph,
          previousId,
        )
      : undefined;

  const currentLabel = label(
    graph,
    currentId,
  );

  const previousLabel = previousId
    ? label(graph, previousId)
    : "";

  const currentStates = unique([
    ...(currentStructure?.states ?? []),
    current?.emotionalState ?? "",
  ].filter(Boolean));

  const previousStates = unique([
    ...(previousStructure?.states ?? []),
    previous?.emotionalState ?? "",
  ].filter(Boolean));

  const currentTags =
    currentStructure?.semanticTags ?? [];

  const currentObjects =
    currentStructure?.objects ?? [];

  const currentActions =
    currentStructure?.actions ?? [];

  if (!previousId) {
    if (currentStates.length) {
      return `Establish the supplied state: ${currentStates[0]}.`;
    }

    if (currentActions.length) {
      return `Establish the supplied action: ${currentActions[0]}.`;
    }

    if (currentObjects.length) {
      return `Establish the supplied detail: ${currentObjects[0]}.`;
    }

    return `Establish the supplied opening: ${currentLabel}.`;
  }

  if (
    relation?.kind ===
    "recontextualizes"
  ) {
    return `The supplied detail is recontextualized by ${currentLabel}.`;
  }

  if (relation?.kind === "repeats") {
    return `The earlier detail returns through ${currentLabel}.`;
  }

  if (relation?.kind === "contrasts") {
    return `The reading changes through the contrast between ${previousLabel} and ${currentLabel}.`;
  }

  if (relation?.kind === "causes") {
    return `The supplied consequence follows ${previousLabel}.`;
  }

  if (relation?.kind === "converges") {
    return `Separate supplied details converge in ${currentLabel}.`;
  }

  if (
    previousStates.length &&
    currentStates.length
  ) {
    const before =
      previousStates[0]!;

    const after =
      currentStates[0]!;

    if (
      before.toLowerCase() !==
      after.toLowerCase()
    ) {
      return `The supplied state shifts from ${before} to ${after}.`;
    }
  }

  if (
    currentStructure &&
    currentStructure.transitionScore >= 0.65
  ) {
    const action =
      currentActions[0];

    const object =
      currentObjects[0];

    if (action && object) {
      return `The supplied transition moves through ${action} involving ${object}.`;
    }

    if (action) {
      return `The supplied transition moves through ${action}.`;
    }

    if (object) {
      return `The supplied transition centers on ${object}.`;
    }
  }

  if (
    currentTags.includes(
      "recurrence",
    )
  ) {
    return `A supplied recurring signal returns in ${currentLabel}.`;
  }

  return final
    ? `Land on the supplied endpoint: ${currentLabel}.`
    : `Advance through the supplied evidence: ${currentLabel}.`;
}

/**
 * Rank the next event in a movie path.
 *
 * This is the critical replacement for:
 *
 *   "sort everything chronologically and take the first seven"
 *
 * The selector now balances:
 * - new reality dimensions
 * - meaningful graph relationship
 * - salience
 * - forward movement
 * - callback value
 * - recurrence
 * - transition
 * - anomaly
 *
 * No lens is involved.
 */
function rankNextMovieEvent(
  graph: RealityGraph,
  orderedIds: readonly string[],
  selected: readonly string[],
): string | undefined {
  if (!selected.length) {
    return orderedIds[0];
  }

  const previousId =
    selected[selected.length - 1]!;

  const remaining = orderedIds.filter(
    (id) => !selected.includes(id),
  );

  if (!remaining.length) return undefined;

  const ranked = remaining
    .map((candidateId) => {
      const relation = relationBetween(
        graph,
        previousId,
        candidateId,
      );

      const structure =
        eventStructureFor(
          graph,
          candidateId,
        );

      const previousPosition =
        position(graph, previousId);

      const candidatePosition =
        position(graph, candidateId);

      const forward =
        candidatePosition > previousPosition
          ? 1
          : 0;

      const novelty =
        dimensionNovelty(
          graph,
          selected,
          candidateId,
        );

      const relationScore = relation
        ? metric(
            relation.strength *
              ([
                "recontextualizes",
                "converges",
                "contrasts",
                "causes",
                "changes",
                "repeats",
              ].includes(
                relation.kind,
              )
                ? 1
                : 0.74),
          )
        : 0.28;

      const salience = metric(
        structure?.salienceScore ??
          (event(graph, candidateId)
            ?.salient
            ? 0.72
            : 0.34),
      );

      const transition = metric(
        structure?.transitionScore ?? 0,
      );

      const recurrence = metric(
        structure?.recurrenceScore ?? 0,
      );

      const anomaly = metric(
        structure?.anomalyScore ?? 0,
      );

      const callback =
        callbackRelation(relation)
          ? 1
          : callbackPair(
                graph,
                previousId,
                candidateId,
              )
            ? 0.9
            : 0;

      const specificity =
        eventSpecificity(
          graph,
          candidateId,
        );

      const distance =
        Math.abs(
          candidatePosition -
            previousPosition,
        );

      const breadthGain =
        metric(
          Math.min(
            1,
            distance /
              Math.max(
                1,
                orderedIds.length - 1,
              ),
          ),
        );

      const score = metric(
        novelty * 0.31 +
          relationScore * 0.24 +
          salience * 0.13 +
          specificity * 0.1 +
          transition * 0.07 +
          recurrence * 0.05 +
          anomaly * 0.04 +
          callback * 0.04 +
          forward * 0.01 +
          breadthGain * 0.01,
      );

      return {
        id: candidateId,
        score,
        novelty,
        relationScore,
        salience,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.novelty - left.novelty ||
        right.relationScore -
          left.relationScore ||
        right.salience - left.salience,
    );

  return ranked[0]?.id;
}

function buildTrajectory(
  graph: RealityGraph,
  ids: readonly string[],
): LatentMovieTrajectoryStep[] {
  if (ids.length < 3) return [];

  const orderedIds = [...ids].sort(
    (left, right) =>
      position(graph, left) -
      position(graph, right),
  );

  /**
   * The movie is bounded.
   * The world is not.
   */
  const maxMovieEvents = Math.min(
    7,
    orderedIds.length,
  );

  const selected: string[] = [];

  const first = orderedIds[0];

  if (!first) return [];

  selected.push(first);

  while (
    selected.length <
      maxMovieEvents
  ) {
    const next =
      rankNextMovieEvent(
        graph,
        orderedIds,
        selected,
      );

    if (!next) break;

    selected.push(next);
  }

  /**
   * If the final supplied event is meaningful and has not naturally won
   * the selection, preserve it as a candidate endpoint rather than allowing
   * broad exploration to accidentally terminate before the supplied end.
   */
  const suppliedEndpoint =
    orderedIds[
      orderedIds.length - 1
    ];

  if (
    suppliedEndpoint &&
    !selected.includes(
      suppliedEndpoint,
    ) &&
    selected.length >= 3
  ) {
    const replaceIndex =
      selected.length - 1;

    const endpointRelation =
      relationBetween(
        graph,
        selected[
          Math.max(
            0,
            replaceIndex - 1,
          )
        ]!,
        suppliedEndpoint,
      );

    const endpointDimensionNovelty =
      dimensionNovelty(
        graph,
        selected,
        suppliedEndpoint,
      );

    const endpointScore = metric(
      (endpointRelation?.strength ??
        0) *
        0.48 +
        endpointDimensionNovelty *
          0.32 +
        eventSpecificity(
          graph,
          suppliedEndpoint,
        ) *
          0.2,
    );

    const currentLast =
      selected[replaceIndex]!;

    const currentLastScore = metric(
      dimensionNovelty(
        graph,
        selected.slice(
          0,
          replaceIndex,
        ),
        currentLast,
      ) *
        0.36 +
        eventSpecificity(
          graph,
          currentLast,
        ) *
          0.24 +
        (
          eventStructureFor(
            graph,
            currentLast,
          )?.salienceScore ?? 0
        ) *
          0.18 +
        (
          eventStructureFor(
            graph,
            currentLast,
          )?.transitionScore ?? 0
        ) *
          0.12 +
        (
          eventStructureFor(
            graph,
            currentLast,
          )?.recurrenceScore ?? 0
        ) *
          0.1,
    );

    if (
      endpointScore >=
        currentLastScore * 0.92
    ) {
      selected[replaceIndex] =
        suppliedEndpoint;
    }
  }

  const patternForEvent = (
    eventId: string,
  ): RealityPattern | undefined =>
    (graph.patterns ?? [])
      .filter((pattern) =>
        pattern.eventIds.includes(
          eventId,
        ),
      )
      .sort(
        (a, b) =>
          b.strength - a.strength,
      )[0];

  const operationForSequence = (
    currentId: string,
    previousId: string | undefined,
    index: number,
    final: boolean,
  ): LatentMovieTrajectoryStep["operation"] => {
    if (final) return "payoff";

    const relation =
      previousId
        ? relationBetween(
            graph,
            previousId,
            currentId,
          )
        : undefined;

    if (relation) {
      const explicit =
        operationFor(
          relation,
          previousId
            ? label(
                graph,
                previousId,
              )
            : "",
          label(graph, currentId),
          false,
        );

      if (explicit !== "reveal") {
        return explicit;
      }
    }

    const currentStructure =
      eventStructureFor(
        graph,
        currentId,
      );

    const previousStructure =
      previousId
        ? eventStructureFor(
            graph,
            previousId,
          )
        : undefined;

    const currentPattern =
      patternForEvent(currentId);

    const hasRecurrence =
      Boolean(
        currentStructure &&
          currentStructure.recurrenceScore >=
            0.65,
      );

    const hasTransition =
      Boolean(
        currentStructure &&
          currentStructure.transitionScore >=
            0.65,
      );

    const hasAnomaly =
      Boolean(
        currentStructure &&
          currentStructure.anomalyScore >=
            0.65,
      );

    const patternKind =
      currentPattern?.kind;

    if (
      patternKind ===
        "recurrence" ||
      hasRecurrence
    ) {
      return "recur";
    }

    if (
      patternKind ===
        "anomaly" ||
      hasAnomaly
    ) {
      return "contrast";
    }

    if (
      patternKind ===
        "transition"
    ) {
      return hasTransition
        ? "reframe"
        : "reveal";
    }

    if (
      patternKind ===
      "tension"
    ) {
      return "contrast";
    }

    const previousStates =
      unique([
        ...(previousStructure?.states ??
          []),
        event(
          graph,
          previousId ?? "",
        )?.emotionalState ?? "",
      ].filter(Boolean));

    const currentStates =
      unique([
        ...(currentStructure?.states ??
          []),
        event(
          graph,
          currentId,
        )?.emotionalState ?? "",
      ].filter(Boolean));

    if (
      previousStates.length &&
      currentStates.length &&
      previousStates[0]!.toLowerCase() !==
        currentStates[0]!.toLowerCase()
    ) {
      return "reframe";
    }

    if (
      currentStructure?.objects
        .length &&
      (
        previousStructure?.actions
          .length ||
        previousStructure?.states
          .length
      )
    ) {
      return "reframe";
    }

    const priorMatches =
      selected
        .slice(0, index)
        .filter(
          (priorId) =>
            sharedTokenScore(
              label(
                graph,
                priorId,
              ),
              label(
                graph,
                currentId,
              ),
            ) >= 0.6,
        );

    if (
      priorMatches.length >= 2
    ) {
      return "converge";
    }

    return hasTransition
      ? "reframe"
      : "reveal";
  };

  return selected.map(
    (id, index) => {
      const final =
        index ===
        selected.length - 1;

      const previousId =
        index > 0
          ? selected[index - 1]
          : undefined;

      const relation =
        previousId
          ? relationBetween(
              graph,
              previousId,
              id,
            )
          : undefined;

      const operation =
        operationForSequence(
          id,
          previousId,
          index,
          final,
        );

      return {
        order: index + 1,
        operation,
        eventIds: [id],
        viewerChange:
          structuralViewerChange(
            graph,
            previousId,
            id,
            relation,
            final,
          ),
        nextQuestion:
          questionFor(operation),
      };
    },
  );
}

function callbackCoverage(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  if (!ids.length) return 0;

  let linked = 0;

  for (const id of ids) {
    if (
      graph.relations.some(
        (relation) =>
          (
            relation.from === id ||
            relation.to === id
          ) &&
          callbackRelation(
            relation,
          ),
      ) ||
      explicitCallback(
        label(graph, id),
      )
    ) {
      linked += 1;
    }
  }

  return metric(
    linked /
      Math.max(1, ids.length),
  );
}

function relationDiversity(
  graph: RealityGraph,
  ids: readonly string[],
): number {
  const kinds = unique(
    ids
      .slice(1)
      .map(
        (id, index) =>
          relationBetween(
            graph,
            ids[index]!,
            id,
          )?.kind,
      )
      .filter(
        (
          kind,
        ): kind is RealityRelation["kind"] =>
          Boolean(kind),
      ),
  );

  return metric(
    kinds.length / 4,
  );
}

function subjectCoverage(
  graph: RealityGraph,
  ids: readonly string[],
  subject?: string,
): number {
  if (
    !clean(subject) ||
    !ids.length
  ) {
    return 1;
  }

  const direct = ids.filter(
    (id) =>
      explicitSubjectMention(
        label(graph, id),
        subject,
      ),
  );

  const directRatio =
    direct.length /
    Math.max(1, ids.length);

  const callbacks =
    callbackCoverage(
      graph,
      ids,
    );

  const firstAnchor = ids.includes(
    graph.events[0]?.id ?? "",
  )
    ? 0.18
    : 0;

  return metric(
    Math.min(
      1,
      directRatio * 0.5 +
        callbacks * 0.24 +
        firstAnchor +
        dimensionCoverage(
          graph,
          ids,
        ) *
          0.1 +
        (1 -
          sameDimensionPenalty(
            graph,
            ids,
          )) *
          0.16,
    ),
  );
}

function ambientNoisePenalty(
  graph: RealityGraph,
  ids: readonly string[],
  subject?: string,
): number {
  if (
    !clean(subject) ||
    !ids.length
  ) {
    return 0;
  }

  let ambient = 0;

  for (const id of ids) {
    const direct =
      explicitSubjectMention(
        label(graph, id),
        subject,
      );

    const callback =
      graph.relations.some(
        (relation) =>
          (
            relation.from === id ||
            relation.to === id
          ) &&
          callbackRelation(
            relation,
          ),
      );

    const structural =
      graph.relations.some(
        (relation) =>
          relation.from === id ||
          relation.to === id,
      );

    if (
      !direct &&
      !callback &&
      !structural
    ) {
      ambient += 1;
    }
  }

  return metric(
    ambient /
      Math.max(1, ids.length),
  );
}

function scoreCandidate(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  subject?: string,
): Omit<
  LatentMovieCandidate,
  "id" | "lens" | "distinctiveness"
> {
  const ids = unique(
    trajectory.flatMap(
      (step) => step.eventIds,
    ),
  );

  const evidence = unique(
    ids
      .map((id) =>
        label(graph, id),
      )
      .filter(Boolean),
  );

  const relations = ids
    .slice(1)
    .map(
      (id, index) =>
        relationBetween(
          graph,
          ids[index]!,
          id,
        ),
    )
    .filter(
      (
        value,
      ): value is RealityRelation =>
        Boolean(value),
    );

  const relationKinds = unique(
    relations.map(
      (relation) =>
        relation.kind,
    ),
  );

  const structures = ids
    .map((id) =>
      eventStructureFor(
        graph,
        id,
      ),
    )
    .filter((value) =>
      Boolean(value),
    );

  const state =
    statePair(
      graph,
      ids,
    );

  const coverage =
    subjectCoverage(
      graph,
      ids,
      subject,
    );

  const noise =
    ambientNoisePenalty(
      graph,
      ids,
      subject,
    );

  const callback =
    callbackCoverage(
      graph,
      ids,
    );

  const dimensions =
    dimensionCoverage(
      graph,
      ids,
    );

  const dimensionRepetition =
    sameDimensionPenalty(
      graph,
      ids,
    );

  /**
   * State is intentionally demoted.
   *
   * It remains valuable when a real state movement exists,
   * but it is no longer allowed to become the entire movie.
   */
  const stateMovement =
    metric(
      Math.min(
        1,
        (state?.score ?? 0) /
          1.08,
      ),
    );

  const structuralAnatomy =
    metric(
      structures.length
        ? structures.reduce(
            (sum, item) =>
              sum +
              item!.transitionScore +
              item!.recurrenceScore +
              item!.anomalyScore +
              item!.salienceScore,
            0,
          ) /
            Math.max(
              1,
              structures.length * 4,
            )
        : 0,
    );

  const relationshipMovement =
    metric(
      relationKinds.length
        ? (
            relations.reduce(
              (sum, relation) =>
                sum +
                relation.strength,
              0,
            ) /
            Math.max(
              1,
              relations.length,
            )
          ) *
            0.7 +
          Math.min(
            1,
            relationKinds.length /
              4,
          ) *
            0.3
        : 0,
    );

  const structuralMovement =
    metric(
      stateMovement * 0.14 +
        relationshipMovement * 0.2 +
        dimensions * 0.28 +
        (1 -
          dimensionRepetition) *
          0.16 +
        structuralAnatomy * 0.18 +
        (ids.length >= 5
          ? 0.04
          : 0),
    );

  const specificity =
    metric(
      ids.reduce(
        (sum, id) =>
          sum +
          eventSpecificity(
            graph,
            id,
          ),
        0,
      ) /
        Math.max(
          1,
          ids.length,
        ),
    );

  const breadth =
    breadthScore(
      graph,
      ids,
    );

  const order =
    forwardScore(
      graph,
      ids,
    );

  const endpoint =
    ids.length &&
    position(
      graph,
      ids[ids.length - 1]!,
    ) ===
      graph.events.length - 1
      ? 1
      : metric(
          (
            position(
              graph,
              ids[
                ids.length - 1
              ]!,
            ) + 1
          ) /
            Math.max(
              1,
              graph.events.length,
            ),
        );

  const operationDiversity =
    relationDiversity(
      graph,
      ids,
    );

  const repetitionRisk =
    repetition(
      graph,
      ids,
    );

  const attentionPotential =
    metric(
      structuralMovement * 0.22 +
        dimensions * 0.18 +
        (1 -
          dimensionRepetition) *
          0.08 +
        breadth * 0.16 +
        specificity * 0.13 +
        order * 0.08 +
        endpoint * 0.05 +
        operationDiversity *
          0.04 +
        callback * 0.06,
    );

  const consequencePotential =
    metric(
      structuralMovement * 0.27 +
        dimensions * 0.1 +
        endpoint * 0.18 +
        specificity * 0.1 +
        breadth * 0.13 +
        callback * 0.1 +
        relationshipMovement *
          0.12,
    );

  const informationValue =
    metric(
      specificity * 0.18 +
        dimensions * 0.22 +
        structuralMovement *
          0.18 +
        breadth * 0.16 +
        attentionPotential *
          0.12 +
        consequencePotential *
          0.08 +
        callback * 0.06,
    );

  const compressionPotential =
    metric(
      Math.min(
        1,
        trajectory.length / 5,
      ) *
        0.28 +
        dimensions * 0.2 +
        structuralMovement *
          0.18 +
        operationDiversity *
          0.14 +
        specificity * 0.1 +
        callback * 0.1,
    );

  const truthRisk = metric(
    1 -
      (
        order * 0.46 +
        specificity * 0.16 +
        endpoint * 0.12 +
        coverage * 0.16 +
        dimensions * 0.1
      ),
  );

  const score =
    metric(
      structuralMovement * 0.19 +
        attentionPotential * 0.15 +
        consequencePotential *
          0.12 +
        dimensions * 0.1 +
        (1 -
          dimensionRepetition) *
          0.07 +
        breadth * 0.09 +
        specificity * 0.08 +
        endpoint * 0.06 +
        operationDiversity *
          0.04 +
        callback * 0.05 +
        coverage * 0.1 -
        repetitionRisk * 0.08 -
        truthRisk * 0.07 -
        noise * 0.07,
    );

  return {
    anchorEventIds:
      ids.slice(0, 2),

    supportingRelationKinds:
      relationKinds,

    trajectory: [
      ...trajectory,
    ],

    payoff:
      evidence[
        evidence.length - 1
      ] ?? "",

    evidence,

    unresolvedQuestion:
      trajectory[
        trajectory.length - 1
      ]?.nextQuestion ??
      "What is becoming noticeable?",

    hypothesis: [
      "The movie is discovered from supplied reality rather than an industry template.",
      "The graph may contain substantially more material than the selected movie.",
      "Movie selection prefers meaningful dimension coverage over shallow repetition.",
      "State movement is one useful signal, not the governing signal.",
      "Subject relevance is evaluated separately from ambient context.",
      "Callbacks may reconnect a detail when the supplied evidence explicitly supports the callback.",
      "Lens is not part of universal discovery; perceptual bias is applied only after candidates exist.",
      "The movie selects dramatic material; sentence length and final compression belong to realization.",
    ],

    truthRisk,

    novelty:
      metric(1 - repetitionRisk),

    specificity,

    informationValue,

    uncertainty:
      metric(
        (1 - order) * 0.24 +
          structuralMovement *
            0.24 +
          attentionPotential *
            0.18 +
          (1 - coverage) *
            0.16 +
          (1 - dimensions) *
            0.18,
      ),

    attentionPotential,

    consequencePotential,

    callbackPotential:
      callback,

    compressionPotential,

    repetitionRisk,

    score,
  };
}

function addTrajectoryCandidate(
  candidates: LatentMovieCandidate[],
  graph: RealityGraph,
  id: string,
  ids: readonly string[],
  subject?: string,
): void {
  const built =
    buildTrajectory(
      graph,
      ids,
    );

  if (
    built.length < 3
  ) {
    return;
  }

  candidates.push({
    id,
    lens: "NONE",
    distinctiveness: 0,
    ...scoreCandidate(
      graph,
      built,
      subject,
    ),
  });
}

export function searchUniversalMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  const limit = Math.max(
    3,
    Math.min(
      12,
      input.limit ?? 8,
    ),
  );

  const sourceIds =
    input.graph.events
      .filter((item) =>
        clean(item.label),
      )
      .map(
        (item) => item.id,
      );

  if (
    sourceIds.length < 3
  ) {
    return [];
  }

  const connectedIds =
    subjectConnectedIds(
      input.graph,
      input.subject,
    );

  const candidates: LatentMovieCandidate[] = [];

  /**
   * FULL REALITY CANDIDATE
   *
   * This stays in the competition deliberately.
   * The movie may use the whole world, but the resulting trajectory remains bounded.
   */
  addTrajectoryCandidate(
    candidates,
    input.graph,
    "movie-source",
    sourceIds,
    input.subject,
  );

  /**
   * SUBJECT-CONNECTED CANDIDATE
   *
   * Useful when the world contains substantial ambient material.
   * It is a candidate, not an automatic winner.
   */
  if (
    connectedIds.length >= 3 &&
    connectedIds.length <
      sourceIds.length
  ) {
    addTrajectoryCandidate(
      candidates,
      input.graph,
      "movie-subject-connected",
      connectedIds,
      input.subject,
    );
  }

  /**
   * STATE TRANSFORMATION CANDIDATE
   *
   * Still available because transformations matter.
   * It no longer receives privileged final authority.
   */
  const stateIds =
    connectedIds.length >= 3
      ? connectedIds
      : sourceIds;

  const state =
    statePair(
      input.graph,
      stateIds,
    );

  if (state) {
    const start =
      position(
        input.graph,
        state.from,
      );

    const end =
      position(
        input.graph,
        state.to,
      );

    const ids =
      stateIds.filter(
        (id) => {
          const pos =
            position(
              input.graph,
              id,
            );

          return (
            pos >= start &&
            pos <= end + 1
          );
        },
      );

    if (
      !ids.includes(
        stateIds[
          stateIds.length - 1
        ]!,
      )
    ) {
      ids.push(
        stateIds[
          stateIds.length - 1
        ]!,
      );
    }

    addTrajectoryCandidate(
      candidates,
      input.graph,
      "movie-transformation",
      ids,
      input.subject,
    );
  }

  /**
   * RELATION-SEED CANDIDATES
   *
   * Explore the actual graph instead of treating chronology as the only path.
   */
  const relationSeeds =
    [
      ...input.graph.relations,
    ]
      .filter(
        (relation) =>
          ![
            "before",
            "after",
            "involves",
            "belongs_to",
          ].includes(
            relation.kind,
          ),
      )
      .sort(
        (a, b) =>
          b.strength -
          a.strength,
      )
      .slice(0, 12);

  for (
    let index = 0;
    index <
    relationSeeds.length;
    index += 1
  ) {
    const relation =
      relationSeeds[index]!;

    const left =
      position(
        input.graph,
        relation.from,
      );

    const right =
      position(
        input.graph,
        relation.to,
      );

    if (
      left < 0 ||
      right < 0
    ) {
      continue;
    }

    const ordered =
      left <= right
        ? [
            relation.from,
            relation.to,
          ]
        : [
            relation.to,
            relation.from,
          ];

    const lower =
      Math.min(
        left,
        right,
      );

    const upper =
      Math.max(
        left,
        right,
      );

    const localIds =
      sourceIds.filter(
        (id) => {
          const pos =
            position(
              input.graph,
              id,
            );

          return (
            pos >= lower &&
            pos <=
              Math.min(
                sourceIds.length -
                  1,
                upper + 2,
              )
          );
        },
      );

    addTrajectoryCandidate(
      candidates,
      input.graph,
      `movie-relation-${index + 1}`,
      unique([
        ...ordered,
        ...localIds,
        sourceIds[
          sourceIds.length - 1
        ]!,
      ]),
      input.subject,
    );
  }

  /**
   * DIMENSION-SEED CANDIDATES
   *
   * This is the important new universal path.
   *
   * We deliberately seed candidates from events that open a dimension
   * not already represented by the strongest relation candidates.
   */
  const dimensionSeedIds =
    sourceIds
      .map((id) => ({
        id,
        dimensions:
          dimensionKindsFor(
            input.graph,
            id,
          ),
        strength:
          dimensionStrengthFor(
            input.graph,
            id,
          ),
      }))
      .sort(
        (left, right) =>
          right.strength -
          left.strength ||
          right.dimensions.length -
            left.dimensions.length,
      )
      .slice(0, 12);

  for (
    let index = 0;
    index <
    dimensionSeedIds.length;
    index += 1
  ) {
    const seed =
      dimensionSeedIds[index]!;

    const seedPosition =
      position(
        input.graph,
        seed.id,
      );

    if (
      seedPosition < 0
    ) {
      continue;
    }

    const localWindow =
      sourceIds.filter(
        (id) => {
          const pos =
            position(
              input.graph,
              id,
            );

          return (
            pos >=
              Math.max(
                0,
                seedPosition - 2,
              ) &&
            pos <=
              Math.min(
                sourceIds.length -
                  1,
                seedPosition + 3,
              )
          );
        },
      );

    const dimensionRanked =
      [...localWindow]
        .sort(
          (left, right) =>
            dimensionStrengthFor(
              input.graph,
              right,
            ) -
            dimensionStrengthFor(
              input.graph,
              left,
            ) ||
            dimensionNovelty(
              input.graph,
              [seed.id],
              right,
            ) -
            dimensionNovelty(
              input.graph,
              [seed.id],
              left,
            ),
        )
        .slice(0, 5);

    addTrajectoryCandidate(
      candidates,
      input.graph,
      `movie-dimension-${index + 1}`,
      unique([
        sourceIds[0]!,
        seed.id,
        ...dimensionRanked,
        sourceIds[
          sourceIds.length - 1
        ]!,
      ]),
      input.subject,
    );
  }

  /**
   * Remove structurally identical trajectories.
   */
  const seen =
    new Set<string>();

  const uniqueCandidates =
    candidates.filter(
      (candidate) => {
        const key =
          candidate.trajectory
            .map(
              (step) =>
                `${step.operation}:${step.eventIds.join(",")}`,
            )
            .join("|");

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);
        return true;
      },
    );

  /**
   * Rank by quality, not just raw score.
   *
   * Dimension coverage and shallow-repetition resistance are now part of
   * the movie identity without becoming a hard "use everything" mandate.
   */
  uniqueCandidates.sort(
    (left, right) =>
      right.score -
        left.score ||
      right.attentionPotential -
        left.attentionPotential ||
      right.informationValue -
        left.informationValue ||
      right.consequencePotential -
        left.consequencePotential,
  );

  /**
   * Select distinct movies.
   *
   * Similarity is measured on selected evidence, not the full graph,
   * because distinct movies may intentionally share much of the same world.
   */
  const selected: LatentMovieCandidate[] =
    [];

  for (
    const candidate of uniqueCandidates
  ) {
    if (
      selected.length >=
      limit
    ) {
      break;
    }

    const similarity =
      selected.length
        ? Math.max(
            ...selected.map(
              (other) => {
                const a =
                  new Set(
                    candidate.evidence.map(
                      clean,
                    ),
                  );

                const b =
                  new Set(
                    other.evidence.map(
                      clean,
                    ),
                  );

                let shared = 0;

                for (
                  const value of a
                ) {
                  if (
                    b.has(value)
                  ) {
                    shared += 1;
                  }
                }

                return (
                  shared /
                  Math.max(
                    1,
                    Math.min(
                      a.size,
                      b.size,
                    ),
                  )
                );
              },
            ),
          )
        : 0;

    candidate.distinctiveness =
      metric(
        1 - similarity,
      );

    candidate.score =
      metric(
        candidate.score *
          0.84 +
          candidate.distinctiveness *
            0.16,
      );

    selected.push(
      candidate,
    );
  }

  return selected
    .sort(
      (left, right) =>
        right.score -
          left.score ||
        right.distinctiveness -
          left.distinctiveness,
    )
    .slice(
      0,
      limit,
    );
}