/**
 * Compatibility surface for legacy/direct COGAUTHOR imports.
 *
 * The canonical cognition contract is owned by experience/cognition.ts and
 * exported through the public @qre/contracts barrel. Keep this file as a
 * thin re-export so older imports resolve to the same type definitions.
 */
export type {
  CognitiveClaimStatus,
  CognitiveEvidence,
  CognitiveClaim,
  CognitiveAssumption,
  ExperienceHypothesisKind,
  ExperienceHypothesis,
  CognitiveBeatKind,
  CognitiveBeatDirective,
  CognitiveExperienceRealization,
  CognitiveExperiencePlan,
  CognitiveCreativeLearning,
  CognitiveAnalyticsSignal,
  CognitiveEntityState,
  CognitiveRelationshipState,
  CognitiveMindState,
  CognitiveExperienceState,
} from "../experience/cognition.js";
