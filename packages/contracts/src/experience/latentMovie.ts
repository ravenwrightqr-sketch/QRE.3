/**
 * Universal semantic movie hidden inside an experience.
 *
 * This is deliberately domain-neutral. A groomer, wedding, gym session,
 * house, vehicle, relationship, animal, event, or place all reduce to the
 * same observable structure before language realization begins.
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
