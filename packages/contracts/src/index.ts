/**
 * =====================================================
 * QRE CONTRACTS PUBLIC API
 * =====================================================
 *
 * SINGLE EXPORT SURFACE
 *
 * ExperienceMoment is the canonical experience unit.
 * The legacy Moment contract is intentionally not exported.
 *
 * =====================================================
 */

// Cinematic runtime
export type {
  CinematicScene,
  SceneMediaAsset,
  CinematicSceneType,
  SceneAudio,
  SceneVisual,
  SceneTransition,
} from "./cinematic.js";

// Scan contracts
export * from "./scan.js";
export type { ScanResponse } from "./scanResponse.js";
export type { ScanEvent } from "./scanEvent.js";

// Memory / story
export type { MemorySnapshot } from "./memorySnapshot.js";
export type { ServiceReceipt } from "./serviceReceipt.js";
export * from "./story.js";
export * from "./entitlements.js";
export * from "./entitlementRules.js";

// Geo
export type {
  GeoStory,
  GeoStoryScene,
  GeoStorySceneType,
  GeoLocation,
} from "./geoStory.js";

// Analytics / events
export * from "./analytics.js";
export * from "./events.js";

// Flow runtime
export * from "./flow.js";

// Experience compiler contracts
export * from "./experience/index.js";

// Cognition contracts
export * from "./cognition/index.js";

// Domain contracts
export * from "./domain/index.js";

// Memory contracts
export * from "./memory/index.js";
