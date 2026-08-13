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

export { compileExperienceGenome, genomeCompiler, experienceCompiler } from "./experience/genomeCompiler.js";

export { buildExperienceEvent, buildExperienceEventWorld, eventRealizationHint } from "./experience/eventWorld.js";
export { buildMemoryWriteBatch, buildScanMemoryBatch, memoryContextToCompilerMemories } from "./memory/memoryCompiler.js";
export { compileCognitiveExperience } from "./experience/cognitiveExperienceCompiler.js";
export type { CognitiveCompiledExperience } from "./experience/cognitiveExperienceCompiler.js";

export { compileExperienceV7 } from "./experience/experienceCompilerV7.js";
export { inferExperienceIntentV7 } from "./experience/experienceIntentV7.js";
export { realizeLatentMovieV7 } from "./experience/creativeRealizerV7.js";
export type { CompiledExperienceV7, ExperienceCompilerContextV7 } from "./experience/experienceCompilerV7.js";
export type { ExperienceIntentV7 } from "./experience/experienceIntentV7.js";

export { compileExperienceV8 } from "./experience/experienceCompilerV8.js";
export { designExperienceV8 } from "./experience/experienceDesignV8.js";
export { realizeLatentMovieV8 } from "./experience/creativeRealizerV8.js";
export type { CompiledExperienceV8 } from "./experience/experienceCompilerV8.js";
export type { ExperienceDesignV8, ExperienceTrajectoryV8, ExperienceVoiceV8 } from "./experience/experienceDesignV8.js";

/** V9 creative cognition boundary: opportunity detection, phrase invention, and experience compilation. */
export { compileExperienceV9 } from "./experience/experienceCompilerV9.js";
export { realizeLatentMovieV9 } from "./experience/creativeRealizerV9.js";
export { detectCreativeOpportunitiesV9 } from "./experience/creativeOpportunityV9.js";
export { inventPhraseV9 } from "./experience/phraseInventorV9.js";
export type { CompiledExperienceV9 } from "./experience/experienceCompilerV9.js";
export type { RealizedMovieV9 } from "./experience/creativeRealizerV9.js";
export type { CreativeOpportunityV9, CreativeOpportunitySetV9, CreativeOpportunityKindV9 } from "./experience/creativeOpportunityV9.js";
export type { PhraseInventionV9 } from "./experience/phraseInventorV9.js";

/** V10 creative thinker: evidence-specific language plus explicit learning signals. */
export { compileExperienceV10 } from "./experience/experienceCompilerV10.js";
export { realizeLatentMovieV10 } from "./experience/creativeRealizerV10.js";
export { inventPhraseV10, extractCreativeLearningV10 } from "./experience/phraseInventorV10.js";
export type { CompiledExperienceV10 } from "./experience/experienceCompilerV10.js";
export type { RealizedMovieV10 } from "./experience/creativeRealizerV10.js";
export type { PhraseInventionV10 } from "./experience/phraseInventorV10.js";

/** V11 learning loop: accumulated creative memory, quality reinforcement, and strategy suggestions. */
export { compileExperienceV11 } from "./experience/experienceCompilerV11.js";
export {
  createCreativeLearningProfileV11,
  observeCreativeInventionV11,
  learnFromInventionsV11,
  suggestCreativeStrategyV11,
  mergeCreativeLearningV11,
} from "./experience/creativeLearningV11.js";
export type { CompiledExperienceV11, ExperienceCompilerContextV11 } from "./experience/experienceCompilerV11.js";
export type { CreativeLearningObservationV11, CreativeLearningSignalV11, CreativeLearningProfileV11 } from "./experience/creativeLearningV11.js";

/** V15/V16 universal memory layers: foresight, exact physical points, and travel trails. */
export { compileExperienceV15 } from "./experience/experienceCompilerV15.js";
export { compileUniversalMemoryV15, memoryForesightSignalsV15 } from "./experience/universalMemoryV15.js";
export type { CompiledExperienceV15, ExperienceCompilerContextV15 } from "./experience/experienceCompilerV15.js";
export type { UniversalMemoryV15 } from "./experience/universalMemoryV15.js";

export { compileExperienceV16 } from "./experience/experienceCompilerV16.js";
export { compileUniversalMemoryV16, memorySpatialSignalsV16 } from "./experience/universalMemoryV16.js";
export type { CompiledExperienceV16, ExperienceCompilerContextV16 } from "./experience/experienceCompilerV16.js";
export type { UniversalMemoryV16 } from "./experience/universalMemoryV16.js";

export { findLatentMovie } from "./experience/movieFactoryV2.js";
export type { MovieFactoryResult, MovieStyle } from "./experience/movieFactoryV2.js";

export * from "./cognition/index.js";
export * from "./intelligence/index.js";
export * from "./world/index.js";
export { getPresenceTimeline } from "./presence/getPresenceTimeline.js";
export { getPresenceReplay } from "./presence/getPresenceReplay.js";
export { getPresenceMap } from "./presence/getPresenceMap.js";

export type { AssetRepository, AssetRecord, SessionRepository, AccessRepository, AnalyticsRepository, PresenceRepository, GeoMemoryRepository, GeoProofRecord, StoryDeliveryRepository, UserRepository } from "./repositories/index.js";

