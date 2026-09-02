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
  const labelCount = new Set(opportunity.ids.map((id) => clean(graph.events.find((event) => event.id === id)?.label).toLowerCase())).size;
  const labelDiversity = labelCount / Math.max(1, opportunity.ids.length);
  return metric(Math.min(1, kinds.size / 4) * 0.58 + labelDiversity * 0.2 + (opportunity.kind === "heterogeneous_convergence" ? 0.22 : 0));
}

function delayedValue(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  const spread = temporalSpread(graph, opportunity);
  const relations = graph.relations.filter((relation) => opportunity.ids.includes(relation.from) && opportunity.ids.includes(relation.to));
  const diversity = Math.min(1, new Set(relations.map((relation) => relation.kind)).size / 3);
  const naturallyDelayed = ["callback", "invariant", "origin_outcome"].includes(opportunity.kind) ? 0.18 : 0.08;
  return metric(spread * 0.52 + diversity * 0.3 + naturallyDelayed);
}

function explanationRisk(candidate: LatentMovieCandidate): number {
  const text = candidate.trajectory.map((step) => `${step.viewerChange} ${step.nextQuestion}`).join(" ");
  const explicitConclusion = /\b(?:obviously|therefore|the point is|this proves|means that|is really|lesson|moral|has a type|playboy)\b/i.test(`${text} ${candidate.hypothesis.join(" ")}`);
  return metric((explicitConclusion ? 0.5 : 0) + (candidate.truthRisk ?? 0) * 0.28 + (candidate.repetitionRisk ?? 0) * 0.12);
}

function scoreOpportunity(graph: RealityGraph, candidate: LatentMovieCandidate, opportunity: SatanicoInferenceOpportunity): number {
  const groundedRelevance = relevance(candidate, opportunity);
  const delayed = delayedValue(graph, opportunity);
  const ambiguity = relationshipAmbiguity(graph, opportunity);
  const efficiency = metric(1.8 / Math.max(2, opportunity.ids.length));
  const support = metric(opportunity.anchorIds.length / Math.max(1, opportunity.ids.length));
  return metric(
    opportunity.score * 0.4 +
    groundedRelevance * 0.25 +
    delayed * 0.14 +
    ambiguity * 0.1 +
    efficiency * 0.06 +
    support * 0.05,
  );
}

/**
 * Satanico's core objective:
 * find grounded meaning that a human can infer without QRE explicitly stating
 * the conclusion.
 *
 * Relationship families are search mechanisms. They are not the definition of
 * intelligence. The winning score comes from the latent inference opportunity
 * they expose inside the immutable RealityGraph.
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
  const competition = metric(strongest * 0.6 + second * 0.25 + third * 0.15);
  const unresolvedSpace = metric(
    (candidate.uncertainty ?? 0) * 0.34 +
    (candidate.callbackPotential ?? 0) * 0.18 +
    Math.min(1, opportunities.length / 10) * 0.12 +
    competition * 0.2 +
    (candidate.distinctiveness ?? 0) * 0.16,
  );
  const risk = explanationRisk(candidate);

  return metric(
    strongest * 0.48 +
    competition * 0.15 +
    unresolvedSpace * 0.15 +
    (candidate.novelty ?? 0) * 0.05 +
    (candidate.informationValue ?? 0) * 0.05 +
    (candidate.consequencePotential ?? 0) * 0.04 +
    (candidate.specificity ?? 0) * 0.05 +
    (candidate.truthRisk <= 0.18 ? 0.03 : 0) -
    risk * 0.18,
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
  return objectiveFor(strongest.item.kind, subject);
}
