/**
 * QRE SEQUENCE CANDIDATE CONTRACT
 *
 * Current Author artifact: a sequence-text film — text moving as a sequence
 * of attention-changing screens. This is semantic sequence structure only.
 * It is NOT a conventional movie, screenplay, shot list, camera plan,
 * soundtrack, transition system, or audiovisual production model.
 *
 * Do not add Movie abstractions here. `SequenceCandidate` is the only name
 * used for a possible grounded semantic sequence.
 */

/** One grounded piece of source material that may appear in a sequence. */
export type SequenceEvent = {
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

/** A grounded semantic possibility for a sequence-text film. */
export type SequenceCandidate = {
  id: string;
  lens: string;
  anchorEventIds: string[];
  supportingRelationKinds: string[];
  trajectory: SequenceTrajectoryStep[];
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
  distinctiveness: number;
  score: number;
};

/** Sequence movement semantics only. */
export type SequenceTrajectoryStep = {
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
