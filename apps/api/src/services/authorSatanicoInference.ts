import type { LatentMovieCandidate, ObserverExperienceObjective, RealityGraph } from "@qre/contracts";
import { discoverSatanicoInferenceOpportunities, type SatanicoInferenceOpportunity } from "./authorSatanicoEvidenceSearch.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function candidateIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function candidateCoverage(ids: readonly string[], opportunity: SatanicoInferenceOpportunity): number {
  if (!ids.length || !opportunity.ids.length) return 0;
  const source = new Set(ids);
  return metric(opportunity.ids.filter((id) => source.has(id)).length / opportunity.ids.length);
}

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function eventStructure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function environmentalOrbitPotential(graph: RealityGraph, ids: readonly string[]): number {
  if (!ids.length) return 0;

  const objects = new Set<string>();
  const actions = new Set<string>();
  const tags = new Set<string>();
  let multiEntityEvents = 0;

  for (const id of ids) {
    const event = graph.events.find((item) => item.id === id);
    const structure = eventStructure(graph, id);
    for (const value of structure?.objects ?? []) objects.add(clean(value).toLowerCase());
    for (const value of structure?.actions ?? []) actions.add(clean(value).toLowerCase());
    for (const value of structure?.semanticTags ?? []) tags.add(clean(value).toLowerCase());
    if ((event?.entities?.length ?? 0) > 1) multiEntityEvents += 1;
  }

  const objectDiversity = metric(objects.size / Math.max(1, ids.length * 1.5));
  const actionDiversity = metric(actions.size / Math.max(1, ids.length * 1.5));
  const tagDiversity = metric(tags.size / Math.max(1, ids.length * 2));
  const multiEntity = metric(multiEntityEvents / ids.length);
  return metric(objectDiversity * 0.38 + actionDiversity * 0.24 + tagDiversity * 0.16 + multiEntity * 0.22);
}

function humanSpinePotential(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const ids = candidateIds(candidate);
  if (!ids.length) return 0;

  const labels = ids.map((id) => eventLabel(graph, id));
  const sourceBacked = labels.filter(Boolean).length / ids.length;
  const explicitActors = ids.filter((id) => (graph.events.find((event) => event.id === id)?.entities?.length ?? 0) > 0).length / ids.length;
  const relational = graph.relations.filter((relation) => ids.includes(relation.from) && ids.includes(relation.to)).length;
  return metric(sourceBacked * 0.45 + explicitActors * 0.25 + Math.min(1, relational / Math.max(1, ids.length - 1)) * 0.3);
}

function relationshipDiversity(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  if (opportunity.ids.length < 2) return 0;
  const kinds = new Set<string>();
  for (let i = 0; i < opportunity.ids.length; i += 1) {
    for (let j = i + 1; j < opportunity.ids.length; j += 1) {
      const relation = graph.relations.find(
        (item) =>
          ((item.from === opportunity.ids[i] && item.to === opportunity.ids[j]) ||
            (item.from === opportunity.ids[j] && item.to === opportunity.ids[i])) &&
          item.strength > 0.35,
      );
      if (relation) kinds.add(relation.kind);
    }
  }
  return metric(kinds.size / 4);
}

function relevance(candidate: LatentMovieCandidate, opportunity: SatanicoInferenceOpportunity): number {
  const ids = candidateIds(candidate);
  const coverage = candidateCoverage(ids, opportunity);
  const anchorCoverage = opportunity.anchorIds.length
    ? opportunity.anchorIds.filter((id) => ids.includes(id)).length / opportunity.anchorIds.length
    : coverage;
  const supportCoverage = opportunity.supportIds.length
    ? opportunity.supportIds.filter((id) => ids.includes(id)).length / opportunity.supportIds.length
    : coverage;
  return metric(coverage * 0.58 + anchorCoverage * 0.24 + supportCoverage * 0.18);
}

function temporalSpread(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  const positions = opportunity.ids.map((id) => graph.events.findIndex((event) => event.id === id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1));
}

function relationshipAmbiguity(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  const relations = graph.relations.filter((relation) => opportunity.ids.includes(relation.from) && opportunity.ids.includes(relation.to));
  const kinds = new Set(relations.map((relation) => relation.kind));
  const labels = opportunity.ids.map((id) => eventLabel(graph, id).toLowerCase()).filter(Boolean);
  const labelDiversity = new Set(labels).size / Math.max(1, labels.length);
  return metric(
    Math.min(1, kinds.size / 4) * 0.5 +
      labelDiversity * 0.18 +
      relationshipDiversity(graph, opportunity) * 0.12 +
      (opportunity.kind === "heterogeneous_convergence" ? 0.2 : 0),
  );
}

