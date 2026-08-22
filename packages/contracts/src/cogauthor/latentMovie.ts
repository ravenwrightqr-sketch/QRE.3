/**
 * QRE LATENT MOVIE CONTRACT · CANONICAL COGAUTHOR HYPOTHESIS LAYER
 *
 * Universal semantic structures discovered from immutable RealityGraph data.
 * Latent Movie data is interpretation, never source truth.
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

export type LatentStoryThesis = {
  initialReading: string;
  semanticTurn: string;
  carrierEventIds: string[];
  sealingEventIds: string[];
  payoffDependency: string;
  counterfactualDependency: number;
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
