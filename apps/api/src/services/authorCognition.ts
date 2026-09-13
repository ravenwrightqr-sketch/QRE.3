/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * Cognition owns semantic interpretation.
 * RealityGraph and Creative Spine own grounded evidence.
 * Lenses apply creative pressure but never alter reality.
 */
import type { AuthorCognitionInput, AuthorCognitionPlan } from "./authorCognitionUniversal.js";
import { buildAuthorCognitivePlan as buildUniversalCognitivePlan } from "./authorCognitionUniversal.js";

export type {
  AuthorCognitionInput,
  AuthorCreativeInterpretation,
  AuthorAdaptiveQuestion,
  AuthorCognitionPlan,
} from "./authorCognitionUniversal.js";

export async function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): Promise<AuthorCognitionPlan> {
  return buildUniversalCognitivePlan(input);
}
