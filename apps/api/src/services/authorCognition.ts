/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * One universal cognition path. Model cognition may propose hypotheses, but
 * deterministic latent search supplies evidence-backed alternatives and
 * prevents unsupported multi-event relationships from becoming movies.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { buildAuthorCognitivePlan as buildModelCognitivePlan } from "./authorCognitionUniversal.js";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";

export type { AuthorCognitionInput, AuthorCreativeInterpretation, AuthorAdaptiveQuestion, AuthorCognitionPlan } from "./authorCognitionUniversal.js";
import type { AuthorCognitionInput, AuthorCognitionPlan } from "./authorCognitionUniversal.js";

function groundedPair(graph: RealityGraph, candidate: LatentMovieCandidate): boolean {
  const relationPairs = graph.relations.map((relation) => new Set([relation.from, relation.to]));
  return candidate.trajectory.every((step) => {
    if (step.eventIds.length < 2) return true;
    for (let i = 0; i < step.eventIds.length; i += 1) {
      for (let j = i + 1; j < step.eventIds.length; j += 1) {
        if (relationPairs.some((pair) => pair.has(step.eventIds[i]) && pair.has(step.eventIds[j]))) return true;
      }
    }
    return false;
  });
}

function dedupeCandidates(candidates: LatentMovieCandidate[], limit = 10): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
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
  const modelGrounded = modelPlan.latentMovieCandidates.filter((candidate) => groundedPair(input.realityGraph, candidate));
  const candidates = dedupe([...modelGrounded, ...search], 10);
  const selectedMovie = candidates.find((candidate) => candidate.id === modelPlan.selectedMovie?.id) ?? candidates[0];
  return {
    ...modelPlan,
    latentMovieCandidates: candidates,
    selectedMovie,
    interpretations: modelPlan.interpretations.length ? modelPlan.interpretations : selectedMovie ? [{ id: "interpretation-grounded", thesis: selectedMovie.hypothesis[0] ?? "", creativeOpportunity: "semantic progression", rationale: "grounded in supplied reality", evidenceEventIds: selectedMovie.anchorEventIds, confidence: selectedMovie.score }] : [],
  };
}
