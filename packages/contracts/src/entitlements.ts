/**
 * =====================================================
 * QRE ACCOUNT ENTITLEMENTS
 * =====================================================
 *
 * Single source of truth for account capabilities.
 *
 * Database
 *      │
 *      ▼
 * Account
 *      │
 *      ▼
 * AccountPlan
 *      │
 *      ▼
 * Entitlements
 *      │
 *      ├── API
 *      ├── Scan Engine
 *      ├── Dashboard
 *      ├── Flow Builder
 *      └── Stripe
 *
 * NEVER hardcode plan limits anywhere else.
 *
 * =====================================================
 */

export type AccountType =
  | "CONSUMER"
  | "BUSINESS";

export type AccountPlan =
  | "CONSUMER"
  | "PRO"
  | "BUSINESS";

export type AnalyticsTier =
  | "BASIC"
  | "ADVANCED"
  | "BUSINESS";

export type Entitlement = {
  maxAssets: number | null;
  maxFlowsPerAsset: number | null;
  maxMomentsPerFlow: number;
  maxMediaItems: number;
  analytics: AnalyticsTier;
  transferableAssets: boolean;
  flowLibrary: boolean;
  flowAttachDetach: boolean;
  scheduledFlows: boolean;
  aiCompiler: boolean;
  /** Allow anonymous/public contributors to submit memories for an asset. */
  collaborativeMemory?: boolean;
};