/**
 * ONE universal movie search.
 *
 * Reality is evidence. Movie search discovers competing ways to look at that
 * evidence; it does not create new facts, actors, objects, chronology, or outcomes.
 *
 * Critical distinction:
 * - subject relevance is not the same thing as mere presence in the input
 * - ambient facts may remain in RealityGraph without becoming the subject's movie
 * - explicit callbacks such as "same" / "remembered" can legitimately reconnect
 *   a detail that was not repeated with the subject's name
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
  RealityPattern,
} from "@qre/contracts";
import { scoreSatanicoObserverInference } from "./authorSatanicoInference.js";
import { searchSatanicoEvidenceSubsets } from "./authorSatanicoEvidenceSearch.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3),
  );

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper)\b/i;
const STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|different|changed|clean|broken|fixed|gone|back|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;
const IDENTITY_CALLBACK = /\b(?:same|remember(?:ed|s|ing)?|still)\b/i;
const ACTION = /\b(?:arriv(?:e|ed|es|ing)|return(?:ed|s|ing)?|came|come|left|leave|went|go|met|meet|talk(?:ed|s|ing)?|spoke|said|did|made|make|gave|give|get|got|found|find|lost|lose|clean(?:ed|s|ing)?|finished|finish|started|start|opened|close(?:d|s|ing)?|walk(?:ed|s|ing)?|ran|run|drove|drive|ate|eat|drank|drink|kiss(?:ed|es|ing)?|married|celebrated|played|play|worked|work|visited|visit|bought|buy|sold|sell|built|build|fixed|fix|paint(?:ed|s|ing)?|wore|wear|used|use|shook|shake|chewed|chew|connected|connect|stayed|stay|wait(?:ed|s|ing)?|called|call|laughed|laugh(?:ed|s)?|cried|cry(?:ing|ied)?|look(?:ed|s|ing)?|felt|feel|seemed|seem|became|become|changed|change|repaired|repair|tested|test|selected|select|cut|shaped|polished|delivered|welcomed|checked|booked|arranged|recommended|guided|updated|reserved|approved|groomed|dyed|tailored|installed|picked)\b/i;
const OBJECT = /\b(?:bow|bath|bathroom|room|mirror|photo|picture|gift|keys?|car|house|home|table|dress|coat|shirt|collar|tool|tools|food|cake|book|letter|ticket|phone|screen|door|window|box|bag|ring|flower|flowers|water|music|blue|red|green|yellow|white|black)\b/i;

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
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function explicitSubjectMention(labelText: string, subject?: string): boolean {
  const normalizedSubject = clean(subject).toLowerCase();
  return Boolean(normalizedSubject) && labelText.toLowerCase().includes(normalizedSubject);
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

function callbackRelation(relation: RealityRelation | undefined): boolean {
  return Boolean(
    relation &&
      (relation.kind === "repeats" || relation.kind === "recontextualizes"),
  );
}

function explicitCallback(labelText: string): boolean {
  return CONTINUATION.test(labelText) || IDENTITY_CALLBACK.test(labelText);
}

function callbackPair(graph: RealityGraph, left: string, right: string): boolean {
  const relation = relationBetween(graph, left, right);
  if (callbackRelation(relation)) return true;
  return explicitCallback(label(graph, left)) && explicitCallback(label(graph, right));
}

/**
 * Find the event cluster that can legitimately belong to the subject's film.
 *
 * The first event is allowed as an implicit subject anchor because callers often
 * provide `subject=...` plus fragments such as "arrived nervous" rather than
 * repeating the subject name in every fragment.
 *
 * We then grow only through strong semantic relationships. Generic lexical
 * overlap is deliberately weak; high-confidence callback edges are allowed to
 * reconnect a detail such as "a blue bow was chosen" with "the same blue bow was
 * still remembered" without dragging unrelated ambient work into Coco's film.
 */
