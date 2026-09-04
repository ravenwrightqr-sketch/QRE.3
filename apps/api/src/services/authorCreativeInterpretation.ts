/**
 * QRE CREATIVE INTERPRETATION DISCOVERY · CANONICAL
 *
 * Cognition discovers metamorphic relationships across supplied reality.
 * It does not write prose and never grants permission to create concrete reality.
 */
import type {
  LatentMovieCandidate,
  LatentSemanticMechanism,
  LatentSemanticRealization,
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
    realizationMove: clean(relation.realizationMove) || "recontextualize",
    creativeOpportunity: clean(relation.creativeOpportunity),
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
