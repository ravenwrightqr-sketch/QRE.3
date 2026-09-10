/* QRE UNIVERSAL COGNITION ENTRYPOINT
 *
 * One semantic discovery path. It returns grounded possibilities only.
 * Derived interpretations never mutate RealityGraph.
 */
import {
  buildAuthorCognitivePlan as buildUniversalCognitivePlan,
  type AuthorAdaptiveQuestion,
  type AuthorCognitionInput,
  type AuthorCognitionPlan,
  type AuthorCreativeInterpretation,
} from "./authorCognitionUniversal.js";
import { buildSparseGroundedMovies } from "./authorCognitionGroundedFallback.js";

export type {
  AuthorAdaptiveQuestion,
  AuthorCognitionInput,
  AuthorCognitionPlan,
  AuthorCreativeInterpretation,
};

export async function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): Promise<AuthorCognitionPlan> {
  const plan = await buildUniversalCognitivePlan(input);

  if (plan.latentMovieCandidates.length > 0) return plan;

  const sparseMovies = buildSparseGroundedMovies(
    input.realityGraph,
    String(input.subject ?? "the subject").trim(),
    Boolean(input.returning || (input.visitNumber ?? 1) > 1),
  );

  const selectedMovie = sparseMovies[0];
  if (!selectedMovie) return plan;

  return {
    ...plan,
    latentMovieCandidates: sparseMovies,
    selectedMovie,
    interpretations: plan.interpretations.length
      ? plan.interpretations
      : [{
          id: "interpretation-grounded-sparse",
          thesis: selectedMovie.hypothesis[0] ?? "",
          creativeOpportunity: "make the supplied details newly noticeable through sequence",
          rationale: "deterministic fallback for sparse supplied reality",
          evidenceEventIds: selectedMovie.anchorEventIds,
          confidence: selectedMovie.score,
        }],
    reasoningSummary: [
      ...plan.reasoningSummary,
      "Sparse grounded fallback supplied a playable possibility without manufacturing a relationship or event.",
    ],
  };
}
