/**
 * =====================================================
 * QRE ENGINE PUBLIC API
 * =====================================================
 *
 * Enterprise package boundary.
 *
 * Public contracts only.
 *
 * =====================================================
 */

export {
  scanEngine,
} from "./scanEngine.js";

export {
  runFlowActions,
} from "./flowOrchestrator.js";

export {
  createSessionManager,
} from "./sessionManager.js";

export {
  renderTeaser,
} from "./teaserRenderer.js";

export {
  createPaymentLink,
} from "./payments.js";

export type {
  Moment,
} from "@qre/contracts";

export * from "./analytics/index.js";

export * from "./geo/geoMemoryLayer.js";
export * from "./geo/geoStoryCompiler.js";

export {
  cinematicRuntime,
} from "./runtime/cinematic/cinematicRuntime.js";

export * from "./moments/flowToMoments.js";
export * from "./moments/toMoment.js";

/**
 * =====================================================
 * UNIVERSAL EXPERIENCE COMPILER
 * =====================================================
 *
 * Super Cog is the semantic decision layer.
 * The universal substrate is the realization layer.
 *
 * =====================================================
 */

export {
  compileCognitiveExperience,
} from "./experience/cognitiveExperienceCompiler.js";

export {
  compileExperienceGenome,
  genomeCompiler,
  experienceCompiler,
} from "./experience/genomeCompiler.js";

/**
 * Existing cognition/runtime services remain public where they are
 * independently consumed. They do not participate in the old template
 * compiler path.
 */
export * from "./cognition/index.js";
export * from "./intelligence/index.js";

export {
  getPresenceTimeline,
} from "./presence/getPresenceTimeline.js";

export {
  getPresenceReplay,
} from "./presence/getPresenceReplay.js";

export {
  getPresenceMap,
} from "./presence/getPresenceMap.js";

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
