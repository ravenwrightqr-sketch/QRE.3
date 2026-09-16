/**
 * QRE LATENT MOVIE CONTRACT · CANONICAL HYPOTHESIS LAYER
 *
 * Universal semantic structures discovered from immutable RealityGraph data.
 * This contract is domain-neutral: groomers, weddings, services, people,
 * places, events, animals, and ordinary life all use the same representation.
 *
 * IMPORTANT: Latent Movie data is interpretation, not source truth.
 */
import type { WorldSimulation } from "../world/worldSimulation.js";

export type LatentMovieEvent = {
  id: string;
  order: number;
  fact: string;
  actor?: string;
  object?: string;
  place?: string;
  stateBefore?: string;
  stateAfter?: string;
  confidence: number;
};

export type LatentMovie = {
  subject: string;
  participants: string[];
  places: string[];
  before?: string;
  after?: string;
  events: LatentMovieEvent[];
  details: string[];
  emotionalDirection: string[];
  styleLenses: string[];
  memoryPotential: string[];
  continuation?: string;
};

export type LatentSemanticMechanism =
  | "expectation_shift"
  | "continuation"
  | "state_change"
  | "recurrence"
  | "convergence"
  | "contrast"
  | "consequence";

export type LatentSemanticRealizationMove =
  | "feel_state_transition"
  | "recognize_callback"
  | "recontextualize_callback"
  | "hold_contrast"
  | "return_with_new_status"
  | "land_consequence"
  | "recognize";

export type LatentSemanticCreativeOpportunity =
  | "state_to_callback"
  | "callback_recontextualization"
  | "status_turn"
  | "contrast_reframe"
  | "return_with_new_status"
  | "consequence"
  | "recognition";

export type LatentSemanticCallback = {
  detail: string;
  eventIds: string[];
  role: "continuity" | "recontextualization";
};

export type LatentSemanticRealization = {
  mechanism: LatentSemanticMechanism;
  evidenceEventIds: string[];
  beforeEventIds: string[];
  afterEventIds: string[];
  before?: string;
  after?: string;
  subject?: string;
  callback?: LatentSemanticCallback;
  relation?: {
    kind: string;
    fromEventId: string;
    toEventId: string;
  };
  realizationMove: LatentSemanticRealizationMove;
  creativeOpportunity?: LatentSemanticCreativeOpportunity;
  feltEffect?: string;
  viewerShift?: string;
  languageAim?: string;
  confidence: number;
};

export type ObserverExperienceObjective = {
  objective: string;
  surprise: string;
  curiosity: string;
  attention: string[];
  landing: string;
  explanationForbidden: boolean;
  feltEffect?: string;
  viewerShift?: string;
  realizationDirection?: string;
  simulation?: WorldSimulation;
};

export type LatentStoryThesis = {
  initialReading: string;
  semanticTurn: string;
  semanticRealization?: LatentSemanticRealization;
  beforeMeaning: string[];
  afterMeaning: string[];
  beforeEventIds: string[];
  afterEventIds: string[];
  relationKind?: string;
  carrierEventIds: string[];
  sealingEventIds: string[];
  payoffDependency: string;
  counterfactualDependency: number;
  observerExperience?: ObserverExperienceObjective;
};

export type LatentMovieCandidate = {
  id: string;
  lens: string;
  anchorEventIds: string[];
  supportingRelationKinds: string[];
  trajectory: LatentMovieTrajectoryStep[];
  payoff: string;
  unresolvedQuestion: string;
  evidence: string[];
  hypothesis: string[];
  storyThesis?: LatentStoryThesis;
  truthRisk: number;
  novelty: number;
  specificity: number;
  informationValue: number;
  uncertainty: number;
  attentionPotential: number;
  consequencePotential: number;
  callbackPotential: number;
  compressionPotential: number;
  repetitionRisk: number;
  viewerStateDynamics?: {
    attention: number;
    curiosity: number;
    contrast: number;
    interruption: number;
    accumulation: number;
    payoff: number;
    tempo: number;
    continuity: number;
    predictionError: number;
    stateShift: number;
    score: number;
  };
  distinctiveness: number;
  score: number;
};

export type LatentMovieTrajectoryStep = {
  order: number;
  operation: "establish" | "contrast" | "recur" | "reframe" | "escalate" | "converge" | "reveal" | "consequence" | "payoff";
  eventIds: string[];
  viewerChange: string;
  nextQuestion: string;
};
