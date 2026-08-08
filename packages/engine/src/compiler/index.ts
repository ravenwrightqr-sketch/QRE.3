/**
 * QRE CANONICAL COMPILER PUBLIC BOUNDARY
 *
 * One authoring path. One semantic boundary. Projections only.
 *
 * Prompt -> Cognition V2 -> Meaning -> Genome -> World -> Blueprint
 *        -> ExperienceMoment[] -> Flow / Cinematic projections
 */

export {
  COGNITION_V2_MASTER_PROMPT,
  understandPrompt,
  buildExperienceUnderstanding,
} from "@qre/cognition-v2";

export type {
  CognitiveUnderstanding,
  CognitiveExperiencePlan,
} from "@qre/cognition-v2";

export * from "./semantic/index.js";

export {
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
