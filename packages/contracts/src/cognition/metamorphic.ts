
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