function subjectConnectedIds(graph: RealityGraph, subject?: string): string[] {
  const ids = graph.events.map((item) => item.id);
  if (!ids.length) return [];
  if (!clean(subject)) return ids;

  const explicitAnchors = ids.filter((id) =>
    explicitSubjectMention(label(graph, id), subject),
  );
  const selected = new Set<string>(explicitAnchors);

  if (!selected.size) selected.add(ids[0]!);
  else if (position(graph, ids[0]!) === 0 && position(graph, [...selected][0]!) > 0) {
    selected.add(ids[0]!);
  }

  for (const relation of graph.relations) {
    if (!callbackRelation(relation)) continue;
    const leftLabel = label(graph, relation.from);
    const rightLabel = label(graph, relation.to);
    if (
      relation.strength >= 0.88 &&
      (IDENTITY_CALLBACK.test(leftLabel) || IDENTITY_CALLBACK.test(rightLabel))
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

      const relation = relationBetween(graph, current, candidate);
      const relationConnects = Boolean(
        relation &&
          relation.strength >= 0.72 &&
          [
            "repeats",
            "recontextualizes",
            "contrasts",
            "causes",
            "changes",
          ].includes(relation.kind),
      );
      const callbackConnects = callbackPair(graph, current, candidate);
      const sharedMeaning = sharedTokenScore(currentLabel, label(graph, candidate)) >= 0.6;

      if (!relationConnects && !callbackConnects && !sharedMeaning) continue;

      selected.add(candidate);
      seen.add(candidate);
      queue.push(candidate);
    }
  }

  return ids.filter((id) => selected.has(id));
}

function forwardScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((index) => index >= 0);
  if (positions.length < 2) return 1;
  let forward = 0;
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index]! > positions[index - 1]!) forward += 1;
  }
  return metric(forward / Math.max(1, positions.length - 1));
}

function breadthScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((index) => index >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  const span = Math.max(...positions) - Math.min(...positions);
  return metric(span / Math.max(1, graph.events.length - 1));
}

function eventSpecificity(graph: RealityGraph, id: string): number {
  const item = event(graph, id);
  if (!item) return 0;
  const structure = eventStructureFor(graph, id);
  const tokenCount = clean(item.label).split(/\s+/).filter(Boolean).length;
  const entityCount = item.entities?.length ?? 0;
  const objectCount = structure?.objects.length ?? 0;
  const semanticCount = structure?.semanticTags.length ?? 0;
  return metric(
    Math.min(
      1,
      tokenCount / 10 +
        entityCount / 14 +
        objectCount / 10 +
        semanticCount / 16 +
        (item.salient ? 0.16 : 0),
    ),
  );
}

function repetition(graph: RealityGraph, ids: readonly string[]): number {
  const labels = ids.map((id) => label(graph, id).toLowerCase());
  const seen = new Set<string>();
  let dupes = 0;
  for (const value of labels) {
    if (seen.has(value)) dupes += 1;
    seen.add(value);
  }
  return metric(dupes / Math.max(1, labels.length));
}

