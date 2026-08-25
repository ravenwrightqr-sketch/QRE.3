/**
 * QRE UNIVERSAL MOVIE SEARCH
 *
 * Deterministic trajectory search over the immutable RealityGraph.
 * The model is not asked to invent a movie here.
 *
 * Search dimensions:
 * - relation-centered hypotheses
 * - contrast / recontextualization / change / recurrence / convergence
 * - multiple evidence paths to a graph-derived payoff
 * - lens-specific interpretation without lens-specific facts
 * - trajectory-level scoring rather than isolated sentence scoring
 */

import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const lower = (value: unknown): string => clean(value).toLowerCase();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at",
  "for", "with", "from", "by", "through", "after", "before", "then", "now",
  "very", "just", "still", "again", "this", "that", "it", "is", "are", "was",
  "were", "be", "been", "being", "as", "into", "my", "your", "our", "their",
  "his", "her", "its", "he", "she", "they", "them", "you", "we", "me",
]);

const LENS_HINTS: Record<string, string[]> = {
  funny: ["contrast", "status_inversion", "understatement", "callback"],
  comedy: ["contrast", "status_inversion", "understatement", "callback"],
  humorous: ["contrast", "status_inversion", "understatement", "callback"],
  romance: ["convergence", "recurrence", "recontextualization", "consequence"],
  romantic: ["convergence", "recurrence", "recontextualization", "consequence"],
  horror: ["contrast", "recontextualization", "uncertainty", "consequence"],
  creepy: ["contrast", "recontextualization", "uncertainty", "consequence"],
  sentimental: ["recurrence", "convergence", "recontextualization", "consequence"],
  emotional: ["recurrence", "convergence", "recontextualization", "consequence"],
  absurd: ["contrast", "status_inversion", "convergence", "callback"],
  demented: ["contrast", "status_inversion", "consequence", "recontextualization"],
  chaotic: ["contrast", "consequence", "convergence", "callback"],
  neutral: ["recontextualization", "change", "consequence", "convergence"],
};

function tokenize(text: string): string[] {
  return unique(
    lower(text)
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOP.has(token)),
  ).slice(0, 18);
}

function tokenOverlap(a: string, b: string): number {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(left.size, right.size));
}

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function relationBetween(
  graph: RealityGraph,
  from: string,
  to: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === from && relation.to === to) ||
        (relation.from === to && relation.to === from),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function incidentRelations(
  graph: RealityGraph,
  eventId: string,
): RealityRelation[] {
  return graph.relations.filter(
    (relation) => relation.from === eventId || relation.to === eventId,
  );
}

function relationWeight(kind: RealityRelation["kind"]): number {
  switch (kind) {
    case "contrasts": return 1;
    case "recontextualizes": return 0.96;
    case "changes": return 0.92;
    case "repeats": return 0.86;
    case "converges": return 0.82;
    case "before":
    case "after": return 0.72;
    case "involves": return 0.62;
    default: return 0.55;
  }
}

function operationForRelation(kind: RealityRelation["kind"]): LatentMovieTrajectoryStep["operation"] {
  switch (kind) {
    case "contrasts": return "contrast";
    case "recontextualizes": return "reframe";
    case "changes": return "reveal";
    case "repeats": return "recur";
    case "converges": return "converge";
    case "before":
    case "after": return "consequence";
    case "involves": return "reveal";
    default: return "converge";
  }
}

function lensKeywords(lens?: string): string[] {
  const text = lower(lens);
  if (!text || text === "let qre decide") return LENS_HINTS.neutral;
  const out: string[] = [];
  for (const [key, values] of Object.entries(LENS_HINTS)) {
    if (text.includes(key)) out.push(...values);
  }
  return unique(out.length ? out : LENS_HINTS.neutral);
}

function relationPreference(kind: RealityRelation["kind"], lens?: string): number {
  const preferred = lensKeywords(lens);
  const aliases: Record<RealityRelation["kind"], string[]> = {
    contrasts: ["contrast", "status_inversion"],
    recontextualizes: ["recontextualization"],
    changes: ["change", "consequence"],
    repeats: ["recurrence", "callback"],
    converges: ["convergence"],
    before: ["consequence"],
    after: ["consequence"],
    involves: ["convergence"],
  };
  return aliases[kind].some((item) => preferred.includes(item)) ? 1 : 0.72;
}

function eventSpecificity(graph: RealityGraph, eventId: string): number {
  const item = event(graph, eventId);
  if (!item) return 0;
  return metric(
    Math.min(1, tokenize(item.label).length * 0.09 + Math.min(8, item.entities.length) * 0.045),
  );
}