function delayedValue(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  const spread = temporalSpread(graph, opportunity);
  const relations = graph.relations.filter((relation) => opportunity.ids.includes(relation.from) && opportunity.ids.includes(relation.to));
  const diversity = Math.min(1, new Set(relations.map((relation) => relation.kind)).size / 3);
  const naturallyDelayed = ["callback", "invariant", "origin_outcome"].includes(opportunity.kind) ? 0.22 : 0.08;
  return metric(spread * 0.5 + diversity * 0.28 + naturallyDelayed);
}

function explanationRisk(candidate: LatentMovieCandidate): number {
  const text = candidate.trajectory.map((step) => `${step.viewerChange} ${step.nextQuestion}`).join(" ");
  const explicitConclusion = /\b(?:obviously|therefore|the point is|this proves|means that|is really|lesson|moral|has a type|playboy|because of this|in other words)\b/i.test(
    `${text} ${candidate.hypothesis.join(" ")}`,
  );
  return metric((explicitConclusion ? 0.62 : 0) + (candidate.truthRisk ?? 0) * 0.22 + (candidate.repetitionRisk ?? 0) * 0.1);
}

function scoreOpportunity(graph: RealityGraph, candidate: LatentMovieCandidate, opportunity: SatanicoInferenceOpportunity): number {
  const groundedRelevance = relevance(candidate, opportunity);
  const delayed = delayedValue(graph, opportunity);
  const ambiguity = relationshipAmbiguity(graph, opportunity);
  const efficiency = metric(1.8 / Math.max(2, opportunity.ids.length));
  const support = metric(opportunity.anchorIds.length / Math.max(1, opportunity.ids.length));
  return metric(
    opportunity.score * 0.34 +
      groundedRelevance * 0.24 +
      delayed * 0.14 +
      ambiguity * 0.12 +
      efficiency * 0.07 +
      support * 0.05 +
      relationshipDiversity(graph, opportunity) * 0.04,
  );
}

/**
 * Satanico is the universal latent-inference authority.
 *
 * It searches immutable RealityGraph evidence for structures that allow a
 * viewer to discover a relationship, implication, transformation, callback,
 * role, or convergence without Author stating the answer.
 *
 * Crucially, Satanico is allowed to prefer the native structure of reality over
 * a genre lens. A lens is a way of seeing; it is never the source of the read.
 */
export function scoreSatanicoObserverInference(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const ids = candidateIds(candidate);
  if (ids.length < 3) return 0;

  const opportunities = discoverSatanicoInferenceOpportunities(graph, 64);
  const ranked = opportunities
    .map((item) => scoreOpportunity(graph, candidate, item))
    .sort((a, b) => b - a);

  const strongest = ranked[0] ?? 0;
  const second = ranked[1] ?? 0;
  const third = ranked[2] ?? 0;
  const competition = metric(strongest * 0.56 + second * 0.28 + third * 0.16);
  const orbit = environmentalOrbitPotential(graph, ids);
  const spine = humanSpinePotential(graph, candidate);
  const candidateSpan = temporalSpread(graph, {
    kind: "heterogeneous_convergence",
    ids,
    anchorIds: ids.slice(0, 2),
    supportIds: ids.slice(2),
    score: 0,
  });
  const unresolvedSpace = metric(
    (candidate.uncertainty ?? 0) * 0.28 +
      (candidate.callbackPotential ?? 0) * 0.16 +
      Math.min(1, opportunities.length / 10) * 0.1 +
      competition * 0.18 +
      (candidate.distinctiveness ?? 0) * 0.12 +
      candidateSpan * 0.08 +
      orbit * 0.08,
  );
  const directnessBonus = metric(
    Math.max(0, 1 - (candidate.lens && candidate.lens.toUpperCase() !== "NONE" ? 0.08 : 0)),
  );
  const risk = explanationRisk(candidate);

  return metric(
    strongest * 0.38 +
      competition * 0.13 +
      unresolvedSpace * 0.14 +
      spine * 0.08 +
      orbit * 0.05 +
      (candidate.novelty ?? 0) * 0.04 +
      (candidate.informationValue ?? 0) * 0.04 +
      (candidate.consequencePotential ?? 0) * 0.04 +
      (candidate.specificity ?? 0) * 0.04 +
      directnessBonus * 0.02 -
      risk * 0.2,
  );
}

