/**
 * QRE ENTERPRISE AUTHORING INTELLIGENCE CONTRACTS
 *
 * Domain-neutral contracts for the authoring stack above RealityGraph.
 * These describe authoring decisions; they do not create facts.
 */

export type AuthorRealizationStrategy =
  | "contrast"
  | "status_inversion"
  | "understatement"
  | "double_meaning"
  | "callback"
  | "implication"
  | "personification"
  | "recontextualization"
  | "compression"
  | "reversal";

export type AuthorLensKind =
  | "comedy"
  | "romance"
  | "horror"
  | "tenderness"
  | "nostalgia"
  | "chaos"
  | "fierce"
  | "absurd"
  | "dramatic"
  | "quiet"
  | "custom";

export type AuthorSafetyViolationKind =
  | "unsupported_person"
  | "unsupported_object"
  | "unsupported_action"
  | "unsupported_setting"
  | "unsupported_emotion"
  | "unsupported_reaction"
  | "unsupported_chronology"
  | "domain_leakage"
  | "literalized_metaphor"
  | "analytic_language"
  | "keyword_collage"
  | "generic_filler";

export type AuthorRepairKind =
  | "grounding"
  | "meaning"
  | "transition"
  | "language"
  | "invention"
  | "repetition"
  | "compression"
  | "payoff"
  | "cohesion"
  | "coverage";

export type AuthorEvidenceModality =
  | "text"
  | "image"
  | "document"
  | "timeline"
  | "geo"
  | "memory"
  | "scan";

export type AuthorModelTier =
  | "local_fast"
  | "local_reasoning"
  | "vision"
  | "cloud"
  | "deterministic";

export type AuthorCreativeProfile = {
  tone?: string;
  humor?: number;
  warmth?: number;
  weirdness?: number;
  darkness?: number;
  brevity?: number;
  preferredLenses?: AuthorLensKind[];
};

export type AuthorCharacterProfile = {
  subject: string;
  coreTraits: string[];
  statusPosture: string;
  emotionalPosture: string;
  contradictions: string[];
  objectRelationships: string[];
  privateInterpretations: string[];
  confidence: number;
};

export type AuthorLensProfile = {
  kind: AuthorLensKind;
  label: string;
  framingBias: string[];
  realizationPreferences: AuthorRealizationStrategy[];
  forbiddenRealityMoves: string[];
  intensity: number;
};

export type AuthorStrategyCandidate = {
  strategy: AuthorRealizationStrategy;
  reason: string;
  sourceRelationKinds: string[];
  safety: number;
  novelty: number;
};

export type AuthorRealizationObjective = {
  order: number;
  strategies: AuthorStrategyCandidate[];
  requiredEventIds: string[];
  requiredRelationPairs: string[];
  obligations: string[];
  forbiddenMoves: string[];
};

export type AuthorMultimodalEvidence = {
  sourceId: string;
  modality: AuthorEvidenceModality;
  label: string;
  value?: string;
  confidence: number;
  eventIds: string[];
  metadata?: Record<string, string | number | boolean | null>;
};

export type AuthorTimelineEvidence = {
  sourceId: string;
  label: string;
  timestamp?: string;
  durationMs?: number;
  confidence: number;
};

export type AuthorGeoEvidence = {
  sourceId: string;
  label: string;
  latitude?: number;
  longitude?: number;
  placeLabel?: string;
  confidence: number;
};

export type AuthorMemoryDelta = {
  memoryId: string;
  addedEvidence: string[];
  recurringSignals: string[];
  callbacks: string[];
  characterChanges: string[];
  preferredLenses: AuthorLensKind[];
  confidence: number;
};

export type AuthorStyleMemory = {
  profile: AuthorCreativeProfile;
  acceptedMotifs: string[];
  rejectedPatterns: string[];
  preferredStrategies: AuthorRealizationStrategy[];
  updatedAt: string;
};

export type AuthorVersionSnapshot = {
  version: string;
  realityVersion: string;
  movieVersion: string;
  beatVersion: string;
  realizationVersion: string;
  createdAt: string;
  parentVersion?: string;
};

export type AuthorAuditEntry = {
  id: string;
  stage: string;
  action: string;
  sourceIds: string[];
  candidateText?: string;
  score?: number;
  violations: AuthorSafetyViolationKind[];
  selected: boolean;
  timestamp: string;
};

export type AuthorModelRequestPolicy = {
  tier: AuthorModelTier;
  maxCalls: number;
  maxTokens: number;
  temperature: number;
  parallelizable: boolean;
  reason: string;
};

export type AuthorSearchBudget = {
  complexity: number;
  movieCount: number;
  candidatesPerBeat: number;
  beamWidth: number;
  maxRepairRounds: number;
  maxModelCalls: number;
};

export type AuthorMovieAlternative = {
  id: string;
  lens: AuthorLensKind;
  hypothesis: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  eventIds: string[];
  dominated: boolean;
};

export type AuthorCreativeCritique = {
  obviousness: number;
  genericness: number;
  safety: number;
  groundedSurprise: number;
  strongerAlternativeAvailable: boolean;
  strongerAlternativeIds: string[];
  notes: string[];
};

export type AuthorEnterpriseIntelligence = {
  character: AuthorCharacterProfile;
  lens: AuthorLensProfile;
  strategies: AuthorStrategyCandidate[];
  multimodalEvidence: AuthorMultimodalEvidence[];
  timeline?: AuthorTimelineEvidence[];
  geo?: AuthorGeoEvidence[];
  memoryDelta?: AuthorMemoryDelta;
  styleMemory?: AuthorStyleMemory;
  searchBudget: AuthorSearchBudget;
  modelPolicy: AuthorModelRequestPolicy;
  audit: AuthorAuditEntry[];
};
