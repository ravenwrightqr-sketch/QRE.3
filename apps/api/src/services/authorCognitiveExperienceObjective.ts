/**
 * QRE COGNITIVE EXPERIENCE OBJECTIVE
 *
 * Reality events are immutable source material. They are not automatically
 * viewer-facing cuts. This module computes an experience objective from the
 * canonical RealityGraph + selected LatentMovie and gives Cognition an
 * explicit model of what the viewer should know, expect, notice and withhold.
 *
 * This is deliberately domain-neutral. It does not know groomer, restaurant,
 * wedding, pet, person, place, etc. It reasons over graph structure.
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
  const future = clamp(transition * 0.45 + relation * 0.35 + recurrence * 0.2);
  const payoff = clamp(transition * 0.4 + salience * 0.3 + relation * 0.3);
  const status = clamp((shape?.semanticTags ?? []).some((tag) => /status|presentation|appearance|recognition/i.test(tag)) ? 0.8 : 0);
  const comic = clamp((shape?.semanticTags ?? []).some((tag) => /comic|humor|surprise|mischief|contrast/i.test(tag)) ? 0.75 : surprise * 0.35);
  const emotional = clamp(actionDensity * 0.25 + transition * 0.4 + surprise * 0.35);
  const visual = clamp(objectDensity * 0.3 + sensory * 0.35 + status * 0.35);
  const recontext = clamp(relations.includes("recontextualizes") ? 1 : relation * 0.4 + surprise * 0.4 + recurrence * 0.2);
  const specificity = clamp(actionDensity * 0.35 + objectDensity * 0.35 + sensory * 0.15 + salience * 0.15);
  const novelty = clamp(anomaly * 0.5 + surprise * 0.3 + (shape?.semanticTags?.length ? 0.2 : 0));
  const causal = clamp(transition * 0.45 + relation * 0.35 + (shape?.actions.length ? 0.2 : 0));
  const experiential = round(
    novelty * 0.1 + salience * 0.1 + specificity * 0.08 + surprise * 0.12 + causal * 0.1 + relation * 0.1 +
    status * 0.05 + comic * 0.06 + emotional * 0.07 + visual * 0.06 + sensory * 0.04 + recontext * 0.06 +
    future * 0.05 + payoff * 0.05 + 0.04 * clamp((future + payoff) / 2),
  );
  let disposition: CognitiveExperienceOpportunity["disposition"] = experiential >= 0.62 ? "primary" : "supporting";
  if (payoff >= 0.7) disposition = "payoff";
  else if (future >= 0.7) disposition = "setup";
  else if (causal >= 0.7 && experiential < 0.55) disposition = "bridge";
  else if (experiential < 0.35) disposition = "latent";
  return {
    eventIds: [id], evidence: uniq([item?.label ?? "", ...(item?.sourceIds ?? [])], 8), novelty: round(novelty),
    salience: round(salience), specificity: round(specificity), surprise: round(surprise), causalImportance: round(causal),
    relationshipImportance: round(relation), statusPotential: round(status), comicPotential: round(comic), emotionalPotential: round(emotional),
    visualPotential: round(visual), sensoryPotential: round(sensory), recontextualizationPotential: round(recontext), futurePotential: round(future),
    payoffPotential: round(payoff), sharePotential: round(clamp(status * 0.45 + visual * 0.2 + novelty * 0.2 + emotional * 0.15)),
    repeatPotential: round(clamp(future * 0.5 + recontext * 0.3 + recurrence * 0.2)), experientialValue: experiential, disposition,
  };
}

function initialState(): CognitiveViewerState {
  return { knows: [], believes: [], expects: [], wonders: [], caresAbout: [], hasSeen: [], hasNotSeen: [], promises: [], openQuestions: [], emotionalPosition: "baseline", socialStatusInterpretation: "unresolved" };
}

function cloneState(state: CognitiveViewerState): CognitiveViewerState {
  return { ...state, knows: [...state.knows], believes: [...state.believes], expects: [...state.expects], wonders: [...state.wonders], caresAbout: [...state.caresAbout], hasSeen: [...state.hasSeen], hasNotSeen: [...state.hasNotSeen], promises: [...state.promises], openQuestions: [...state.openQuestions] };
}

function buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {
  const steps = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));
  if (!steps.length) return [];
  const state = initialState();
  const output: CognitiveReadoutObjective[] = [];
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const ids = uniq(step.eventIds, 12);
    const opp = opportunities.find((item) => item.eventIds.some((id) => ids.includes(id)));
    const before = cloneState(state);
    const currentEvidence = uniq(ids.flatMap((id) => [event(graph, id)?.label ?? "", ...(event(graph, id)?.sourceIds ?? [])]), 10);
    const futureIds = steps.slice(index + 1).flatMap((item) => item.eventIds);
    const futureEvidence = uniq(futureIds.flatMap((id) => [event(graph, id)?.label ?? "", ...(event(graph, id)?.sourceIds ?? [])]), 10);
    const next = clean(step.nextQuestion) || (futureEvidence.length ? "What happens next?" : "What remains after this?");
    const purpose: CognitiveReadoutObjective["purpose"] = index === 0 ? "establish" : index === steps.length - 1 ? "payoff" : (opp?.disposition === "setup" ? "escalate" : opp?.disposition === "payoff" ? "payoff" : step.operation === "reframe" ? "recontextualize" : "discover");
    state.hasSeen.push(...currentEvidence);
    state.knows.push(...currentEvidence);
    state.caresAbout.push(clean(step.viewerChange));
    state.expects = futureEvidence.slice(0, 3);
    state.hasNotSeen = futureEvidence.slice(0, 6);
    state.wonders = uniq([next, ...(futureEvidence.length ? ["What does this become?"] : [])], 4);
    state.openQuestions = [...state.wonders];
    if (futureEvidence.length) state.promises.push(futureEvidence[0]);
    state.emotionalPosition = clean(step.viewerChange) || "attention advances";
    state.socialStatusInterpretation = opp && opp.statusPotential >= 0.55 ? "status/presentation is becoming relevant" : state.socialStatusInterpretation;
    const after = cloneState(state);
    output.push({
      order: index + 1, eventIds: ids, purpose, currentEvidence, futureEvidence, viewerBefore: before, viewerAfter: after,
      attentionTarget: currentEvidence[0] || clean(step.viewerChange) || "current reality", withheldInformation: futureEvidence.slice(0, 3),
      nextPressure: next, payoffDependency: index === steps.length - 1 ? uniq(currentEvidence, 3).join(" + ") : (futureEvidence[0] ? `This moment earns the later discovery of ${futureEvidence[0]}.` : ""),
      terminal: index === steps.length - 1,
    });
  }
  return output;
}

export function buildCognitiveExperienceObjective(graph: RealityGraph, movie: LatentMovieCandidate): CognitiveExperienceObjective {
  const ids = uniq(movie.trajectory.flatMap((step) => step.eventIds), 40);
  const opportunities = ids.map((id, index) => opportunityFor(graph, id, ids.filter((_, other) => Math.abs(other - index) <= 2 && other !== index))).sort((a, b) => b.experientialValue - a.experientialValue);
  const trajectory = buildTrajectory(graph, movie, opportunities);
  const worldHypotheses: CognitiveExperienceObjective["worldHypotheses"] = [];
  const relationKindsSeen = new Set(graph.relations.map((item) => item.kind));
  if (relationKindsSeen.has("recontextualizes")) worldHypotheses.push({ hypothesis: "A supplied detail may change the meaning of an earlier detail.", evidenceEventIds: graph.relations.filter((item) => item.kind === "recontextualizes").flatMap((item) => [item.from, item.to]).slice(0, 8), confidence: 0.86 });
  if (relationKindsSeen.has("contrasts")) worldHypotheses.push({ hypothesis: "The supplied world contains a contrast that can become an observable turn.", evidenceEventIds: graph.relations.filter((item) => item.kind === "contrasts").flatMap((item) => [item.from, item.to]).slice(0, 8), confidence: 0.82 });
  if (relationKindsSeen.has("repeats")) worldHypotheses.push({ hypothesis: "A recurring supplied signal can acquire continuity value across visits.", evidenceEventIds: graph.relations.filter((item) => item.kind === "repeats").flatMap((item) => [item.from, item.to]).slice(0, 8), confidence: 0.8 });
  const sharePotential = opportunities.reduce((max, item) => Math.max(max, item.sharePotential), 0);
  const repeatPotential = opportunities.reduce((max, item) => Math.max(max, item.repeatPotential), 0);
  return {
    objective: "Discover the most valuable viewer experience latent in supplied reality; preserve truth while controlling revelation, attention, meaning, payoff and continuation.",
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
