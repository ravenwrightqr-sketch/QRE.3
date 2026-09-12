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

  /**
   * Maximum assets this account may own.
   * null = unlimited
   */
  maxAssets: number | null;

  /**
   * Maximum flows that may be attached
   * to a single asset.
   * null = unlimited
   */
  maxFlowsPerAsset: number | null;

  /**
   * Maximum moments inside one flow.
   */
  maxMomentsPerFlow: number;

  /**
   * Maximum uploaded media items
   * available to each asset.
   */
  maxMediaItems: number;

  /**
   * Analytics level.
   */
  analytics: AnalyticsTier;

  /**
   * Can transfer ownership of
   * permanent assets.
   */
  transferableAssets: boolean;

  /**
   * Can access Flow Library.
   */
  flowLibrary: boolean;

  /**
   * Can detach and reattach flows.
   */
  flowAttachDetach: boolean;

  /**
   * Can schedule flows.
   */
  scheduledFlows: boolean;

  /**
   * Can use AI experience compiler.
   */
  aiCompiler: boolean;

  /**
   * Can enable collaborative memory contributions
   * on eligible assets.
   */
  collaborativeMemory: boolean;

};
