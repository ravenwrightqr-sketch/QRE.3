/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * One universal cognition path. Model cognition may propose hypotheses, but
 * every multi-event semantic move must be supported by the actual RealityGraph
 * relation that can justify that move.
 */
import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, RealityRelation } from "@qre/contracts";
import { buildAuthorCognitivePlan as buildModelCognitivePlan } from "./authorCognitionUniversal.js";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";

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

function groundedCandidate(graph: RealityGraph, candidate: LatentMovieCandidate): boolean {
  const relations = graph.relations;
  return candidate.trajectory.every((step) => {
    if (step.eventIds.length < 2) return true;
    for (let i = 0; i < step.eventIds.length; i += 1) {
      for (let j = i + 1; j < step.eventIds.length; j += 1) {
        const relation = relations.find((item) =>
          new Set([item.from, item.to]).has(step.eventIds[i]) &&
          new Set([item.from, item.to]).has(step.eventIds[j]),
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
  const search = searchLatentMovieCandidates({ graph: input.realityGraph, subject: input.subject, lens: input.lens, limit: 8 });
  const modelGrounded = modelPlan.latentMovieCandidates.filter((candidate) => groundedCandidate(input.realityGraph, candidate));
  const candidates = dedupeCandidates([...modelGrounded, ...search], 10);
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
            creativeOpportunity: "semantic progression",
            rationale: "grounded in supplied reality",
            evidenceEventIds: selectedMovie.anchorEventIds,
            confidence: selectedMovie.score,
          }]
        : [],
  };
}
