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

export type {
  AuthorAdaptiveQuestion,
  AuthorCognitionInput,
  AuthorCognitionPlan,
  AuthorCreativeInterpretation,
};

export async function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): Promise<AuthorCognitionPlan> {
  return buildUniversalCognitivePlan(input);
}
