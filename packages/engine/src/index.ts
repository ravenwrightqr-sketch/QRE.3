/** QRE engine public boundary. Runtime and compiler are intentionally separate. */

export { scanEngine } from "./scanEngine.js";
export { runFlowActions } from "./flowOrchestrator.js";
export { createSessionManager } from "./sessionManager.js";
export { renderTeaser } from "./teaserRenderer.js";
export { createPaymentLink } from "./payments.js";
export type { Moment } from "@qre/contracts";

export * from "./analytics/index.js";
export { buildExperienceAnalytics, getExperienceAnalytics } from "./analytics/analyticsService.js";
export { buildMemorySnapshot } from "./geo/buildMemorySnapshot.js";
export * from "./geo/geoMemoryLayer.js";
export * from "./geo/geoStoryCompiler.js";
export { cinematicRuntime } from "./runtime/cinematic/cinematicRuntime.js";
export * from "./moments/flowToMoments.js";
export * from "./moments/toMoment.js";

export { compileExperienceGenome, genomeCompiler, experienceCompiler } from "./experience/genomeCompiler.js";
export { compileStoryExperience } from "./experience/universalStoryCompiler.js";
export { compileStoryExperience as compileBaseStoryExperience } from "./experience/universalStoryCompiler.js";
export type {
  StoryCompilerContext,
  StoryCompilerMemory,
  StorySituation,
  StorySignal,
  ExperienceObservation,
  CompiledStoryExperience,
} from "./experience/universalStoryCompiler.js";

export {
  buildExperienceEvent,
  buildExperienceEventWorld,
  eventRealizationHint,
} from "./experience/eventWorld.js";

export {
  buildMemoryWriteBatch,
  buildScanMemoryBatch,
  memoryContextToCompilerMemories,
} from "./memory/memoryCompiler.js";

export { compileCognitiveExperience } from "./experience/cognitiveExperienceCompiler.js";
export type { CognitiveCompiledExperience } from "./experience/cognitiveExperienceCompiler.js";

export * from "./cognition/index.js";
export * from "./intelligence/index.js";
export * from "./world/index.js";
export { getPresenceTimeline } from "./presence/getPresenceTimeline.js";
export { getPresenceReplay } from "./presence/getPresenceReplay.js";
export { getPresenceMap } from "./presence/getPresenceMap.js";

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
  StoryDeliveryRepository,
} from "./repositories/index.js";
