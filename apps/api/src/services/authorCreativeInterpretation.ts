/**
 * QRE CREATIVE INTERPRETATION DISCOVERY · CANONICAL
 *
 * Cognition discovers metamorphic relationships across supplied reality.
 * It does not write prose and never grants permission to create concrete reality.
 */
import type {
  LatentMovieCandidate,
  LatentSemanticCreativeOpportunity,
  LatentSemanticMechanism,
  LatentSemanticRealization,
  LatentSemanticRealizationMove,
  RealityGraph,
} from "@qre/contracts";
import { searchMetamorphicRelations } from "./authorMetamorphicRelationSearch.js";

export type CreativeInterpretationMechanism = LatentSemanticMechanism;

export type CreativeInterpretation = LatentSemanticRealization & {
  /** Diagnostic statement only. The semantic fields are the downstream contract. */
  statement: string;
  metamorphicType?: string;
  metamorphicScore?: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function realizationMoveFor(value: string): LatentSemanticRealizationMove {
  switch (clean(value).toLowerCase()) {
    case "feel_state_transition": return "feel_state_transition";
    case "recognize_callback": return "recognize_callback";
    case "recontextualize_callback": return "recontextualize_callback";
    case "hold_contrast": return "hold_contrast";
    case "return_with_new_status": return "return_with_new_status";
    case "land_consequence": return "land_consequence";
    case "recognize": return "recognize";
    case "status_reversal": return "hold_contrast";
    case "service_to_status": return "land_consequence";
    case "converge_details": return "recognize";
    case "defeat_expectation": return "hold_contrast";
    default: return "recognize";
  }
}

function creativeOpportunityFor(value: string): LatentSemanticCreativeOpportunity | undefined {
  const text = clean(value).toLowerCase();
  if (!text) return undefined;
  if (text.includes("callback") || text.includes("return with a changed meaning")) return "callback_recontextualization";
  if (text.includes("status") || text.includes("presentation becomes the setup") || text.includes("polished presentation")) return "status_turn";
  if (text.includes("consequence") || text.includes("service into the setup")) return "consequence";
  if (text.includes("expectation") || text.includes("contrast")) return "contrast_reframe";
  if (text.includes("collapse supplied details") || text.includes("one memorable relationship")) return "recognition";
  return "recognition";
}

function mapRelation(relation: ReturnType<typeof searchMetamorphicRelations>[number]): CreativeInterpretation {
  return {
    statement: relation.type + ": " + clean(relation.creativeOpportunity),
    mechanism: relation.mechanism,
    evidenceEventIds: unique(relation.evidenceEventIds),
    beforeEventIds: unique(relation.beforeEventIds),
    afterEventIds: unique(relation.afterEventIds),
    before: clean(relation.before),
    after: clean(relation.after),
    relation: relation.relation
      ? {
          kind: clean(relation.relation.kind),
          fromEventId: clean(relation.relation.fromEventId),
          toEventId: clean(relation.relation.toEventId),
        }
      : undefined,
    realizationMove: realizationMoveFor(relation.realizationMove),
    creativeOpportunity: creativeOpportunityFor(relation.creativeOpportunity),
    feltEffect: clean(relation.feltEffect),
    viewerShift: clean(relation.viewerShift),
    languageAim: clean(relation.languageAim),
    confidence: relation.confidence,
    callback: undefined,
    subject: undefined,
    metamorphicType: relation.type,
    metamorphicScore: relation.score,
  };
}

/**
 * Return sequence-backed metamorphic interpretations.
 *
 * Important: the candidate movie remains the source of sequence structure;
 * this function only discovers earned semantic transformations inside it.
 */
export function deriveSequenceBackedCreativeInterpretations(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation[] {
  const ids = unique(candidate.trajectory.flatMap((step) => step.eventIds));
  if (ids.length < 2) return [];

  const relations = searchMetamorphicRelations(graph, ids);
  return relations.map(mapRelation);
}
