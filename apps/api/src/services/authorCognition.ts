/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * One universal cognition path. Model cognition may propose hypotheses, but
 * every multi-event semantic move must be supported by an actual RealityGraph
 * relation. Deterministic fallback candidates are derived only from those
 * relations; lenses never manufacture meaning.
 */
import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, RealityRelation } from "@qre/contracts";
import { buildAuthorCognitivePlan as buildModelCognitivePlan } from "./authorCognitionUniversal.js";

export type { AuthorCognitionInput, AuthorCreativeInterpretation, AuthorAdaptiveQuestion, AuthorCognitionPlan } from "./authorCognitionUniversal.js";
import type { AuthorCognitionInput, AuthorCognitionPlan } from "./authorCognitionUniversal.js";

function operationForRelation(kind: RealityRelation["kind"]): LatentMovieTrajectoryStep["operation"] | undefined {
  switch (kind) {
    case "contrasts": return "contrast";
    case "changes": return "consequence";
    case "converges": return "converge";
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    default: return undefined;
  }
}

function cleanSubject(value: unknown): string {
  return String(value ?? "the subject").replace(/\s+/g, " ").trim() || "the subject";
}

function relationBackedCandidates(graph: RealityGraph, subject: string, returning: boolean): LatentMovieCandidate[] {
  const events = new Map(graph.events.map((event) => [event.id, event]));
  const entries = graph.relations
    .map((relation) => ({ relation, operation: operationForRelation(relation.kind) }))
    .filter((entry): entry is { relation: RealityRelation; operation: NonNullable<ReturnType<typeof operationForRelation>> } => Boolean(entry.operation))
    .sort((a, b) => b.relation.strength - a.relation.strength);

  const candidates: LatentMovieCandidate[] = [];
  const seen = new Set<string>();
  for (const [index, { relation, operation }] of entries.entries()) {
    const from = events.get(relation.from);
    const to = events.get(relation.to);
    if (!from || !to) continue;

    const primary = relation.strength >= 0.7 ? from : (to.salient ? to : from);
    const secondary = primary.id === from.id ? to : from;
    const ids = [primary.id, secondary.id];
    const signature = `${operation}|${ids.slice().sort().join(",")}`;
    if (seen.has(signature)) continue;
    seen.add(signature);

    const relationQuestion = relation.kind === "contrasts"
      ? "What expectation changes when these two facts meet?"
      : relation.kind === "changes"
        ? "What is different because of this change?"
        : relation.kind === "recontextualizes"
          ? "What does the later fact make newly noticeable about the earlier one?"
          : relation.kind === "repeats"
            ? "What accumulates because this returns?"
            : "What becomes newly meaningful when these facts connect?";

    candidates.push({
      id: `grounded-relation-${candidates.length + 1}`,
      lens: "NONE",
      anchorEventIds: ids,
      supportingRelationKinds: [relation.kind],
      trajectory: [
        {
          order: 1,
          operation: "establish",
          eventIds: [primary.id],
          viewerChange: `Notice the supplied fact: ${primary.label}`,
          nextQuestion: relationQuestion,
        },
        {
          order: 2,
          operation,
          eventIds: ids,
          viewerChange: `The relationship between ${primary.label} and ${secondary.label} changes what is worth noticing.`,
          nextQuestion: relationQuestion,
        },
        {
          order: 3,
          operation: "payoff",
          eventIds: ids,
          viewerChange: returning
            ? "Land the changed reading without adding a new fact."
            : "Land the changed reading in the strongest supplied detail.",
          nextQuestion: returning ? "What will be different the next time this world is visited?" : "What remains after the reading changes?",
        },
      ],
      payoff: returning
        ? "The return is seen differently because the supplied relationship is now visible."
        : "The final supplied detail carries the changed reading.",
      unresolvedQuestion: returning ? "What changes on the next visit?" : "What deserves another look now?",
      evidence: ids.map((id) => events.get(id)?.label).filter((label): label is string => Boolean(label)),
      hypothesis: [
        `${subject}: the supplied relationship between ${primary.label} and ${secondary.label} is the creative engine.`,
        "The meaning changes through the relationship; no new event is introduced.",
      ],
      truthRisk: 0,
      novelty: Math.min(1, 0.58 + relation.strength * 0.35),
      specificity: 0.92,
      informationValue: Math.min(1, 0.64 + relation.strength * 0.3),
      uncertainty: Math.max(0.08, 0.42 - relation.strength * 0.25),
      attentionPotential: Math.min(1, 0.62 + relation.strength * 0.3),
      consequencePotential: operation === "consequence" || operation === "contrast" ? 0.82 : 0.68,
      callbackPotential: relation.kind === "repeats" ? 0.88 : returning ? 0.76 : 0.18,
      compressionPotential: 0.82,
      repetitionRisk: 0.04,
      distinctiveness: Math.min(1, 0.7 + relation.strength * 0.28),
      score: Number((0.76 - Math.min(index, 7) * 0.025).toFixed(3)),
    });
    if (candidates.length >= 8) break;
  }
  return candidates;
}

function groundedCandidate(graph: RealityGraph, candidate: LatentMovieCandidate): boolean {
  return candidate.trajectory.every((step) => {
    if (step.eventIds.length < 2) return true;
    for (let i = 0; i < step.eventIds.length; i += 1) {
      for (let j = i + 1; j < step.eventIds.length; j += 1) {
        const relation = graph.relations.find((item) =>
          (item.from === step.eventIds[i] && item.to === step.eventIds[j]) ||
          (item.from === step.eventIds[j] && item.to === step.eventIds[i]),
        );
        if (!relation) continue;
        const expected = operationForRelation(relation.kind);
        if (!expected || expected === step.operation) return true;
      }
    }
    return false;
  });
}

function dedupeCandidates(candidates: LatentMovieCandidate[], limit = 10): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates.slice().sort((a, b) => b.score - a.score)) {
    const signature = `${candidate.trajectory.map((step) => step.operation).join(">")}|${candidate.trajectory.flatMap((step) => step.eventIds).sort().join(",")}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    out.push(candidate);
    if (out.length >= limit) break;
  }
  return out;
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const modelPlan = await buildModelCognitivePlan(input);
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const deterministic = relationBackedCandidates(input.realityGraph, cleanSubject(input.subject), returning);
  const modelGrounded = modelPlan.latentMovieCandidates.filter((candidate) => groundedCandidate(input.realityGraph, candidate));
  const candidates = dedupeCandidates([...modelGrounded, ...deterministic], 10);
  const selectedMovie = candidates.find((candidate) => candidate.id === modelPlan.selectedMovie?.id) ?? candidates[0];
  return {
    ...modelPlan,
    latentMovieCandidates: candidates,
    selectedMovie,
    interpretations: modelPlan.interpretations.length
      ? modelPlan.interpretations
      : selectedMovie
        ? [{
            id: "interpretation-grounded",
            thesis: selectedMovie.hypothesis[0] ?? "",
            creativeOpportunity: "fact → relationship → changed notice → payoff",
            rationale: "grounded in supplied reality",
            evidenceEventIds: selectedMovie.anchorEventIds,
            confidence: selectedMovie.score,
          }]
        : [],
  };
}