function statePair(
  graph: RealityGraph,
  ids: readonly string[],
): { from: string; to: string; score: number } | undefined {
  let best: { from: string; to: string; score: number } | undefined;

  for (let i = 0; i < ids.length; i += 1) {
    const from = label(graph, ids[i]!);
    if (!STATE.test(from)) continue;
    const fromNeg = NEGATIVE.test(from);
    const fromPos = POSITIVE.test(from);

    for (let j = i + 1; j < ids.length; j += 1) {
      const to = label(graph, ids[j]!);
      if (!STATE.test(to) || from.toLowerCase() === to.toLowerCase()) continue;

      const toNeg = NEGATIVE.test(to);
      const toPos = POSITIVE.test(to);
      const polarity = fromNeg && toPos
        ? 1
        : fromNeg !== toNeg
          ? 0.9
          : fromPos !== toPos
            ? 0.84
            : 0.62;
      const spread = Math.min(0.08, (j - i) * 0.02);
      const score = polarity + spread;
      if (!best || score > best.score) best = { from: ids[i]!, to: ids[j]!, score };
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
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    case "contrasts": return "contrast";
    case "causes": return "consequence";
    case "changes": return "reveal";
    case "converges": return "converge";
    default:
      return STATE.test(previous) && STATE.test(current) ? "reveal" : "reveal";
  }
}

function questionFor(operation: LatentMovieTrajectoryStep["operation"]): string {
  switch (operation) {
    case "contrast": return "What changed the reading?";
    case "reframe": return "What becomes newly meaningful?";
    case "recur": return "Why does this detail return?";
    case "converge": return "What do these details reveal together?";
    case "consequence": return "What follows from what is already here?";
    case "payoff": return "What remains when the pieces meet?";
    default: return "What is becoming noticeable?";
  }
}

function structuralEventPhrase(graph: RealityGraph, id: string): string {
  const current = event(graph, id);
  const structure = eventStructureFor(graph, id);
  const action = structure?.actions[0] ?? "";
  const object = structure?.objects[0] ?? "";
  const state = structure?.states[0] ?? current?.emotionalState ?? "";

  if (action && object) return `${action} involving ${object}`;
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
  const current = event(graph, currentId);
  const previous = previousId ? event(graph, previousId) : undefined;
  const currentStructure = eventStructureFor(graph, currentId);
  const previousStructure = previousId ? eventStructureFor(graph, previousId) : undefined;
  const currentLabel = label(graph, currentId);
  const previousLabel = previousId ? label(graph, previousId) : "";
  const currentStates = unique([...(currentStructure?.states ?? []), current?.emotionalState ?? ""].filter(Boolean));
  const previousStates = unique([...(previousStructure?.states ?? []), previous?.emotionalState ?? ""].filter(Boolean));
  const currentTags = currentStructure?.semanticTags ?? [];
  const currentObjects = currentStructure?.objects ?? [];
  const currentActions = currentStructure?.actions ?? [];

  if (!previousId) {
    if (currentStates.length) return `Establish the supplied state: ${currentStates[0]}.`;
    if (currentActions.length) return `Establish the supplied action: ${currentActions[0]}.`;
    if (currentObjects.length) return `Establish the supplied detail: ${currentObjects[0]}.`;
    return `Establish the supplied opening: ${currentLabel}.`;
  }
  if (relation?.kind === "recontextualizes") return `The supplied detail is recontextualized by ${currentLabel}.`;
  if (relation?.kind === "repeats") return `The earlier detail returns through ${currentLabel}.`;
  if (relation?.kind === "contrasts") return `The reading changes through the contrast between ${previousLabel} and ${currentLabel}.`;
  if (relation?.kind === "causes") return `The supplied consequence follows ${previousLabel}.`;
  if (relation?.kind === "converges") return `Separate supplied details converge in ${currentLabel}.`;
  if (previousStates.length && currentStates.length && previousStates[0]!.toLowerCase() !== currentStates[0]!.toLowerCase()) {
    return `The supplied state shifts from ${previousStates[0]} to ${currentStates[0]}.`;
  }
  if (currentStructure && currentStructure.transitionScore >= 0.65) {
    const action = currentActions[0];
    const object = currentObjects[0];
    if (action && object) return `The supplied transition moves through ${action} involving ${object}.`;
    if (action) return `The supplied transition moves through ${action}.`;
    if (object) return `The supplied transition centers on ${object}.`;
  }
  if (currentTags.includes("recurrence")) return `A supplied recurring signal returns in ${currentLabel}.`;
  return final ? `Land on the supplied endpoint: ${currentLabel}.` : `Advance through the supplied evidence: ${currentLabel}.`;
}
function buildTrajectory(graph: RealityGraph, ids: readonly string[]): LatentMovieTrajectoryStep[] {
  if (ids.length < 3) return [];
  const selected = [...ids].sort((left, right) => position(graph, left) - position(graph, right)).slice(0, 7);
  const patterns = graph.patterns ?? [];
  const patternForEvent = (eventId: string): RealityPattern | undefined => patterns.filter((pattern) => pattern.eventIds.includes(eventId)).sort((a, b) => b.strength - a.strength)[0];
  const strongRelation = (left: string, right: string): RealityRelation | undefined => relationBetween(graph, left, right);

  const operationForSequence = (
    currentId: string,
    previousId: string | undefined,
    index: number,
    final: boolean,
  ): LatentMovieTrajectoryStep["operation"] => {
    if (final) return "payoff";
    const relation = previousId ? strongRelation(previousId, currentId) : undefined;
    if (relation) {
      const explicit = operationFor(relation, previousId ? label(graph, previousId) : "", label(graph, currentId), false);
      if (explicit !== "reveal") return explicit;
    }

    const currentStructure = eventStructureFor(graph, currentId);
    const previousStructure = previousId ? eventStructureFor(graph, previousId) : undefined;
    const currentPattern = patternForEvent(currentId);
    const hasRecurrence = Boolean(currentStructure && currentStructure.recurrenceScore >= 0.65);
    const hasTransition = Boolean(currentStructure && currentStructure.transitionScore >= 0.65);
    const hasAnomaly = Boolean(currentStructure && currentStructure.anomalyScore >= 0.65);
    const patternKind = currentPattern?.kind;

    if (patternKind === "recurrence" || hasRecurrence) return "recur";
    if (patternKind === "anomaly" || hasAnomaly) return "contrast";
    if (patternKind === "transition") return hasTransition ? "reframe" : "reveal";
    if (patternKind === "tension") return "contrast";

    const previousStates = unique([...(previousStructure?.states ?? []), event(graph, previousId ?? "")?.emotionalState ?? ""].filter(Boolean));
    const currentStates = unique([...(currentStructure?.states ?? []), event(graph, currentId)?.emotionalState ?? ""].filter(Boolean));
    if (previousStates.length && currentStates.length && previousStates[0]!.toLowerCase() !== currentStates[0]!.toLowerCase()) return "reframe";

    if (currentStructure?.objects.length && (previousStructure?.actions.length || previousStructure?.states.length)) return "reframe";

    const priorMatches = selected.slice(0, index).filter((priorId) => sharedTokenScore(label(graph, priorId), label(graph, currentId)) >= 0.6);
    if (priorMatches.length >= 2) return "converge";
    return hasTransition ? "reframe" : "reveal";
  };

  return selected.map((id, index) => {
    const final = index === selected.length - 1;
    const previousId = index > 0 ? selected[index - 1] : undefined;
    const relation = previousId ? strongRelation(previousId, id) : undefined;
    const operation = operationForSequence(id, previousId, index, final);
    return {
      order: index + 1,
      operation,
      eventIds: [id],
      viewerChange: structuralViewerChange(graph, previousId, id, relation, final),
      nextQuestion: questionFor(operation),
    };
  });
}

function callbackCoverage(graph: RealityGraph, ids: readonly string[]): number {
  if (!ids.length) return 0;
  let linked = 0;
  for (const id of ids) {
    if (graph.relations.some((relation) => (relation.from === id || relation.to === id) && callbackRelation(relation)) || explicitCallback(label(graph, id))) linked += 1;
  }
  return metric(linked / ids.length);
}

function relationDiversity(graph: RealityGraph, ids: readonly string[]): number {
  const kinds = unique(ids.slice(1).map((id, index) => relationBetween(graph, ids[index]!, id)?.kind).filter((kind): kind is RealityRelation["kind"] => Boolean(kind)));
  return metric(kinds.length / 4);
}

function subjectCoverage(graph: RealityGraph, ids: readonly string[], subject?: string): number {
  if (!clean(subject) || !ids.length) return 1;
  const direct = ids.filter((id) => explicitSubjectMention(label(graph, id), subject));
  const directRatio = direct.length / ids.length;
  const callbacks = callbackCoverage(graph, ids);
  const firstAnchor = ids.includes(graph.events[0]?.id ?? "") ? 0.18 : 0;
  return metric(Math.min(1, directRatio * 0.56 + callbacks * 0.26 + firstAnchor));
}

function ambientNoisePenalty(graph: RealityGraph, ids: readonly string[], subject?: string): number {
  if (!clean(subject) || !ids.length) return 0;
  let ambient = 0;
  for (const id of ids) {
    const direct = explicitSubjectMention(label(graph, id), subject);
    const callback = graph.relations.some((relation) => (relation.from === id || relation.to === id) && callbackRelation(relation));
    const structural = graph.relations.some((relation) => relation.from === id || relation.to === id);
    if (!direct && !callback && !structural) ambient += 1;
  }
  return metric(ambient / ids.length);
}

function scoreCandidate(graph: RealityGraph, trajectory: readonly LatentMovieTrajectoryStep[], lens?: string, subject?: string): Omit<LatentMovieCandidate, "id" | "lens" | "distinctiveness"> {
  const ids = unique(trajectory.flatMap((step) => step.eventIds));
  const evidence = unique(ids.map((id) => label(graph, id)).filter(Boolean));
  const relations = ids.slice(1).map((id, index) => relationBetween(graph, ids[index]!, id)).filter((value): value is RealityRelation => Boolean(value));
  const relationKinds = unique(relations.map((relation) => relation.kind));
  const structures = ids.map((id) => eventStructureFor(graph, id)).filter((value) => Boolean(value));
  const state = statePair(graph, ids);
  const coverage = subjectCoverage(graph, ids, subject);
  const noise = ambientNoisePenalty(graph, ids, subject);
  const callback = callbackCoverage(graph, ids);

  const structuralMovement = metric(
    (state?.score ?? 0) * 0.4 +
      Math.min(1, relationKinds.length / 3) * 0.2 +
      Math.min(1, structures.reduce((sum, item) => sum + item!.transitionScore + item!.recurrenceScore, 0) / Math.max(1, structures.length * 2)) * 0.22 +
      (ids.length >= 5 ? 0.18 : 0),
  );
  const specificity = metric(ids.reduce((sum, id) => sum + eventSpecificity(graph, id), 0) / Math.max(1, ids.length));
  const breadth = breadthScore(graph, ids);
  const order = forwardScore(graph, ids);
  const endpoint = ids.length && position(graph, ids[ids.length - 1]!) === graph.events.length - 1
    ? 1
    : metric((position(graph, ids[ids.length - 1]!) + 1) / Math.max(1, graph.events.length));
  const operationDiversity = relationDiversity(graph, ids);
  const repetitionRisk = repetition(graph, ids);
  const attentionPotential = metric(structuralMovement * 0.28 + breadth * 0.18 + specificity * 0.14 + order * 0.1 + endpoint * 0.08 + operationDiversity * 0.08 + callback * 0.08 + coverage * 0.06);
  const consequencePotential = metric(structuralMovement * 0.34 + endpoint * 0.2 + specificity * 0.12 + breadth * 0.14 + callback * 0.1 + coverage * 0.1);
  const informationValue = metric(specificity * 0.22 + structuralMovement * 0.3 + breadth * 0.18 + attentionPotential * 0.14 + consequencePotential * 0.1 + callback * 0.06);
  const compressionPotential = metric(Math.min(1, trajectory.length / 5) * 0.34 + structuralMovement * 0.24 + operationDiversity * 0.18 + specificity * 0.14 + callback * 0.1);
  const truthRisk = metric(1 - (order * 0.52 + specificity * 0.18 + endpoint * 0.12 + coverage * 0.18));

  const baseScore = metric(
    structuralMovement * 0.23 +
      attentionPotential * 0.17 +
      consequencePotential * 0.13 +
      breadth * 0.11 +
      specificity * 0.1 +
      endpoint * 0.07 +
      operationDiversity * 0.05 +
      callback * 0.06 +
      coverage * 0.12 -
      repetitionRisk * 0.08 -
      truthRisk * 0.07 -
      noise * 0.1,
  );

  const provisional: LatentMovieCandidate = {
    id: "provisional",
    lens: clean(lens) || "NONE",
    distinctiveness: 0,
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: relationKinds,
    trajectory: [...trajectory],
    payoff: evidence[evidence.length - 1] ?? "",
    unresolvedQuestion: trajectory[trajectory.length - 1]?.nextQuestion ?? "What is becoming noticeable?",
    evidence,
    hypothesis: [],
    truthRisk,
    novelty: metric(1 - repetitionRisk),
    specificity,
    informationValue,
    uncertainty: metric((1 - order) * 0.3 + structuralMovement * 0.3 + attentionPotential * 0.2 + (1 - coverage) * 0.2),
    attentionPotential,
    consequencePotential,
    callbackPotential: callback,
    compressionPotential,
    repetitionRisk,
    observerInferencePotential: 0,
    score: baseScore,
  };

  const observerInferencePotential = scoreSatanicoObserverInference(graph, provisional);
  const score = metric(
    baseScore * 0.78 +
      observerInferencePotential * 0.22,
  );

  return {
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: relationKinds,
    trajectory: [...trajectory],
    payoff: evidence[evidence.length - 1] ?? "",
    evidence,
    unresolvedQuestion: trajectory[trajectory.length - 1]?.nextQuestion ?? "What is becoming noticeable?",
    hypothesis: [
      "The movie is discovered from supplied reality rather than an industry template.",
      "Subject relevance is evaluated separately from ambient context.",
      "Callbacks may reconnect a detail when the supplied evidence explicitly supports the callback.",
      "The lens changes framing, never concrete reality.",
      "Satanico prefers grounded relationships that leave the strongest inference unsaid.",
    ],
    truthRisk,
    novelty: metric(1 - repetitionRisk),
    specificity,
    informationValue,
    uncertainty: metric((1 - order) * 0.3 + structuralMovement * 0.3 + attentionPotential * 0.2 + (1 - coverage) * 0.2),
    attentionPotential,
    consequencePotential,
    callbackPotential: callback,
    compressionPotential,
    repetitionRisk,
    observerInferencePotential,
    score,
  };
}

function addTrajectoryCandidate(candidates: LatentMovieCandidate[], graph: RealityGraph, id: string, ids: readonly string[], lens?: string, subject?: string): void {
  const built = buildTrajectory(graph, ids);
  if (built.length < 3) return;
  candidates.push({ id, lens: clean(lens) || "NONE", distinctiveness: 0, ...scoreCandidate(graph, built, lens, subject) });
}

function addSatanicoEvidenceCandidates(
  candidates: LatentMovieCandidate[],
  graph: RealityGraph,
  lens?: string,
  subject?: string,
  limit = 8,
): void {
  const subsets = searchSatanicoEvidenceSubsets(graph, limit);
  for (let index = 0; index < subsets.length; index += 1) {
    addTrajectoryCandidate(
      candidates,
      graph,
      `movie-satanico-${index + 1}`,
      subsets[index]!,
      lens,
      subject,
    );
  }
}

export function searchUniversalMovieCandidates(input: { graph: RealityGraph; subject?: string; lens?: string; limit?: number }): LatentMovieCandidate[] {
  const limit = Math.max(3, Math.min(12, input.limit ?? 8));
  const sourceIds = input.graph.events.filter((item) => clean(item.label)).map((item) => item.id);
  if (sourceIds.length < 3) return [];
  const connectedIds = subjectConnectedIds(input.graph, input.subject);
  const candidates: LatentMovieCandidate[] = [];

  addTrajectoryCandidate(candidates, input.graph, "movie-source", sourceIds, input.lens, input.subject);

  if (connectedIds.length >= 3 && connectedIds.length < sourceIds.length) {
    addTrajectoryCandidate(candidates, input.graph, "movie-subject-connected", connectedIds, input.lens, input.subject);
  }

  const stateIds = connectedIds.length >= 3 ? connectedIds : sourceIds;
  const state = statePair(input.graph, stateIds);
  if (state) {
    const start = position(input.graph, state.from);
    const end = position(input.graph, state.to);
    const ids = stateIds.filter((id) => {
      const pos = position(input.graph, id);
      return pos >= start && pos <= end + 1;
    });
    if (!ids.includes(stateIds[stateIds.length - 1]!)) ids.push(stateIds[stateIds.length - 1]!);
    addTrajectoryCandidate(candidates, input.graph, "movie-transformation", ids, input.lens, input.subject);
  }

  addSatanicoEvidenceCandidates(
    candidates,
    input.graph,
    input.lens,
    input.subject,
    Math.max(4, limit),
  );

  const relationSeeds = [...input.graph.relations]
    .filter((relation) => !["before", "after", "involves", "belongs_to"].includes(relation.kind))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);

  for (let index = 0; index < relationSeeds.length; index += 1) {
    const relation = relationSeeds[index]!;
    const left = position(input.graph, relation.from);
    const right = position(input.graph, relation.to);
    if (left < 0 || right < 0) continue;
    const ordered = left <= right ? [relation.from, relation.to] : [relation.to, relation.from];
    const lower = Math.min(left, right);
    const upper = Math.max(left, right);
    const localIds = sourceIds.filter((id) => {
      const pos = position(input.graph, id);
      return pos >= lower && pos <= Math.min(sourceIds.length - 1, upper + 2);
    });
    addTrajectoryCandidate(candidates, input.graph, `movie-relation-${index + 1}`, unique([...ordered, ...localIds, sourceIds[sourceIds.length - 1]!]), input.lens, input.subject);
  }

  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((candidate) => {
    const key = candidate.trajectory.map((step) => `${step.operation}:${step.eventIds.join(",")}`).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueCandidates.sort((left, right) =>
    right.score - left.score ||
    (right.observerInferencePotential ?? 0) - (left.observerInferencePotential ?? 0) ||
    right.attentionPotential - left.attentionPotential ||
    right.informationValue - left.informationValue,
  );

  const selected: LatentMovieCandidate[] = [];
  for (const candidate of uniqueCandidates) {
    if (selected.length >= limit) break;
    const similarity = selected.length
      ? Math.max(...selected.map((other) => {
          const a = new Set(candidate.evidence.map(clean));
          const b = new Set(other.evidence.map(clean));
          let shared = 0;
          for (const value of a) if (b.has(value)) shared += 1;
          return shared / Math.max(1, Math.min(a.size, b.size));
        }))
      : 0;
    candidate.distinctiveness = metric(1 - similarity);
    candidate.score = metric(candidate.score * 0.8 + candidate.distinctiveness * 0.08 + (candidate.observerInferencePotential ?? 0) * 0.12);
    selected.push(candidate);
  }

  return selected
    .sort((left, right) =>
      right.score - left.score ||
      (right.observerInferencePotential ?? 0) - (left.observerInferencePotential ?? 0) ||
      right.distinctiveness - left.distinctiveness,
    )
    .slice(0, limit);
}
