/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * One universal cognition path. The implementation lives in
 * authorCognitionUniversal.ts so this module remains the stable import surface.
 */
export {
  buildAuthorCognitivePlan,
} from "./authorCognitionUniversal.js";

export type {
  AuthorCognitionInput,
  AuthorCreativeInterpretation,
  AuthorAdaptiveQuestion,
  AuthorCognitionPlan,
} from "./authorCognitionUniversal.js";
