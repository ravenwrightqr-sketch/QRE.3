/**
 * QRE COGNITIVE EXPERIENCE OBJECTIVE
 *
 * Reality is source material. The unit Cognition optimizes is not an event;
 * it is a viewer-state transition across a sequence.
 *
 * Core product objective:
 *   ADD something → MOVE ATTENTION → CREATE/PRESERVE CURIOSITY → PAY OFF.
 *
 * Event count is never the objective. A supplied event may be latent, a bridge,
 * grouped with another event, or a viewer-facing discovery depending on what
 * it does to the experience.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

export type CognitiveViewerState = {
  knows: string[];
  believes: string[];
  expects: string[];
  wonders: string[];
  caresAbout: string[];
  hasSeen: string[];
  hasNotSeen: string[];
  promises: string[];
  openQuestions: string[];
  emotionalPosition: string;
  socialStatusInterpretation: string;
};

export type CognitiveExperienceOpportunity = {
  eventIds: string[];
  evidence: string[];
  novelty: number;
  salience: number;
  specificity: number;
  surprise: number;
  causalImportance: number;
  relationshipImportance: number;
  statusPotential: number;
  comicPotential: number;
  emotionalPotential: number;
  visualPotential: number;
  sensoryPotential: number;
  recontextualizationPotential: number;
  futurePotential: number;
  payoffPotential: number;
  sharePotential: number;
  repeatPotential: number;
  mindBlowPotential: number;
  experientialValue: number;
  disposition: "primary" | "supporting" | "bridge" | "setup" | "payoff" | "latent";
};

export type CognitiveReadoutObjective = {
  order: number;
  eventIds: string[];
  purpose: "establish" | "discover" | "escalate" | "recontextualize" | "payoff" | "continue";
  currentEvidence: string[];
  futureEvidence: string[];
  viewerBefore: CognitiveViewerState;
  viewerAfter: CognitiveViewerState;
  attentionTarget: string;
  desiredViewerChange: string;
  addition: number;
  attentionMovement: number;
  curiosity: number;
  withheldInformation: string[];
  nextPressure: string;
  payoffDependency: string;
  terminal: boolean;
};

export type CognitiveExperienceObjective = {
  objective: string;
  worldHypotheses: Array<{ hypothesis: string; evidenceEventIds: string[]; confidence: number }>;
  opportunities: CognitiveExperienceOpportunity[];
  trajectory: CognitiveReadoutObjective[];
  shareObjective: string[];
  repeatObjective: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly string[], limit = 16): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
const clamp = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const round = (value: number): number => Number(clamp(value).toFixed(3));

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function structure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function relationScore(graph: RealityGraph, from: string, to: string): number {
  return graph.relations
    .filter((item) => (item.from === from && item.to === to) || (item.from === to && item.to === from))
    .reduce((max, item) => Math.max(max, item.strength), 0);
}

function relationKinds(graph: RealityGraph, from: string, to: string): string[] {
  return uniq(graph.relations
    .filter((item) => (item.from === from && item.to === to) || (item.from === to && item.to === from))
    .map((item) => item.kind), 8);
}

function evidenceFor(graph: RealityGraph, ids: readonly string[]): string[] {
  return uniq(ids.flatMap((id) => {
    const item = event(graph, id);
    return item ? [item.label, ...(item.sourceIds ?? [])] : [];
  }), 12);
}

function opportunityFor(graph: RealityGraph, id: string, neighbors: string[]): CognitiveExperienceOpportunity {
  const item = event(graph, id);
  const shape = structure(graph, id);
  const connected = neighbors.map((other) => relationScore(graph, id, other)).reduce((a, b) => Math.max(a, b), 0);
  const relations = neighbors.flatMap((other) => relationKinds(graph, id, other));
  const actionDensity = shape ? clamp(shape.actions.length / 2) : 0;
  const objectDensity = shape ? clamp(shape.objects.length / 2) : 0;
  const sensory = shape ? clamp(shape.sensoryMarkers.length / 2) : 0;
  const transition = shape?.transitionScore ?? 0;
  const anomaly = shape?.anomalyScore ?? 0;
  const salience = item?.salient ? 1 : shape?.salienceScore ?? 0;
  const recurrence = shape?.recurrenceScore ?? 0;
  const relation = clamp(connected * 0.65 + (relations.length ? 0.35 : 0));
  const surprise = clamp(anomaly * 0.55 + transition * 0.25 + (relations.includes("contrasts") ? 0.2 : 0));
  const future = clamp(transition * 0.35 + relation * 0.3 + recurrence * 0.15 + surprise * 0.2);
  const payoff = clamp(transition * 0.4 + salience * 0.3 + relation * 0.3);
  const status = clamp((shape?.semanticTags ?? []).some((tag) => /status|presentation|appearance|recognition/i.test(tag)) ? 0.8 : 0);
  const comic = clamp((shape?.semanticTags ?? []).some((tag) => /comic|humor|surprise|mischief|contrast/i.test(tag)) ? 0.75 : surprise * 0.35);
  const emotional = clamp(actionDensity * 0.25 + transition * 0.4 + surprise * 0.35);
  const visual = clamp(objectDensity * 0.3 + sensory * 0.35 + status * 0.35);
  const recontext = clamp(relations.includes("recontextualizes") ? 1 : relation * 0.35 + surprise * 0.4 + recurrence * 0.25);
  const specificity = clamp(actionDensity * 0.35 + objectDensity * 0.35 + sensory * 0.15 + salience * 0.15);
  const novelty = clamp(anomaly * 0.5 + surprise * 0.3 + (shape?.semanticTags?.length ? 0.2 : 0));
  const causal = clamp(transition * 0.45 + relation * 0.35 + (shape?.actions.length ? 0.2 : 0));
  const mindBlow = clamp(
    surprise * 0.28 +
    recontext * 0.22 +
    specificity * 0.15 +
    causal * 0.12 +
    future * 0.11 +
    payoff * 0.12,
  );
  const experiential = round(
    novelty * 0.08 + salience * 0.08 + specificity * 0.08 + surprise * 0.12 + causal * 0.1 + relation * 0.09 +
    status * 0.04 + comic * 0.06 + emotional * 0.07 + visual * 0.05 + sensory * 0.04 + recontext * 0.08 +
    future * 0.05 + payoff * 0.05 + mindBlow * 0.11,
  );
  let disposition: CognitiveExperienceOpportunity["disposition"] = experiential >= 0.58 ? "primary" : "supporting";
  if (payoff >= 0.7) disposition = "payoff";
  else if (future >= 0.68) disposition = "setup";
  else if (causal >= 0.68 && experiential < 0.55) disposition = "bridge";
  else if (experiential < 0.3) disposition = "latent";
  return {
    eventIds: [id],
    evidence: uniq([item?.label ?? "", ...(item?.sourceIds ?? [])], 8),
    novelty: round(novelty), salience: round(salience), specificity: round(specificity), surprise: round(surprise),
    causalImportance: round(causal), relationshipImportance: round(relation), statusPotential: round(status),
    comicPotential: round(comic), emotionalPotential: round(emotional), visualPotential: round(visual), sensoryPotential: round(sensory),
    recontextualizationPotential: round(recontext), futurePotential: round(future), payoffPotential: round(payoff),
    sharePotential: round(clamp(status * 0.45 + visual * 0.2 + novelty * 0.2 + emotional * 0.15)),
    repeatPotential: round(clamp(future * 0.45 + recontext * 0.35 + recurrence * 0.2)),
    mindBlowPotential: round(mindBlow), experientialValue: experiential, disposition,
  };
}

function initialState(): CognitiveViewerState {
  return {
    knows: [], believes: [], expects: [], wonders: [], caresAbout: [], hasSeen: [], hasNotSeen: [],
    promises: [], openQuestions: [], emotionalPosition: "baseline", socialStatusInterpretation: "unresolved",
  };
}

function cloneState(state: CognitiveViewerState): CognitiveViewerState {
  return {
    ...state,
    knows: [...state.knows], believes: [...state.believes], expects: [...state.expects],
    wonders: [...state.wonders], caresAbout: [...state.caresAbout], hasSeen: [...state.hasSeen],
    hasNotSeen: [...state.hasNotSeen], promises: [...state.promises], openQuestions: [...state.openQuestions],
  };
}

function tokenSet(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/).filter((token) => token.length >= 4));
}

function overlap(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(a.size, b.size);
}

function marginalAddition(current: string[], before: CognitiveViewerState): number {
  const known = before.knows.join(" ");
  if (!current.length) return 0;
  const fresh = current.filter((item) => overlap(item, known) < 0.55).length;
  return round(fresh / current.length);
}

function candidateTransitionScore(
  graph: RealityGraph,
  step: LatentMovieCandidate["trajectory"][number],
  previous: LatentMovieCandidate["trajectory"][number] | undefined,
  before: CognitiveViewerState,
  future: string[],
  opportunity: CognitiveExperienceOpportunity | undefined,
  index: number,
  total: number,
): { addition: number; attention: number; curiosity: number; value: number } {
  const ids = step.eventIds;
  const current = evidenceFor(graph, ids);
  const previousEvidence = previous ? evidenceFor(graph, previous.eventIds) : [];
  const baseAddition = marginalAddition(current, before);
  const novelty = opportunity?.novelty ?? 0;
  const surprise = opportunity?.surprise ?? 0;
  const relation = opportunity?.relationshipImportance ?? 0;
  const causal = opportunity?.causalImportance ?? 0;
  const futurePotential = opportunity?.futurePotential ?? 0;
  const payoff = opportunity?.payoffPotential ?? 0;
  const recontext = opportunity?.recontextualizationPotential ?? 0;
  const targetOverlap = previousEvidence.length ? overlap(current.join(" "), previousEvidence.join(" ")) : 0;
  const attention = round(
    (opportunity?.salience ?? 0) * 0.2 +
    (opportunity?.specificity ?? 0) * 0.2 +
    surprise * 0.18 +
    (1 - targetOverlap) * 0.16 +
    causal * 0.12 +
    novelty * 0.08 +
    (index === 0 ? 0.06 : 0),
  );
  const curiosity = round(
    surprise * 0.24 +
    futurePotential * 0.2 +
    recontext * 0.2 +
    payoff * 0.12 +
    relation * 0.08 +
    (future.length ? 0.1 : 0) +
    (index > 0 && index < total - 1 ? 0.06 : 0),
  );
  const addition = round(
    baseAddition * 0.5 +
    (opportunity?.specificity ?? 0) * 0.16 +
    novelty * 0.12 +
    (opportunity?.sensoryPotential ?? 0) * 0.08 +
    (opportunity?.visualPotential ?? 0) * 0.06 +
    causal * 0.08,
  );
  const value = round(
    addition * 0.28 + attention * 0.22 + curiosity * 0.24 +
    (opportunity?.mindBlowPotential ?? 0) * 0.16 + payoff * 0.1,
  );
  return { addition, attention, curiosity, value };
}

function sequenceScore(
  graph: RealityGraph,
  steps: LatentMovieCandidate["trajectory"],
  opportunitiesById: Map<string, CognitiveExperienceOpportunity>,
): number {
  if (steps.length < 2) return 0;
  let state = initialState();
  let total = 0;
  let previous: LatentMovieCandidate["trajectory"][number] | undefined;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const current = evidenceFor(graph, step.eventIds);
    const future = evidenceFor(graph, steps.slice(index + 1).flatMap((item) => item.eventIds));
    const opportunity = step.eventIds.map((id) => opportunitiesById.get(id)).find(Boolean);
    const scored = candidateTransitionScore(graph, step, previous, state, future, opportunity, index, steps.length);
    const terminal = index === steps.length - 1;
    total += scored.addition * 0.26 + scored.attention * 0.22 + scored.curiosity * 0.24 + scored.value * 0.16;
    if (terminal) total += (opportunity?.payoffPotential ?? 0) * 0.12;
    state.hasSeen.push(...current);
    state.knows.push(...current);
    state.wonders = future.length ? [clean(step.nextQuestion) || `What changes next?`] : [];
    previous = step;
  }
  const average = total / steps.length;
  const overlongPenalty = Math.max(0, steps.length - 6) * 0.012;
  return round(average - overlongPenalty);
}

function selectExperienceTrajectory(
  graph: RealityGraph,
  movie: LatentMovieCandidate,
  opportunities: CognitiveExperienceOpportunity[],
): LatentMovieCandidate["trajectory"] {
  const source = movie.trajectory
    .filter((step) => step.eventIds.length || clean(step.viewerChange))
    .map((step) => ({ ...step, eventIds: [...step.eventIds] }));
  if (source.length <= 2) return source;

  const byId = new Map(opportunities.flatMap((item) => item.eventIds.map((id) => [id, item] as const)));
  const beam: Array<{ steps: LatentMovieCandidate["trajectory"]; score: number }> = [
    { steps: [source[0]], score: 0 },
  ];

  for (let index = 1; index < source.length - 1; index += 1) {
    const next: typeof beam = [];
    for (const candidate of beam) {
      next.push({ steps: [...candidate.steps], score: candidate.score });
      const included = [...candidate.steps, source[index]];
      const local = sequenceScore(graph, included, byId);
      next.push({ steps: included, score: local });
    }
    next.sort((a, b) => b.score - a.score);
    beam.splice(0, beam.length, ...next.slice(0, 24));
  }

  const completed = beam.map((candidate) => ({
    steps: [...candidate.steps, source[source.length - 1]],
    score: sequenceScore(graph, [...candidate.steps, source[source.length - 1]], byId),
  }));
  completed.sort((a, b) => b.score - a.score);

  const best = completed[0]?.steps ?? source;
  // A rich supplied sequence is allowed to win with every beat. We only omit
  // an intermediate event when doing so produces a demonstrably stronger
  // viewer trajectory, never because a fixed minimum/maximum cut count exists.
  return best.length >= 2 ? best : [source[0], source[source.length - 1]];
}

function buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {
  const selected = selectExperienceTrajectory(graph, movie, opportunities);
  if (!selected.length) return [];
  const byId = new Map(opportunities.flatMap((item) => item.eventIds.map((id) => [id, item] as const)));
  const state = initialState();
  const output: CognitiveReadoutObjective[] = [];

  for (let index = 0; index < selected.length; index += 1) {
    const step = selected[index];
    const ids = uniq(step.eventIds, 12);
    const opportunity = ids.map((id) => byId.get(id)).find(Boolean);
    const before = cloneState(state);
    const currentEvidence = evidenceFor(graph, ids);
    const futureEvidence = evidenceFor(graph, selected.slice(index + 1).flatMap((item) => item.eventIds));
    const next = clean(step.nextQuestion) || (futureEvidence.length ? "What changes next?" : "What remains after this?");
    const scored = candidateTransitionScore(
      graph,
      step,
      index > 0 ? selected[index - 1] : undefined,
      before,
      futureEvidence,
      opportunity,
      index,
      selected.length,
    );
    const terminal = index === selected.length - 1;
    const purpose: CognitiveReadoutObjective["purpose"] =
      index === 0 ? "establish" :
      terminal ? "payoff" :
      opportunity?.disposition === "setup" ? "escalate" :
      opportunity?.recontextualizationPotential && opportunity.recontextualizationPotential >= 0.72 ? "recontextualize" :
      "discover";

    state.hasSeen.push(...currentEvidence);
    state.knows.push(...currentEvidence);
    state.caresAbout.push(clean(step.viewerChange));
    state.expects = futureEvidence.slice(0, 3);
    state.hasNotSeen = futureEvidence.slice(0, 6);
    state.wonders = futureEvidence.length ? [next] : [];
    state.openQuestions = [...state.wonders];
    if (futureEvidence.length) state.promises.push(futureEvidence[0]);
    state.emotionalPosition = clean(step.viewerChange) || "attention advances";
    if (opportunity && opportunity.statusPotential >= 0.55) state.socialStatusInterpretation = "a supplied status/presentation signal is becoming relevant";

    const after = cloneState(state);
    const desiredViewerChange = terminal
      ? "Recognize the supplied endpoint with the meaning earned by the sequence."
      : scored.curiosity >= scored.attention && scored.curiosity >= scored.addition
        ? `Need to know what the current evidence means when ${futureEvidence[0] || "the next supplied detail"} arrives.`
        : scored.attention >= scored.addition
          ? `Shift attention from ${index > 0 ? clean(selected[index - 1]?.viewerChange) : "the baseline"} to ${currentEvidence[0] || "the current evidence"}.`
          : `Learn something new: ${currentEvidence[0] || clean(step.viewerChange)}.`;

    output.push({
      order: index + 1,
      eventIds: ids,
      purpose,
      currentEvidence,
      futureEvidence,
      viewerBefore: before,
      viewerAfter: after,
      attentionTarget: currentEvidence[0] || clean(step.viewerChange) || "current reality",
      desiredViewerChange,
      addition: scored.addition,
      attentionMovement: scored.attention,
      curiosity: scored.curiosity,
      withheldInformation: futureEvidence.slice(0, 3),
      nextPressure: next,
      payoffDependency: terminal
        ? uniq(currentEvidence, 3).join(" + ")
        : futureEvidence[0]
          ? `The current moment earns the later discovery of ${futureEvidence[0]}.`
          : "",
      terminal,
    });
  }
  return output;
}

export function buildCognitiveExperienceObjective(graph: RealityGraph, movie: LatentMovieCandidate): CognitiveExperienceObjective {
  const ids = uniq(movie.trajectory.flatMap((step) => step.eventIds), 40);
  const opportunities = ids
    .map((id, index) => opportunityFor(graph, id, ids.filter((_, other) => Math.abs(other - index) <= 2 && other !== index)))
    .sort((a, b) => b.experientialValue - a.experientialValue);
  const trajectory = buildTrajectory(graph, movie, opportunities);
  const worldHypotheses: CognitiveExperienceObjective["worldHypotheses"] = [];
  const relationKindsSeen = new Set(graph.relations.map((item) => item.kind));
  if (relationKindsSeen.has("recontextualizes")) worldHypotheses.push({ hypothesis: "A supplied detail may change the meaning of an earlier detail.", evidenceEventIds: graph.relations.filter((item) => item.kind === "recontextualizes").flatMap((item) => [item.from, item.to]).slice(0, 8), confidence: 0.86 });
  if (relationKindsSeen.has("contrasts")) worldHypotheses.push({ hypothesis: "The supplied world contains a contrast that can become an observable turn.", evidenceEventIds: graph.relations.filter((item) => item.kind === "contrasts").flatMap((item) => [item.from, item.to]).slice(0, 8), confidence: 0.82 });
  if (relationKindsSeen.has("repeats")) worldHypotheses.push({ hypothesis: "A recurring supplied signal can acquire continuity value across visits.", evidenceEventIds: graph.relations.filter((item) => item.kind === "repeats").flatMap((item) => [item.from, item.to]).slice(0, 8), confidence: 0.8 });
  const sharePotential = opportunities.reduce((max, item) => Math.max(max, item.sharePotential), 0);
  const repeatPotential = opportunities.reduce((max, item) => Math.max(max, item.repeatPotential), 0);
  return {
    objective: "Discover the strongest viewer experience latent in supplied reality: ADD information, MOVE attention, CREATE/PRESERVE curiosity, then EARN the payoff and any desire to share or return.",
    worldHypotheses,
    opportunities,
    trajectory,
    shareObjective: [
      "Create an artifact whose interestingness comes from the supplied world, not generic AI spectacle.",
      `Preserve socially/display-relevant supplied signals when they create genuine share value (detected=${round(sharePotential)}).`,
      "Make the experience understandable to a new observer without flattening it into a service receipt.",
    ],
    repeatObjective: [
      "Leave an authorized future thread when the world contains continuation potential.",
      `Prefer future/recontextualization signals for repeat value (detected=${round(repeatPotential)}).`,
      "A return experience must gain meaning from new supplied evidence; never manufacture continuity.",
    ],
  };
}
