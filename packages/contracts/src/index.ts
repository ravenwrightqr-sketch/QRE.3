/** QRE CONTRACTS PUBLIC API */

export type { CinematicScene, CinematicSceneType, SceneAudio, SceneVisual, SceneTransition } from "./cinematic.js";
export type { SequencePlay, SequenceCut, SequenceCut as SequenceBeat, ViewerState, ViewerAttentionRole, SequenceGainKind, ViewerMomentum, MagnetCircle, CutNecessity, SequenceTransition } from "./sequencePlay.js";
export type { ViewerMomentum as ViewerMomentumContract, MagnetCircle as MagnetCircleContract, MemoryReentryMagnet, SubjectContinuity, InformationFrontier, CutNecessity as CutNecessityContract, SequenceTransition as SequenceTransitionContract } from "./viewerMomentum.js";
export * from "./scan.js";
export type { ScanResponse } from "./scanResponse.js";
export type { ScanEvent } from "./scanEvent.js";
export type { MemorySnapshot } from "./memorySnapshot.js";
export type { ServiceReceipt } from "./serviceReceipt.js";
export type {
  TheState,
  TheStateIdentity,
  TheStateCapability,
  TheStateMode,
  TheStateCurrent,
  TheStateExperience,
  TheStateHistoryEntry,
  TheStateMeasurement,
  TheStatePattern,
  TheStateConfiguration,
} from "./theState.js";
export * from "./story.js";
export * from "./entitlements.js";
export * from "./entitlementRules.js";
export type { GeoStory, GeoStoryScene, GeoStorySceneType, GeoLocation } from "./geoStory.js";
export * from "./analytics.js";
export * from "./events.js";
export * from "./flow.js";

export * from "./experience/indexV13.js";
export * from "./experience/memoryIntelligenceV14.js";
export * from "./experience/memoryForesightV15.js";
export * from "./experience/memorySpatialV16.js";
export * from "./experience/memorySpatialV17.js";
export type { MediaAsset, MediaType } from "./media.js";
export type { SponsorPolicy, SponsorPlacement, SponsorFrequency, SponsorSignal } from "./experience/sponsor.js";
export type { RewardKind, RewardCompliance, SponsorRewardProgram, RewardAttribution, RewardTransaction, RewardBalance, RewardRecommendation } from "./experience/sponsorRewards.js";
export * from "./author.js";
export * from "./cogauthor/cognition.js";
export * from "./cogauthor/realityProvenance.js";
export * from "./cogauthor/identityState.js";
export * from "./cogauthor/cognitiveAuthorContext.js";
export * from "./cogauthor/movieBeatPlan.js";
export * from "./experience/index.js";
export {
  ANALYTICS_EVENT_DEFINITIONS,
  ANALYTICS_EVENT_REGISTRY,
  getAnalyticsEventDefinition,
} from "./analyticsRegistry.js";

export type {
  AnalyticsEventDefinition,
  AnalyticsEventCategory,
  AnalyticsEventSource,
} from "./analyticsRegistry.js";
