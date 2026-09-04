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

function convergenceCluster(
  graph: RealityGraph,
  candidateIds: readonly string[],
  fromId: string,
  toId: string,
): string[] {
  const allowed = new Set(candidateIds);
  const adjacency = new Map<string, string[]>();

  for (const relation of graph.relations) {
    if (relation.kind !== "converges") continue;
    if (!allowed.has(relation.from) || !allowed.has(relation.to)) continue;
    const from = adjacency.get(relation.from) ?? [];
    const to = adjacency.get(relation.to) ?? [];
    from.push(relation.to);
    to.push(relation.from);
    adjacency.set(relation.from, from);
    adjacency.set(relation.to, to);
  }

  const seed = [fromId, toId].filter((id) => allowed.has(id));
  const visited = new Set<string>();
  const queue = [...seed];

  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) queue.push(next);
    }
  }

  if (visited.size < 2) return seed;

  return candidateIds.filter((id) => visited.has(id));
}

function mapRelation(
  graph: RealityGraph,
  candidateIds: readonly string[],
  relation: ReturnType<typeof searchMetamorphicRelations>[number],
): CreativeInterpretation {
  let evidenceEventIds = unique(relation.evidenceEventIds);
  let beforeEventIds = unique(relation.beforeEventIds);
  let afterEventIds = unique(relation.afterEventIds);
  let before = clean(relation.before);
  let after = clean(relation.after);

  if (
    relation.relation?.kind === "converges" &&
    relation.relation.fromEventId &&
    relation.relation.toEventId
  ) {
    const cluster = convergenceCluster(
      graph,
      candidateIds,
      relation.relation.fromEventId,
      relation.relation.toEventId,
    );

    if (cluster.length >= 3) {
      const first = cluster[0]!;
      const last = cluster[cluster.length - 1]!;
      evidenceEventIds = cluster;
      beforeEventIds = [first];
      afterEventIds = [last];
      before = clean(graph.events.find((event) => event.id === first)?.label);
      after = clean(graph.events.find((event) => event.id === last)?.label);
    }
  }

  return {
    statement: relation.type + ": " + clean(relation.creativeOpportunity),
    mechanism: relation.mechanism,
    evidenceEventIds,
    beforeEventIds,
    afterEventIds,
    before,
    after,
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
  return relations.map((relation) => mapRelation(graph, ids, relation));
}
