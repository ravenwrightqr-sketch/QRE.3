/**
 * QRE WORLD SIMULATION · CANONICAL EXPERIENCE MODEL
 *
 * Rich, domain-neutral state surrounding the viewer. This is not a story,
 * scorecard, or source-of-truth store. It is a typed simulation of what a
 * viewer can currently know, expect, notice, infer, and update while moving
 * through supplied reality.
 *
 * SOURCE FACTS REMAIN IMMUTABLE.
 * SIMULATION MAY HYPOTHESIZE.
 * REALIZATION MAY EXPRESS.
 */

import type { RealityGraph } from "./realityGraph.js";

export type WorldRefKind = "entity" | "event" | "place" | "object" | "memory" | "experience" | "thread";
export type WorldRef = {
  id: string;
  kind: WorldRefKind;
  label: string;
  sourceEventIds: string[];
  sourceEvidenceIds: string[];
};

export type WorldRelationKind =
  | "agent_of" | "patient_of" | "possesses" | "owned_by" | "observes" | "observed_by"
  | "interacts_with" | "located_at" | "moves_to" | "returns_to" | "changes"
  | "contrasts_with" | "repeats" | "recontextualizes" | "causes" | "enables" | "blocks"
  | "precedes" | "follows" | "co_occurs_with" | "converges_with" | "persists_through"
  | "disappears_from" | "reappears_in";

export type WorldRelation = {
  id: string;
  from: WorldRef;
  to: WorldRef;
  kind: WorldRelationKind | string;
  strength: number;
  explicitness: "explicit" | "derived" | "hypothesized";
  evidenceEventIds: string[];
  evidenceRelations: string[];
  temporalContext?: { kind: "explicit" | "relative" | "unknown"; order?: number; label?: string };
  persistence: "momentary" | "episode" | "recurring" | "durable" | "unknown";
  polarity?: "positive" | "negative" | "ambivalent" | "neutral";
};

export type WorldStateDimension =
  | "location" | "participants" | "objects" | "actions" | "goal" | "relationship"
  | "status" | "affect" | "attention" | "time" | "identity" | "availability"
  | "ownership" | "social_context";

export type WorldQuestionType =
  | "causal" | "intentional" | "relational" | "temporal" | "identity"
  | "consequence" | "return" | "meaning" | "prediction" | "missing_information";

export type WorldQuestion = {
  id: string;
  type: WorldQuestionType;
  text: string;
  openedByEventIds: string[];
  supportedByRelationIds: string[];
  pressure: number;
  resolved: boolean;
  resolutionEventIds: string[];
};

export type WorldSnapshot = {
  id: string;
  eventIds: string[];
  activeRefs: WorldRef[];
  activeRelations: WorldRelation[];
  changedDimensions: WorldStateDimension[];
  stableDimensions: WorldStateDimension[];
  unresolved: WorldQuestion[];
  timestampLabel?: string;
};

export type ViewerExpectation = {
  id: string;
  proposition: string;
  basisEventIds: string[];
  basisRelationIds: string[];
  confidence: number;
  horizon: "immediate" | "near" | "episode";
  violatedByEventIds: string[];
  fulfilledByEventIds: string[];
};

export type ViewerHypothesis = {
  id: string;
  interpretation: string;
  supportingEventIds: string[];
  supportingRelationIds: string[];
  contradictingEventIds: string[];
  confidence: number;
  status: "forming" | "active" | "weakened" | "confirmed" | "reframed" | "abandoned";
  competingHypothesisIds: string[];
};

export type ViewerPredictionError = {
  id: string;
  expectationId: string;
  observedEventId: string;
  expected: string;
  observed: string;
  magnitude: number;
  causesModelUpdate: boolean;
};

export type ViewerBeliefUpdate = {
  id: string;
  triggerEventIds: string[];
  priorHypothesisIds: string[];
  posteriorHypothesisIds: string[];
  predictionErrorId?: string;
  explanationPressure: number;
  novelty: number;
};

export type AttentionFocus = {
  ref: WorldRef;
  reason: "novelty" | "prediction_error" | "relationship_change" | "recurrence" | "status_change" | "unresolved_question" | "salience" | "continuity";
  strength: number;
  durationHint: "glimpse" | "hold" | "return";
};

export type ViewerSimulationState = {
  known: WorldRef[];
  expectations: ViewerExpectation[];
  hypotheses: ViewerHypothesis[];
  unresolvedQuestions: WorldQuestion[];
  predictionErrors: ViewerPredictionError[];
  updates: ViewerBeliefUpdate[];
  attentionField: AttentionFocus[];
  currentSnapshotId?: string;
  dominantHypothesisId?: string;
  confidence: number;
};

export type LensPressure = {
  id: string;
  label: string;
  attentionPriorities: string[];
  preferredRelations: WorldRelationKind[];
  preferredQuestionTypes: WorldQuestionType[];
  realizationMoves: string[];
  statusFrames: string[];
  juxtapositionModes: string[];
  permissiblePersonification: "none" | "light" | "strong";
  explanationPressure: number;
  intensity: number;
};

export type InterpretationOpportunity = {
  id: string;
  hypothesis: string;
  relationIds: string[];
  eventIds: string[];
  questionIds: string[];
  compatibleLenses: LensPressure[];
  inferenceDistance: number;
  grounding: number;
  novelty: number;
  ambiguity: number;
  continuationPotential: number;
};

export type SimulationCutObjective = {
  id: string;
  role: "establish" | "orient" | "notice" | "question" | "pressure" | "recontextualize" | "prediction_error" | "update" | "recognition" | "payoff" | "continuation";
  sourceEventIds: string[];
  sourceRelationIds: string[];
  viewerBefore: ViewerSimulationState;
  viewerAfter: ViewerSimulationState;
  desiredInference?: string;
  forbiddenExplanation?: string;
  nextQuestion?: string;
};

export type WorldSimulation = {
  version: 1;
  reality: RealityGraph;
  refs: WorldRef[];
  relations: WorldRelation[];
  snapshots: WorldSnapshot[];
  questions: WorldQuestion[];
  interpretationOpportunities: InterpretationOpportunity[];
  viewer: ViewerSimulationState;
  lensPressure?: LensPressure;
  cutObjectives: SimulationCutObjective[];
  durableThreads: WorldQuestion[];
  reentry: {
    priorExperienceIds: string[];
    rememberedRefIds: string[];
    changedContextRefIds: string[];
    eligibleCallbacks: string[];
    meaningCanChange: boolean;
  };
};

export type WorldSimulationBuildInput = {
  reality: RealityGraph;
  subject?: string;
  lens?: string;
  priorExperienceIds?: string[];
  rememberedRefIds?: string[];
};