function graphCentrality(graph: RealityGraph, eventId: string): number {
  const relations = incidentRelations(graph, eventId);
  if (!relations.length) return 0;
  return metric(
    relations.reduce((sum, relation) => sum + relation.strength * relationWeight(relation.kind), 0) /
      Math.max(1, relations.length),
  );
}

function likelyEndpoint(graph: RealityGraph, eventId: string): number {
  const incoming = graph.relations.filter((relation) => relation.to === eventId);
  const meaningfulIncoming = incoming.filter((relation) =>
    ["changes", "recontextualizes", "contrasts", "converges", "repeats"].includes(relation.kind),
  );
  const stateBonus = event(graph, eventId)?.emotionalState ? 0.16 : 0;
  return metric(
    stateBonus +
      meaningfulIncoming.reduce((sum, relation) => sum + relation.strength * relationWeight(relation.kind), 0) * 0.18 +
      graphCentrality(graph, eventId) * 0.22,
  );
}

function semanticTurn(
  graph: RealityGraph,
  relation: RealityRelation,
): string {
  const from = event(graph, relation.from);
  const to = event(graph, relation.to);
  const fromLabel = clean(from?.label);
  const toLabel = clean(to?.label);

  switch (relation.kind) {
    case "contrasts":
      return `the later supplied detail overturns the expectation created by ${fromLabel}`;
    case "recontextualizes":
      return `the later supplied detail changes the meaning of ${fromLabel}`;
    case "changes":
      return `the supplied state shifts from ${fromLabel} toward ${toLabel}`;
    case "repeats":
      return `a recurring detail gains new meaning through ${toLabel}`;
    case "converges":
      return `${fromLabel} and ${toLabel} become meaningfully connected`;
    case "before":
    case "after":
      return `${fromLabel} changes what ${toLabel} means afterward`;
    case "involves":
      return `${fromLabel} becomes meaningful through its relationship to ${toLabel}`;
    default:
      return `the relationship between ${fromLabel} and ${toLabel} changes the reading`;
  }
}

function nextQuestion(relation: RealityRelation): string {
  switch (relation.kind) {
    case "contrasts": return "What expectation changes here?";
    case "recontextualizes": return "What does this make newly meaningful?";
    case "changes": return "What becomes possible or different now?";
    case "repeats": return "Why does this matter more now?";
    case "converges": return "What becomes connected here?";
    case "before":
    case "after": return "What consequence follows from this relationship?";
    default: return "What does this relationship make newly meaningful?";
  }
}

function chooseOpeningEvent(
  graph: RealityGraph,
  relation: RealityRelation,
): string {
  const fromScore = eventSpecificity(graph, relation.from) * 0.42 + graphCentrality(graph, relation.from) * 0.36;
  const toScore = eventSpecificity(graph, relation.to) * 0.42 + graphCentrality(graph, relation.to) * 0.36;
  return fromScore >= toScore ? relation.from : relation.to;
}

