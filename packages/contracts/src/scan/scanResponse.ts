/**
 * =====================================================
 * LEGACY SCAN RESPONSE CONTRACT
 *
 * Runtime moved to the Runtime domain.
 *
 * Kept as compatibility layer.
 * =====================================================
 */

export type {
  Experience as ScanResponse,
  ExperienceAccess as ScanAccess,
  AssetSummary as ScanAsset,
  ExperiencePlayerConfig as ScanPlayerConfig,
  ExperienceMediaManifest as ScanMedia,
} from "../runtime/runtime.js";
