/**
 * QRE COGAUTHOR MOUTH CONTRACTS · CANONICAL SHARED AUTHOR REALIZATION TYPES
 *
 * Semantic structures shared by the canonical Mouth candidate, repair,
 * quality, and sequence-selection services. These are not viewer prose.
 */
export type MouthCreativeRealization = {
  strategy: string;
  creativeOpportunity: string;
  realizationIntent: string;
  viewerEffect: string;
  sourceAnchors: readonly string[];
  forbiddenLiteralizations: readonly string[];

  /**
   * Canonical creative direction for the entire realization.
   * This is not viewer prose.
   */
  creativePremise?: string;

  /**
   * Ordered semantic trajectory the Mouth must express across the experience.
   * These are meaning moves, not literal captions.
   */
  creativeTrajectory?: readonly string[];

  /**
   * The intended escalation or intensification move for this realization.
   */
  escalationMove?: string;

  /**
   * Optional earlier material that can be revisited only after its meaning
   * has changed. It is not permission to repeat source language.
   */
  callbackPotential?: string;

  /**
   * The final semantic meaning the experience should leave behind.
   */
  terminalMeaning?: string;

  score: number;
};

export type MouthCandidateBeat = {
  order: number;
  role?: string;
  attentionFunction?: string;
  creativeMove?: string;
  realizationMode?: string;
  realizationStrategies?: readonly string[];
  creativeRealization?: MouthCreativeRealization;
  eventIds?: readonly string[];
  change?: string;
  next?: string;
  frontier?: string;
  setsUp?: readonly string[];
  paysOff?: readonly string[];
  obligations?: readonly string[];
  forbiddenMoves?: readonly string[];
  relationKinds?: readonly string[];
  relationStrength?: number;
};

export type MouthCandidate = {
  text: string;
  beatOrder: number;
  supportedEventIds: string[];
  supportedRelationPairs: string[];
  groundingScore: number;
  meaningScore: number;
  transitionScore: number;
  obligationCoverage: number;
  relationContractScore: number;
  forbiddenMoveRisk: number;
  cohesionScore: number;
  noveltyScore: number;
  compressionScore: number;
  inventionRisk: number;
  repetitionRisk: number;
  collageRisk: number;
  endpointExactness: number;
  score: number;
  reasons: string[];
};

export type MouthCandidateSelection = {
  selected?: MouthCandidate;
  candidates: MouthCandidate[];
};

export type MouthCandidateBatch = {
  variantsByBeat: Array<{ order: number; variants: string[] }>;
};

export type MouthCandidatePool = {
  order: number;
  candidates: MouthCandidate[];
};

export type MouthSequencePath = {
  candidates: MouthCandidate[];
  texts: string[];
  score: number;
};

export type MouthBeamOptions = {
  width?: number;
  candidatesPerBeat?: number;
};

export type MouthRepairObjective = {
  beatOrder: number;
  priority: "critical" | "high" | "medium";
  failures: string[];
  objective: string;
  preserve: string[];
  forbid: string[];
};