function choosePayoffEvent(
  graph: RealityGraph,
  used: readonly string[],
): string | undefined {
  const usedSet = new Set(used);
  const candidates = graph.events
    .filter((item) => !usedSet.has(item.id))
    .map((item) => ({
      id: item.id,
      score:
        likelyEndpoint(graph, item.id) * 0.55 +
        eventSpecificity(graph, item.id) * 0.22 +
        graphCentrality(graph, item.id) * 0.23,
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.id;
}

function buildPath(
  graph: RealityGraph,
  focus: RealityRelation,
  lens?: string,
): LatentMovieTrajectoryStep[] {
  const openingId = chooseOpeningEvent(graph, focus);
  const opening = event(graph, openingId);
  if (!opening) return [];

  const steps: LatentMovieTrajectoryStep[] = [
    {
      order: 1,
      operation: "establish",
      eventIds: [opening.id],
      viewerChange: `Establish supplied evidence: ${opening.label}.`,
      nextQuestion: "What relationship deserves the next cut?",
    },
  ];

  const turnEvent = focus.from === openingId ? focus.to : focus.from;
  const turnEventData = event(graph, turnEvent);
  if (!turnEventData) return steps;

  const relationForTurn = relationBetween(graph, openingId, turnEvent);
  if (relationForTurn) {
    steps.push({
      order: 2,
      operation: operationForRelation(relationForTurn.kind),
      eventIds: [openingId, turnEvent],
      viewerChange: semanticTurn(graph, relationForTurn),
      nextQuestion: nextQuestion(relationForTurn),
    });
  }

  const used = steps.flatMap((step) => step.eventIds);
  const bridgeCandidates = graph.relations
    .filter((relation) =>
      used.includes(relation.from) !== used.includes(relation.to),
    )
    .map((relation) => ({
      relation,
      score:
        relation.strength * 0.5 +
        relationWeight(relation.kind) * 0.24 +
        relationPreference(relation.kind, lens) * 0.16 +
        (relation.kind === focus.kind ? 0.1 : 0),
    }))
    .filter(({ relation }) => ![focus.from, focus.to].includes(relation.from) || ![focus.from, focus.to].includes(relation.to))
    .sort((a, b) => b.score - a.score);

  const bridge = bridgeCandidates[0]?.relation;
  if (bridge) {
    const bridgeFrom = used.includes(bridge.from) ? bridge.from : bridge.to;
    const bridgeTo = bridgeFrom === bridge.from ? bridge.to : bridge.from;
    if (bridgeTo !== turnEvent) {
      steps.push({
        order: steps.length + 1,
        operation: operationForRelation(bridge.kind),
        eventIds: [bridgeFrom, bridgeTo],
        viewerChange: semanticTurn(graph, bridge),
        nextQuestion: nextQuestion(bridge),
      });
    }
  }

  const usedAfterBridge = steps.flatMap((step) => step.eventIds);
  const payoffId = choosePayoffEvent(graph, usedAfterBridge);
  if (!payoffId) return steps;
  const payoff = event(graph, payoffId);
  if (!payoff) return steps;

  const payoffRelation = graph.relations
    .filter((relation) =>
      (relation.to === payoffId || relation.from === payoffId) &&
      usedAfterBridge.some((id) => id === relation.from || id === relation.to),
    )
    .sort((a, b) =>
      b.strength * relationWeight(b.kind) - a.strength * relationWeight(a.kind),
    )[0];

  if (payoffRelation) {
    const carrier = payoffRelation.from === payoffId ? payoffRelation.to : payoffRelation.from;
    steps.push({
      order: steps.length + 1,
      operation: "payoff",
      eventIds: [carrier, payoffId],
      viewerChange: `The supplied endpoint lands after the accumulated path: ${payoff.label}.`,
      nextQuestion: "What is now true at the supplied ending?",
    });
  } else {
    steps.push({
      order: steps.length + 1,
      operation: "payoff",
      eventIds: [payoffId],
      viewerChange: `The supplied ending is: ${payoff.label}.`,
      nextQuestion: "What is now true at the supplied ending?",
    });
  }

  return steps.slice(0, 5).map((step, index) => ({ ...step, order: index + 1 }));
}

function scoreCandidate(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  focus: RealityRelation,
  lens?: string,
): Omit<LatentMovieCandidate, "id" | "lens" | "distinctiveness"> {
  const eventIds = unique(trajectory.flatMap((step) => step.eventIds));
  const relationKinds = unique(
    trajectory
      .slice(1)
      .map((step) => {
        const relation = relationBetween(graph, step.eventIds[0], step.eventIds[step.eventIds.length - 1]);
        return relation?.kind;
      })
      .filter((kind): kind is RealityRelation["kind"] => Boolean(kind)),
  );

  const payoffStep = trajectory.find((step) => step.operation === "payoff");
  const payoffId = payoffStep?.eventIds[payoffStep.eventIds.length - 1];
  const payoff = clean(event(graph, payoffId ?? "")?.label);
  const evidence = unique(eventIds.map((id) => clean(event(graph, id)?.label)).filter(Boolean));
  const semanticTurns = trajectory.filter((step) => step.operation !== "establish" && step.operation !== "payoff");
  const relationStrengths = semanticTurns
    .map((step) => relationBetween(graph, step.eventIds[0], step.eventIds[step.eventIds.length - 1])?.strength ?? 0)
    .filter(Number.isFinite);

  const grounding = relationStrengths.length
    ? relationStrengths.reduce((sum, value) => sum + value, 0) / relationStrengths.length
    : focus.strength;
  const specificity = metric(
    evidence.reduce((sum, label) => sum + eventSpecificity(graph, graph.events.find((item) => item.label === label)?.id ?? ""), 0) /
      Math.max(1, evidence.length),
  );
  const informationValue = metric(
    grounding * 0.38 +
      Math.min(1, semanticTurns.length / 3) * 0.27 +
      specificity * 0.18 +
      relationPreference(focus.kind, lens) * 0.17,
  );
  const uncertainty = metric(
    Math.min(1, semanticTurns.length / 3) * 0.46 +
      (trajectory.some((step) => step.operation === "contrast" || step.operation === "reframe") ? 0.28 : 0) +
      (trajectory.some((step) => step.nextQuestion.includes("?")) ? 0.12 : 0),
  );
  const attentionPotential = metric(informationValue * 0.46 + uncertainty * 0.34 + specificity * 0.2);
  const consequencePotential = metric(
    (payoff ? 0.28 : 0) +
      Math.min(0.5, semanticTurns.length * 0.14) +
      likelyEndpoint(graph, payoffId ?? "") * 0.22,
  );
  const callbackPotential = metric(
    graph.recurringSignals.length ? Math.min(1, graph.recurringSignals.length / 4) * 0.44 : 0.08,
  );
  const repetitionRisk = metric(
    Math.max(0, (eventIds.length - unique(eventIds).length) * 0.15),
  );
  const compressionPotential = metric(Math.min(1, trajectory.length / 3) * 0.72 + specificity * 0.28);
  const truthRisk = metric(
    Math.max(
      0,
      1 - (
        grounding * 0.52 +
        specificity * 0.12 +
        Math.min(1, semanticTurns.length / 3) * 0.18 +
        consequencePotential * 0.18
      ),
    ),
  );
  const score = metric(
    grounding * 0.2 +
      specificity * 0.1 +
      informationValue * 0.14 +
      uncertainty * 0.1 +
      attentionPotential * 0.14 +
      consequencePotential * 0.12 +
      callbackPotential * 0.06 +
      compressionPotential * 0.05 +
      (1 - repetitionRisk) * 0.04 +
      relationPreference(focus.kind, lens) * 0.05 -
      truthRisk * 0.18,
  );

  return {
    anchorEventIds: [focus.from, focus.to],
    supportingRelationKinds: relationKinds.length ? relationKinds : [focus.kind],
    trajectory: [...trajectory],
    payoff,
    unresolvedQuestion: trajectory.at(-1)?.nextQuestion ?? "What becomes newly meaningful?",
    evidence,
    hypothesis: [
      `The movie is organized around ${focus.kind}.`,
      `The central semantic move is: ${semanticTurn(graph, focus)}.`,
      "The lens changes the interpretation of the supplied relationship, not the supplied reality.",
    ],
    truthRisk,
    novelty: metric(1 - tokenOverlap(evidence.join(" "), graph.events.map((item) => item.label).join(" ")) * 0.35),
    specificity,
    informationValue,
    uncertainty,
    attentionPotential,
    consequencePotential,
    callbackPotential,
    compressionPotential,
    repetitionRisk,
    score,
  };
}

function movieKey(candidate: LatentMovieCandidate): string {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds)).join(">");
}

export function searchUniversalMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  lens?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  const limit = Math.max(3, Math.min(12, input.limit ?? 8));
  const relationCandidates = [...input.graph.relations]
    .filter((relation) => !["involves"].includes(relation.kind))
    .sort((a, b) =>
      (b.strength * relationPreference(b.kind, input.lens)) -
      (a.strength * relationPreference(a.kind, input.lens)),
    );

  const out: LatentMovieCandidate[] = [];
  const seen = new Set<string>();

  for (const focus of relationCandidates) {
    const trajectory = buildPath(input.graph, focus, input.lens);
    if (trajectory.length < 2) continue;

    const scored = scoreCandidate(input.graph, trajectory, focus, input.lens);
    const candidate: LatentMovieCandidate = {
      id: `movie-${out.length + 1}-${focus.kind}`,
      lens: clean(input.lens) || "neutral",
      ...scored,
      distinctiveness: 0,
    };

    const key = movieKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }

  out.sort((a, b) => b.score - a.score);

  const diversityReference: LatentMovieCandidate[] = [];
  for (const candidate of out) {
    const overlapWithExisting = diversityReference.length
      ? Math.max(
          ...diversityReference.map((existing) => tokenOverlap(candidate.evidence.join(" "), existing.evidence.join(" "))),
        )
      : 0;
    candidate.distinctiveness = metric(1 - overlapWithExisting);
    candidate.score = metric(candidate.score * 0.88 + candidate.distinctiveness * 0.12);
    diversityReference.push(candidate);
    if (diversityReference.length >= limit) break;
  }

  return diversityReference
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate, index) => ({
      ...candidate,
      id: `movie-${index + 1}-${clean(candidate.lens).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "neutral"}`,
    }));
}
