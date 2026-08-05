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
  RuntimeAsset as ScanAsset,
  ExperiencePlayerConfig as ScanPlayerConfig,
} from "./experience/runtime.js";


export type {
  AccessState as ScanAccess,
} from "./scan.js";