function objectiveFor(kind: SatanicoInferenceOpportunity["kind"], subject: string): ObserverExperienceObjective {
  switch (kind) {
    case "preference_constellation":
      return {
        objective: `Let the observer infer a coherent character pattern in ${subject} from independent supplied preferences.`,
        surprise: "The pattern should become visible before it is named.",
        curiosity: "Keep each preference concrete and make the observer perform the synthesis.",
        attention: ["establish one preference", "add a different preference", "add another supplied preference", "withhold the abstraction"],
        landing: "The observer completes the character read internally.",
        explanationForbidden: true,
      };
    case "invariant":
      return {
        objective: "Let a supplied detail acquire significance because it persists while surrounding reality changes.",
        surprise: "The persistence should become noticeable before its significance is explained.",
        curiosity: "Show environmental change without interpreting the persistent carrier.",
        attention: ["establish the carrier", "show supplied change around it", "return to the carrier", "leave significance open"],
        landing: "The observer decides what the persistence means.",
        explanationForbidden: true,
      };
    case "origin_outcome":
      return {
        objective: "Let an ordinary early supplied detail become meaningful in hindsight through later supplied consequence.",
        surprise: "The beginning acquires weight only after later evidence arrives.",
        curiosity: "Do not announce the origin story before both ends exist in the observer's memory.",
        attention: ["show the small beginning", "move through supplied change", "show the later outcome", "let hindsight connect them"],
        landing: "The observer supplies the origin relationship.",
        explanationForbidden: true,
      };
    case "callback":
      return {
        objective: "Let a returning supplied detail revise the observer's reading of its earlier appearance.",
        surprise: "The second appearance should make the first feel different.",
        curiosity: "Establish a prediction around the detail and return without explaining the update.",
        attention: ["establish the detail", "move attention elsewhere", "return to the detail", "let the observer update the reading"],
        landing: "The callback supplies evidence; the observer performs the recontextualization.",
        explanationForbidden: true,
      };
    case "contrast":
      return {
        objective: "Let two supplied realities destabilize the observer's first reading.",
        surprise: "Later evidence should make an earlier assumption less stable.",
        curiosity: "Hold both readings long enough for the observer to revise one.",
        attention: ["establish the first reading", "introduce the supplied contrast", "hold the tension", "let recognition happen"],
        landing: "The observer resolves the contradiction internally.",
        explanationForbidden: true,
      };
    case "state_transformation":
      return {
        objective: `Let the observer feel ${subject}'s supplied transformation through before-and-after evidence.`,
        surprise: "The transformation should be recognized from evidence already shown.",
        curiosity: "Keep the earlier state available in memory while the sequence earns the later state.",
        attention: ["establish the earlier state", "accumulate supplied evidence", "delay the label", "land on the later state"],
        landing: "The observer names the transformation internally.",
        explanationForbidden: true,
      };
    case "relational_role":
      return {
        objective: "Let repeated contact with the same supplied entity across different contexts make its role inferable.",
        surprise: "The role should emerge from how the entity persists or behaves across contexts.",
        curiosity: "Vary the surrounding circumstances while keeping the carrier concrete.",
        attention: ["establish the entity", "place it in a second context", "show a third context", "let the observer infer the role"],
        landing: "The role is discovered from recurrence and context, not announced.",
        explanationForbidden: true,
      };
    case "heterogeneous_convergence":
      return {
        objective: "Let different supplied facts become meaningful together rather than as an explained list.",
        surprise: "The relationship should appear only after the separate evidence has accumulated.",
        curiosity: "Preserve the separateness of the facts until their joint structure becomes noticeable.",
        attention: ["establish one concrete fact", "add a less obvious related fact", "add another connected fact", "let the observer complete the pattern"],
        landing: "The observer performs the final inference.",
        explanationForbidden: true,
      };
  }
}

export function deriveSatanicoObserverObjective(graph: RealityGraph, candidate: LatentMovieCandidate): ObserverExperienceObjective | undefined {
  const strongest = discoverSatanicoInferenceOpportunities(graph, 64)
    .map((item) => ({ item, score: scoreOpportunity(graph, candidate, item) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!strongest || strongest.score < 0.5) return undefined;
  const subject = clean(graph.entityContinuity?.slice().sort((a, b) => b.salienceScore - a.salienceScore)[0]?.name) || "the subject";
  const objective = objectiveFor(strongest.item.kind, subject);
  const hasEnvironment = environmentalOrbitPotential(graph, candidateIds(candidate)) >= 0.58;
  if (!hasEnvironment) return objective;

  return {
    ...objective,
    objective: `${objective.objective} The surrounding world may carry secondary environmental attention without changing the human spine or asserting new supplied facts.`,
    curiosity: `${objective.curiosity} Environmental details may become strange, recurring, spatially displaced, or tonally charged only as an explicit perceptual treatment.`,
    attention: [
      ...objective.attention,
      "preserve the human spine while permitting the surrounding environment to carry secondary attention",
      "never require the human subject to react to a perceptual/environmental disturbance",
    ],
  };
}
