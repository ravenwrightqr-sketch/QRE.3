/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * Cognition owns semantic interpretation.
 * RealityGraph and Creative Spine own grounded evidence.
 * Lenses apply creative pressure but never alter reality.
 *
 * The universal cognition implementation remains the semantic authority, but
 * this boundary deliberately gives its model-facing call a sanitized view of
 * internal relation taxonomy. The full spine is retained for fallback and
 * diagnostics; internal mechanism labels never need to be part of the model's
 * prompt.
 */
import type { RealityGraph } from "@qre/contracts";
import type {
  AuthorCognitionInput,
  AuthorCognitionPlan,
  AuthorCreativeInterpretation,
  AuthorAdaptiveQuestion,
} from "./authorCognitionUniversal.js";
import {
  buildAuthorCognitivePlan as buildUniversalCognitivePlan,
} from "./authorCognitionUniversal.js";

export type {
  AuthorCognitionInput,
  AuthorCreativeInterpretation,
  AuthorAdaptiveQuestion,
  AuthorCognitionPlan,
} from "./authorCognitionUniversal.js";

function modelSafeGraph(graph: RealityGraph): RealityGraph {
  return {
    ...graph,
    relations: [],
  };
}

export async function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): Promise<AuthorCognitionPlan> {
  const safeSpine = input.creativeSpine
    ? {
        ...input.creativeSpine,
        selectedRelationId: undefined,
      }
    : undefined;

  return buildUniversalCognitivePlan({
    ...input,
    realityGraph: modelSafeGraph(input.realityGraph),
    creativeSpine: safeSpine,
  });
}
