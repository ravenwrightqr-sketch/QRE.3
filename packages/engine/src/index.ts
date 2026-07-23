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


/**
 * =====================================================
 * CORE RUNTIME
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




/**
 * =====================================================
 * ANALYTICS
 * =====================================================
 */

export * from "./analytics/index.js";




/**
 * =====================================================
 * GEO + MEMORY
 * =====================================================
 */

export * from "./geo/geoMemoryLayer.js";

export * from "./geo/geoStoryCompiler.js";




/**
 * =====================================================
 * CINEMATIC RUNTIME
 * =====================================================
 */

export {
  cinematicRuntime,
} from "./runtime/cinematic/cinematicRuntime.js";




/**
 * =====================================================
 * MOMENTS
 * =====================================================
 */

export * from "./moments/flowToMoments.js";

export * from "./moments/toMoment.js";




/**
 * =====================================================
 * EXPERIENCE COMPILER
 * =====================================================
 *
 * Prompt
 * ↓
 * Semantic Understanding
 * ↓
 * Genome
 * ↓
 * Experience
 *
 * =====================================================
 */

export {
  compileExperienceGenome,
  genomeCompiler,
  compileExperienceGenome as experienceCompiler,
} from "./experience/genomeCompiler.js";


export * from "./experience/blueprintToFlow.js";




/**
 * =====================================================
 * SEMANTIC COMPILER
 * =====================================================
 */

export * from "./compiler/semantic/index.js";




/**
 * =====================================================
 * COGNITION
 * =====================================================
 */

export * from "./cognition/index.js";




/**
 * =====================================================
 * INTELLIGENCE
 * =====================================================
 */

export * from "./intelligence/index.js";




/**
 * =====================================================
 * WORLD ENGINE
 * =====================================================
 */

export * from "./world/index.js";




/**
 * =====================================================
 * PRESENCE SYSTEM
 * =====================================================
 *
 * Public compatibility exports.
 *
 * API consumers depend on these names.
 *
 * =====================================================
 */

export {
  getPresenceTimeline,
} from "./presence/getPresenceTimeline.js";


export {
  getPresenceReplay,
} from "./presence/getPresenceReplay.js";


export {
  getPresenceMap,
} from "./presence/getPresenceMap.js";




/**
 * =====================================================
 * REPOSITORY CONTRACTS
 * =====================================================
 */

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