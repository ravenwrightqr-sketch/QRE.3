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
  ExperienceMoment,
} from "@qre/contracts";




/**
 * =====================================================
 * ANALYTICS
 * =====================================================
 */

export * from "./analytics/index.js";

/**
 * =====================================================
 * RUNTIME PROJECTION
 *
 * Public runtime assembly boundary.
 *
 * Compiler output
 *        ↓
 * Runtime Experience
 *
 * =====================================================
 */

export * from "./runtimeProjection/index.js";



/**
 * =====================================================
 * CINEMATIC RUNTIME
 * =====================================================
 */

export {
  cinematicRuntime,
} from "./runtime/cinematicRuntime.js";




/**
 * =====================================================
 * MOMENTS
 * =====================================================
 */

export * from "./moments/flowToMoments.js";





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

 export * from "./experience/index.js";


export * from "./experience/blueprintToFlow.js";




/**
 * =====================================================
 * SEMANTIC COMPILER
 * =====================================================
 */

 export * from "./compiler/index.js";


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


export {
  directExperience,
  experienceDirector,
} from "./experience/director.js";

export * from "./cinematic/index.js";



/**
 * =====================================================
 * COMPILER BRAIN
 * =====================================================
 *
 * Creative Intelligence Core
 *
 * =====================================================
 */

export {
  runCompilerBrain,
} from "./compiler/compilerBrain.js";

export type {
  CompilerBrainResult,

} from "./compiler/compilerBrain.js";





 /**
 * =====================================================
 * RUNTIME PROJECTION
 * =====================================================
 */

export * from "./runtimeProjection/index.js";