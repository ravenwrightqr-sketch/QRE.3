/** QRE engine public boundary. Runtime and cognition remain Prisma-free. */

export { scanEngine } from "./scanEngine.js";
export { runFlowActions } from "./flowOrchestrator.js";
export { createSessionManager } from "./sessionManager.js";
export { renderTeaser } from "./teaserRenderer.js";
export { createPaymentLink } from "./payments.js";
export type { ExperienceMoment } from "@qre/contracts";

export * from "./analytics/index.js";
export {
  subscribeSpine,
  emitSpineEvent,
} from "./spine/eventSpine.js";

export {
  mapEngineEventToAnalytics,
  engineToAnalyticsMap,
} from "./analytics/engineEventMapping.js";
export * from "./geo/geoMemoryLayer.js";
export * from "./geo/geoStoryCompiler.js";
export { resolveGeoLabel } from "./geo/resolveGeoLabel.js";
export { cinematicRuntime } from "./runtime/cinematic/cinematicRuntime.js";
export * from "./moments/flowToMoments.js";
export * from "./moments/toMoment.js";
export { classifyAnalyticsEvent, summarizeCognitiveAnalytics } from "./cognition/cognitiveAnalytics.js";
export { recommendMemories } from "./cognition/memoryRecommendations.js";
export { buildSponsorPolicy, REAL_ESTATE_SPONSOR_PLAYBOOK, BUSINESS_SPONSOR_PLAYBOOK } from "./cognition/sponsorPolicy.js";
export * from "./intelligence/index.js";
export * from "./world/index.js";
export { getPresenceTimeline } from "./presence/getPresenceTimeline.js";
export { getPresenceReplay } from "./presence/getPresenceReplay.js";
export { getPresenceMap } from "./presence/getPresenceMap.js";
export { buildPresenceContext } from "./presence/buildPresenceContext.js";
export type { AssetRepository, AssetRecord, AssetExperienceRecord, SessionRepository, AccessRepository, AnalyticsRepository, PresenceRepository, GeoMemoryRepository, GeoProofRecord, StoryDeliveryRepository, UserRepository } from "./repositories/index.js";
export { checkIn } from "./presence/checkIn.js";
export { checkOut } from "./presence/checkOut.js";
