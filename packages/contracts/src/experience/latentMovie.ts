/**
 * QRE LATENT MOVIE CONTRACT
 *
 * IMPORTANT SEMANTIC NOTE:
 * "LatentMovie" is a compatibility name only. It represents a sequence-text
 * film: grounded text moving as a sequence. It is NOT a conventional movie,
 * screenplay, shot list, audiovisual production plan, or cinematic format.
 *
 * Author owns semantic sequence possibility. RealityGraph remains source truth.
 * No camera, transition, soundtrack, visual-effect, or production metadata belongs here.
 */

/** One grounded piece of source material that may appear in a sequence. */
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

/**
 * A candidate sequence-text film, not a movie object.
 * This is semantic sequence structure used as an Author compatibility carrier.
 */
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

  /** How materially this sequence differs from other semantic possibilities. */
  distinctiveness: number;
  score: number;
};

/**
 * Sequence movement semantics only. These describe how the reading changes
 * from one text unit to another; they are not film-production instructions.
 */
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
