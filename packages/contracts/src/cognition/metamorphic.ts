/** Semantic opportunities detected directly from supplied reality. */
export type SemanticMechanism = "expectation_shift" | "continuation" | "state_change" | "recurrence" | "convergence" | "contrast" | "consequence";
export type SemanticRealizationMove = "feel_state_transition" | "recognize_callback" | "recontextualize_callback" | "hold_contrast" | "return_with_new_status" | "land_consequence" | "recognize";
export type SemanticCreativeOpportunity = "status_turn" | "contrast_reframe" | "state_to_callback" | "consequence" | "callback_recontextualization" | "recognition";
export type AuthorMetamorphicRelationType = "service_outcome_inversion" | "state_polarity_turn" | "object_recontextualization" | "expectation_break" | "contrast_reversal" | "consequence_reframe" | "state_to_status" | "recontextualization" | "callback_recontextualization" | "convergence" | "relation_${string}";
export type AuthorMetamorphicRelation = {
  id: string; type: AuthorMetamorphicRelationType; mechanism: SemanticMechanism; evidenceEventIds: string[]; beforeEventIds: string[]; afterEventIds: string[];
  before: string; after: string; relation?: { kind: string; fromEventId: string; toEventId: string };
  realizationMove: SemanticRealizationMove; creativeOpportunity: SemanticCreativeOpportunity; feltEffect: string; viewerShift: string; languageAim: string;
  confidence: number; score: number;
};
export type AuthorMetamorphicRelationSet = { version: 1; sourceEventIds: string[]; relations: AuthorMetamorphicRelation[]; strongestRelationId?: string; relationCount: number; evidenceClosed: boolean };
