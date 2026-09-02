import type { LatentMovieCandidate, ObserverExperienceObjective, RealityGraph } from "@qre/contracts";
import { discoverSatanicoInferenceOpportunities, type SatanicoInferenceOpportunity } from "./authorSatanicoEvidenceSearch.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function candidateIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function candidateCoverage(candidateIdsList: readonly string[], opportunity: SatanicoInferenceOpportunity): number {
  if (!candidateIdsList.length || !opportunity.ids.length) return 0;
  const source = new Set(candidateIdsList);
  let hits = 0;
  for (const id of opportunity.ids) if (source.has(id)) hits += 1;
  return metric(hits / opportunity.ids.length);
}

function opportunityRelevance(candidate: LatentMovieCandidate, opportunity: SatanicoInferenceOpportunity): number {
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

function opportunityDelayedQuality(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  const positions = opportunity.ids.map((id) => graph.events.findIndex((event) => event.id === id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  const span = (Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1);
  const structuralRelations = graph.relations.filter((relation) =>
    opportunity.ids.includes(relation.from) && opportunity.ids.includes(relation.to) &&
    ["repeats", "recontextualizes", "contrasts", "changes", "causes", "converges"].includes(relation.kind),
  );
  const relationDiversity = new Set(structuralRelations.map((relation) => relation.kind)).size;
  const delay = opportunity.kind === "callback" || opportunity.kind === "invariant" || opportunity.kind === "origin_outcome" ? 0.16 : 0.08;
  return metric(Math.min(1, span) * 0.42 + Math.min(1, relationDiversity / 3) * 0.32 + delay);
}

function ambiguityValue(opportunity: SatanicoInferenceOpportunity, graph: RealityGraph): number {
  const relations = graph.relations.filter((relation) => opportunity.ids.includes(relation.from) && opportunity.ids.includes(relation.to));
  const kinds = new Set(relations.map((relation) => relation.kind));
  const eventLabels = opportunity.ids.map((id) => clean(graph.events.find((event) => event.id === id)?.label)).filter(Boolean);
  const labelDiversity = new Set(eventLabels.map((label) => label.toLowerCase())).size / Math.max(1, eventLabels.length);
  return metric(Math.min(1, kinds.size / 4) * 0.58 + labelDiversity * 0.2 + (opportunity.kind === "heterogeneous_convergence" ? 0.22 : 0));
}

function explanationRisk(candidate: LatentMovieCandidate): number {
  const hypothesisLeak = candidate.hypothesis.some((line) => /\b(?:obviously|the meaning is|lesson|moral|therefore|the point is|has a type|playboy)\b/i.test(clean(line))) ? 0.32 : 0;
  const questionLeak = candidate.trajectory.some((step) => /\b(?:this proves|means that|is really|reveals that)\b/i.test(`${step.viewerChange} ${step.nextQuestion}`)) ? 0.18 : 0;
  return metric(hypothesisLeak + questionLeak + (candidate.truthRisk ?? 0) * 0.28 + (candidate.repetitionRisk ?? 0) * 0.12);
}

function scoreOpportunity(graph: RealityGraph, candidate: LatentMovieCandidate, item: SatanicoInferenceOpportunity): number {
  const relevance = opportunityRelevance(candidate, item);
  const delayed = opportunityDelayedQuality(graph, item);
  const ambiguity = ambiguityValue(item, graph);
  const evidenceEfficiency = metric(1 / Math.max(1, item.ids.length) * 1.8);
  const subjectSupport = metric(item.anchorIds.length ? item.anchorIds.length / Math.max(1, item.ids.length) : 0.5);
  return metric(
    item.score * 0.38 +
    relevance * 0.24 +
    delayed * 0.15 +
    ambiguity * 0.1 +
    evidenceEfficiency * 0.07 +
    subjectSupport * 0.06,
  );
}

/**
 * Satanico's core question:
 *
 * What can a human reasonably infer from these supplied facts that QRE has not
 * explicitly said?
 *
 * This is deliberately an inference-space score, not a genre score and not a
 * detector count. Named relationship families are only evidence generators.
 */
export function scoreSatanicoObserverInference(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const ids = candidateIds(candidate);
  if (ids.length < 3) return 0;

  const opportunities = discoverSatanicoInferenceOpportunities(graph, 64);
  const relevant = opportunities
    .map((item) => scoreOpportunity(graph, candidate, item))
    .sort((a, b) => b - a);

  const strongest = relevant[0] ?? 0;
  const second = relevant[1] ?? 0;
  const third = relevant[2] ?? 0;
  const competition = metric(strongest * 0.58 + second * 0.27 + third * 0.15);
  const unresolved = metric(
    (candidate.uncertainty ?? 0) * 0.34 +
    (candidate.callbackPotential ?? 0) * 0.18 +
    Math.min(1, opportunities.length / 8) * 0.12 +
    competition * 0.2 +
    (candidate.distinctiveness ?? 0) * 0.16,
  );
  const risk = explanationRisk(candidate);

  return metric(
    strongest * 0.46 +
    competition * 0.16 +
    unresolved * 0.16 +
    (candidate.novelty ?? 0) * 0.06 +
    (candidate.informationValue ?? 0) * 0.05 +
    (candidate.consequencePotential ?? 0) * 0.04 +
    (candidate.specificity ?? 0) * 0.04 +
    (candidate.truthRisk <= 0.18 ? 0.03 : 0) -
    risk * 0.16,
  );
}

function objectiveFor(kind: SatanicoInferenceOpportunity["kind"], subject: string): ObserverExperienceObjective {
  switch (kind) {
    case "preference_constellation":
      return {
        objective: `Let the observer infer a coherent character pattern in ${subject} from several independent supplied preferences.`,
        surprise: "The pattern should become visible before it is named.",
        curiosity: "Keep each preference concrete and let the observer perform the synthesis.",
        attention: ["establish one preference", "add a second preference with a different target", "add another supplied preference", "withhold the abstraction"],
        landing: "The observer completes the character read internally.",
        explanationForbidden: true,
      };
    case "invariant":
      return {
        objective: "Let a supplied detail acquire significance because it persists while surrounding reality changes.",
        surprise: "The observer should notice the persistence before being told why it matters.",
        curiosity: "Show environmental change without explaining the persistent carrier.",
        attention: ["establish the carrier", "show supplied change around it", "return to the carrier", "leave its significance unresolved"],
        landing: "The observer decides what the persistence means.",
        explanationForbidden: true,
      };
    case "origin_outcome":
      return {
        objective: "Let an ordinary early supplied detail become meaningful in hindsight through later supplied consequence.",
        surprise: "The beginning should acquire weight only after the later evidence arrives.",
        curiosity: "Do not announce the causal story before the observer has both ends.",
        attention: ["show the small beginning", "move through supplied change", "show the later outcome", "let hindsight connect them"],
        landing: "The observer supplies the origin story.",
        explanationForbidden: true,
      };
    case "callback":
      return {
        objective: "Let a returning supplied detail revise the observer's reading of its earlier appearance.",
        surprise: "The second appearance should make the first feel different.",
        curiosity: "Establish a prediction around the detail, then return to it without explaining the update.",
        attention: ["establish the detail", "move attention elsewhere", "return to the detail", "let the observer update their reading"],
        landing: "The callback supplies evidence; the observer performs the recontextualization.",
        explanationForbidden: true,
      };
    case "contrast":
      return {
        objective: "Let two supplied realities destabilize the observer's first reading.",
        surprise: "The later evidence should make an earlier assumption less stable.",
        curiosity: "Hold both readings long enough for the observer to revise one.",
        attention: ["establish the first reading", "introduce the supplied contrast", "hold the tension", "let recognition happen"],
        landing: "The observer resolves the contradiction internally.",
        explanationForbidden: true,
      };
    case "state_transformation":
      return {
        objective: `Let the observer feel ${subject}'s supplied change through before-and-after evidence rather than explanation.`,
        surprise: "The transformation should be recognized from evidence already shown.",
        curiosity: "Keep the earlier state available in memory while the sequence earns the later state.",
        attention: ["establish the earlier state", "accumulate supplied evidence", "delay the label", "land on the later state"],
        landing: "The observer names the transformation themselves.",
        explanationForbidden: true,
      };
    case "relational_role":
      return {
        objective: "Let repeated contact with the same supplied entity across different contexts make its role inferable.",
        surprise: "The role should emerge from how the entity behaves or persists across contexts.",
        curiosity: "Vary the surrounding circumstances while keeping the carrier concrete.",
        attention: ["establish the entity", "place it in a second context", "show a third context", "let the observer infer its role"],
        landing: "The role is discovered from recurrence and context, not announced.",
        explanationForbidden: true,
      };
    case "heterogeneous_convergence":
      return {
        objective: "Let heterogeneous supplied facts become meaningful as a constellation rather than as a list.",
        surprise: "The relationship should appear only after enough different evidence has accumulated.",
        curiosity: "Preserve the separateness of the facts until their joint structure becomes noticeable.",
        attention: ["establish one concrete fact", "add a less obviously related fact", "add another connected fact", "let the observer complete the pattern"],
        landing: "The observer performs the final inference.",
        explanationForbidden: true,
      };
  }
}

export function deriveSatanicoObserverObjective(graph: RealityGraph, candidate: LatentMovieCandidate): ObserverExperienceObjective | undefined {
  const opportunities = discoverSatanicoInferenceOpportunities(graph, 64)
    .map((item) => ({ item, score: scoreOpportunity(graph, candidate, item) }))
    .sort((a, b) => b.score - a.score);
  const strongest = opportunities[0];
  if (!strongest || strongest.score < 0.5) return undefined;
  const subject = clean(graph.entityContinuity?.slice().sort((a, b) => b.salienceScore - a.salienceScore)[0]?.name) || "the subject";
  return objectiveFor(strongest.item.kind, subject);
}
