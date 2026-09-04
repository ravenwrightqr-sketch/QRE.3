/**
 * =====================================================
 * LEGACY SCAN RESPONSE CONTRACT
 *
 * Runtime moved to Experience.
 *
 * Scan engine output is now the
 * canonical Experience runtime.
 *
 * Kept as compatibility layer.
 *
 * =====================================================
 */

export type {
  Experience as ScanResponse,
  ExperienceAccess as ScanAccess,
  AssetSummary as ScanAsset,
  ExperiencePlayerConfig as ScanPlayerConfig,
  ExperienceMediaManifest as ScanMedia,
} from "./experience/runtime.js";
