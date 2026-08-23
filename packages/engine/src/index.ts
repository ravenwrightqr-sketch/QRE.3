/** QRE engine public boundary. Runtime and cognition remain Prisma-free. */

export { scanEngine } from "./scanEngine.js";
export { runFlowActions } from "./flowOrchestrator.js";
export { buildTheState } from "./theState.js";

export type { ExperienceMoment } from "@qre/contracts";

export * from "./analytics/index.js";

export * from "./geo/geoIntelligenceV17.js";
export { resolveGeoLabel } from "./geo/resolveGeoLabel.js";

export * from "./moments/flowToMoments.js";
export * from "./moments/toMoment.js";
export { compileCognitiveExperience, messageText } from "./cognition/universalMind.js";
export { buildCognitiveState } from "./cognition/cognitiveState.js";
export type { CognitiveState } from "@qre/contracts";
export type { UniversalMindContext, UniversalMindResult, WorldModel } from "./cognition/universalMind.js";
export { summarizeCognitiveAnalytics } from "./cognition/cognitiveAnalytics.js";
export { recommendMemories } from "./cognition/memoryRecommendations.js";
export { buildSponsorPolicy, REAL_ESTATE_SPONSOR_PLAYBOOK, BUSINESS_SPONSOR_PLAYBOOK } from "./cognition/sponsorPolicy.js";

export { getPresenceTimeline } from "./presence/getPresenceTimeline.js";
export { getPresenceReplay } from "./presence/getPresenceReplay.js";
export { getPresenceMap } from "./presence/getPresenceMap.js";
export { buildPresenceContext } from "./presence/buildPresenceContext.js";
export { runLocationStep } from "./runtime/locationRuntime.js";
export type { AssetRepository, AssetRecord, AssetExperienceRecord, SessionRepository, AccessRepository, AnalyticsRepository, PresenceRepository, GeoMemoryRepository, GeoProofRecord, StoryDeliveryRepository } from "./repositories/index.js";
export {
  emitSpineEvent,
  subscribeSpine,
} from "./spine/eventSpine.js";

export type { SpineEvent } from "./spine/eventSpine.js";
