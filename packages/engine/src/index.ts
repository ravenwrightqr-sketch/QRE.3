/** QRE engine public boundary. Runtime and compiler are intentionally separate. */

export { scanEngine } from "./scanEngine.js";
export { runFlowActions } from "./flowOrchestrator.js";
export { createSessionManager } from "./sessionManager.js";
export { renderTeaser } from "./teaserRenderer.js";
export { createPaymentLink } from "./payments.js";
export type { Moment } from "@qre/contracts";

export * from "./analytics/index.js";
export * from "./geo/geoMemoryLayer.js";
export * from "./geo/geoStoryCompiler.js";
export { cinematicRuntime } from "./runtime/cinematic/cinematicRuntime.js";
export * from "./moments/flowToMoments.js";
export * from "./moments/toMoment.js";

/** Compatibility prompt compiler boundary. */
export {
  compileExperienceGenome,
  genomeCompiler,
  experienceCompiler,
} from "./experience/genomeCompiler.js";

/** Legacy story compiler boundary; retained only for compatibility during migration. */
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

/** Cognitive event-world realization boundary. */
export {
  buildExperienceEvent,
  buildExperienceEventWorld,
  eventRealizationHint,
} from "./experience/eventWorld.js";

/** Governed long-term memory compilation. */
export {
  buildMemoryWriteBatch,
  buildScanMemoryBatch,
  memoryContextToCompilerMemories,
} from "./memory/memoryCompiler.js";

/** Compatibility cognition compiler. */
export { compileCognitiveExperience } from "./experience/cognitiveExperienceCompiler.js";
export type { CognitiveCompiledExperience } from "./experience/cognitiveExperienceCompiler.js";

/** V7 human-to-experience authoring boundary. */
export { compileExperienceV7 } from "./experience/experienceCompilerV7.js";
export { inferExperienceIntentV7 } from "./experience/experienceIntentV7.js";
export { realizeLatentMovieV7 } from "./experience/creativeRealizerV7.js";
export type {
  CompiledExperienceV7,
  ExperienceCompilerContextV7,
} from "./experience/experienceCompilerV7.js";
export type { ExperienceIntentV7 } from "./experience/experienceIntentV7.js";

/** Source-first latent movie discovery. */
export { findLatentMovie } from "./experience/movieFactoryV2.js";
export type { MovieFactoryResult, MovieStyle } from "./experience/movieFactoryV2.js";

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
} from "./repositories/index.js";
