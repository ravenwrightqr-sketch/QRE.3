/** QRE ENGINE PUBLIC API */

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

/** Super Cog is the canonical semantic compiler boundary. */
export {
  compileSuperCogExperience,
  compileSuperCogExperience as compileCognitiveExperience,
} from "./experience/superCogCanonical.js";

export { compileExperienceGenome, genomeCompiler, experienceCompiler } from "./experience/genomeCompiler.js";
export * from "./cognition/index.js";
export * from "./intelligence/index.js";

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
