/**
 * QRE COMPILER PUBLIC BOUNDARY
 *
 * Cognition creates meaning. Runtime-facing layers only project it.
 */

export {
  COGNITION_V2_MASTER_PROMPT,
  understandPrompt,
  buildExperienceUnderstanding,
} from "@qre/cognition-v2";

export type {
  CognitiveUnderstanding,
} from "@qre/cognition-v2";

export * from "./semantic/index.js";

export {
  compileExperience,
  compileExperienceV2,
  compileExperienceGenomeV2,
} from "./coreCompilerV2.js";

export {
  createCompilerAnalyticsContext,
  mergeCompilerAnalytics,
} from "../analytics/compilerAnalytics.js";

export type {
  CompilerAnalyticsEvent,
  CompilerAnalyticsContext,
} from "../analytics/compilerAnalytics.js";
