
export { runFlowActions } from "./flowOrchestrator.js";
export type { Moment } from "@qre/contracts";


export { scanEngine } from "./scanEngine.js";

/**
 * =========================
 * ANALYTICS (SINGLE ENTRY POINT)
 * =========================
 */
export * from "./analytics/index.js";

export {
  createSessionManager,
} from "./sessionManager.js";

export { renderTeaser } from "./teaserRenderer.js";

export { createPaymentLink } from "./payments.js";

export {
  trackEvent,
  getRecentActivity,
  getFunnel,
  getDashboardMetrics,
  getScanInsights,
  getAssetLiveMetrics,
} from "./analytics/index.js";

export { getPresenceTimeline } from "./presence/getPresenceTimeline.js";
export { getPresenceReplay } from "./presence/getPresenceReplay.js";
export { getPresenceMap } from "./presence/getPresenceMap.js";
export { cinematicRuntime } from "./runtime/cinematic/cinematicRuntime.js";
export * from "./geo/geoMemoryLayer.js";
export * from "./geo/geoStoryCompiler.js";


// Moments
export * from "./moments/flowToMoments.js";
export * from "./moments/toMoment.js";

export * from "./experience/blueprintToFlow.js";



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
  qreSelfModel,
  reflectSelf,
} from "./cognition/selfModel.js";

export {
  remember,
  recall,
  reflectMemory,
} from "./cognition/memory.js";

export {
  reflect,
} from "./cognition/reflection.js";

export type {
  CognitiveInsight,
} from "./cognition/reflection.js";

export {
  adapt,
} from "./cognition/adaptation.js";

export type {
  AdaptationProposal,
} from "./cognition/adaptation.js";

export {
  makeDecision,
  chooseBestDecision,
} from "./cognition/decisionEngine.js";

export type {
  CognitiveDecision,
  DecisionRisk,
} from "./cognition/decisionEngine.js";

export {
  processCognition,
} from "./cognition/cognitionKernel.js";

export type {
  CognitionInput,
  CognitionResult,
} from "./cognition/cognitionKernel.js";

export {
  handleCognitionEvent,
} from "./cognition/cognitionHandler.js";

export type {
  CognitionEvent,
} from "./cognition/cognitionHandler.js";

export {
  startCognitionListener,
} from "./spine/cognitionListener.js";

export * from "./cognition/index.js";

export * from "./intelligence/index.js";

export * from "./semantic/index.js";


export * from "./world/index.js";
export {
  compileExperienceGenome,
  genomeCompiler,
} from "./experience/genomeCompiler.js";


export {
  compileExperienceGenome as experienceCompiler,
} from "./experience/genomeCompiler.js";