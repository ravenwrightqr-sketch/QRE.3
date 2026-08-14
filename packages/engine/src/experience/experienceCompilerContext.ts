import type { CognitiveExperiencePlan } from "@qre/contracts";

/**
 * Shared context for the canonical experience compiler chain.
 *
 * This is context, not a second compiler abstraction. V7 owns the initial
 * compilation boundary; V12-V16 extend it with memory capabilities.
 */
export type ExperienceCompilerContext = {
  businessName?: string;
  businessDomain?: string;
  ownerKey?: string;
  entityKey?: string;
  memorySummary?: string[];

  location?: {
    label?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  event?: {
    name?: string;
    venue?: string;
    date?: string;
    description?: string;
    participants?: string[];
  };

  memories?: unknown[];

  /** When supplied, cognition has already been resolved upstream. */
  cognitivePlan?: CognitiveExperiencePlan;
};
