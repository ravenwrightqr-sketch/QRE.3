/**
 * QRE ENGINE PUBLIC API
 *
 * The engine exposes runtime services and the canonical compiler boundary.
 */

export { scanEngine } from "./scanEngine.js";
export { runFlowActions } from "./flowOrchestrator.js";
export { createSessionManager } from "./sessionManager.js";
export { renderTeaser } from "./teaserRenderer.js";
export { createPaymentLink } from "./payments.js";

export type { ExperienceMoment } from "@qre/contracts";

export * from "./analytics/index.js";
export * from "./runtimeProjection/index.js";
export { cinematicRuntime } from "./runtime/cinematicRuntime.js";
export * from "./moments/flowToMoments.js";

export * from "./experience/index.js";
export * from "./experience/blueprintToFlow.js";
export * from "./compiler/index.js";
export * from "./intelligence/index.js";
export * from "./world/index.js";

export {
  getPresenceTimeline,
  getPresenceReplay,
  getPresenceMap,
} from "./presence/index.js";

export type {
  AssetRepository,
  AssetRecord,
  SessionRepository,
  AccessRepository,
  AnalyticsRepository,
  PresenceRepository,
  GeoMemoryRepository,
  GeoProofRecord,
  StoryDeliveryRepository,
  UserRepository,
} from "./repositories/index.js";

export { directExperience, experienceDirector } from "./experience/director.js";
export * from "./cinematic/index.js";

export { runCompilerBrain } from "./compiler/compilerBrain.js";
export type { CompilerBrainResult } from "./compiler/compilerBrain.js";
export * from "./compiler/narrative/narrativeCompiler.js";
