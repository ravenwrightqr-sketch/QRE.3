/**
 * =====================================================
 * QRE ENTITLEMENT RULES
 * =====================================================
 *
 * Single source of truth for:
 *
 * CONSUMER
 * PRO
 * BUSINESS
 *
 * Used by:
 *
 * - Stripe
 * - API authorization
 * - Scan Engine
 * - Flow Builder
 * - Dashboard
 *
 * =====================================================
 */

import type { AccountPlan, Entitlement } from "./entitlements.js";

export const ENTITLEMENT_RULES: Record<AccountPlan, Entitlement> = {
  CONSUMER: {
    maxAssets: null,
    maxFlowsPerAsset: 1,
    maxMomentsPerFlow: 16,
    maxMediaItems: 100,
    analytics: "BASIC",
    transferableAssets: true,
    flowLibrary: false,
    flowAttachDetach: false,
    scheduledFlows: false,
    aiCompiler: true,
    collaborativeMemory: false,
  },

  PRO: {
    maxAssets: null,
    maxFlowsPerAsset: null,
    maxMomentsPerFlow: null as unknown as number,
    maxMediaItems: null as unknown as number,
    analytics: "ADVANCED",
    transferableAssets: true,
    flowLibrary: true,
    flowAttachDetach: true,
    scheduledFlows: true,
    aiCompiler: true,
    collaborativeMemory: true,
  },

  BUSINESS: {
    maxAssets: null,
    maxFlowsPerAsset: null,
    maxMomentsPerFlow: null as unknown as number,
    maxMediaItems: null as unknown as number,
    analytics: "BUSINESS",
    transferableAssets: true,
    flowLibrary: true,
    flowAttachDetach: true,
    scheduledFlows: true,
    aiCompiler: true,
    collaborativeMemory: true,
  },
};
