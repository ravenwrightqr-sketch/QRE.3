import type {
  LatentSemanticCreativeOpportunity,
  LatentSemanticMechanism,
  LatentSemanticRealizationMove,
} from "../movie/latentMovie.js";

export type AuthorMetamorphicRelationType =
  | "presentation_behavior_collision"
  | "service_outcome_inversion"
  | "state_polarity_turn"
  | "object_recontextualization"
  | "expectation_break"
  | "contrast_reversal"
  | "consequence_reframe"
  | "state_to_status"
  | "recontextualization"
  | "callback_recontextualization"
  | "convergence"
  | `relation_${string}`;

export type AuthorMetamorphicRelation = {
  id: string;
  type: AuthorMetamorphicRelationType;
  mechanism: LatentSemanticMechanism;
  evidenceEventIds: string[];
  beforeEventIds: string[];
  afterEventIds: string[];
  before: string;
  after: string;
  relation?: {
    kind: string;
    fromEventId: string;
    toEventId: string;
  };
  realizationMove: LatentSemanticRealizationMove;
  creativeOpportunity: LatentSemanticCreativeOpportunity;
  feltEffect: string;
  viewerShift: string;
  languageAim: string;
  confidence: number;
  score: number;
};

export type AuthorMetamorphicRelationSet = {
  version: 1;
  sourceEventIds: string[];
  relations: AuthorMetamorphicRelation[];
  strongestRelationId?: string;
  relationCount: number;
  evidenceClosed: boolean;
};
