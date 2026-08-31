/**
 * QRE LATENT MOVIE CONTRACT · CANONICAL HYPOTHESIS LAYER
 *
 * Universal semantic structures discovered from immutable RealityGraph data.
 * This contract is domain-neutral: groomers, weddings, services, people,
 * places, events, animals, and ordinary life all use the same representation.
 *
 * IMPORTANT: Latent Movie data is interpretation, not source truth.
 */
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

/**
 * One internal observer-facing objective derived from the winning semantic
 * interpretation. It is direction for realization, never viewer prose.
 */
export type ObserverExperienceObjective = {
  objective: string;
  surprise: string;
  curiosity: string;
  attention: string[];
  landing: string;
  explanationForbidden: boolean;
};

export type LatentStoryThesis = {
  initialReading: string;
  semanticTurn: string;
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

/** A semantic hypothesis discovered from RealityGraph. It is never source truth. */
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

  /** Epistemic / creative diagnostics. */
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

  /** Pre-language viewer-state trajectory diagnostics. */
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

  /** How materially this movie differs from the other candidates in the same search. */
  distinctiveness: number;
  score: number;
};

export type LatentMovieTrajectoryStep = {
  order: number;
  operation:
    | "establish"
    | "contrast"
    | "recur"
    | "reframe"
    | "escalate"
    | "converge"
    | "reveal"
    | "consequence"
    | "payoff";
  eventIds: string[];
  viewerChange: string;
  nextQuestion: string;
};
