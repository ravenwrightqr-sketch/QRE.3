/**
 * QRE METAMORPHIC RELATION SET · CANONICAL RUNTIME ARTIFACT
 *
 * The relation search may discover many earned semantic relationships. This
 * service seals the candidate-scoped subset that downstream cognition,
 * movie selection, composition, and Mouth are allowed to see.
 */
import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  RealityGraph,
} from "@qre/contracts";
import { searchMetamorphicRelations } from "./authorMetamorphicRelationSearch.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const KNOWN_TYPES = new Set<AuthorMetamorphicRelation["type"]>([
  "presentation_behavior_collision",
  "service_outcome_inversion",
  "state_polarity_turn",
  "object_recontextualization",
  "expectation_break",
  "contrast_reversal",
  "consequence_reframe",
  "state_to_status",
  "recontextualization",
  "callback_recontextualization",
  "convergence",
]);

function typeOf(value: string): AuthorMetamorphicRelation["type"] {
  return KNOWN_TYPES.has(value as AuthorMetamorphicRelation["type"])
    ? value as AuthorMetamorphicRelation["type"]
    : `relation_${value || "unknown"}`;
}

function moveOf(value: string): AuthorMetamorphicRelation["realizationMove"] {
  switch (value) {
    case "feel_state_transition": return "feel_state_transition";
    case "recognize_callback": return "recognize_callback";
    case "recontextualize_callback": return "recontextualize_callback";
    case "hold_contrast": return "hold_contrast";
    case "return_with_new_status": return "return_with_new_status";
    case "land_consequence": return "land_consequence";
    default: return "recognize";
  }
}

function opportunityOf(value: string): AuthorMetamorphicRelation["creativeOpportunity"] {
  switch (value) {
    case "state_to_callback": return "state_to_callback";
    case "callback_recontextualization": return "callback_recontextualization";
    case "status_turn": return "status_turn";
    case "contrast_reframe": return "contrast_reframe";
    case "return_with_new_status": return "return_with_new_status";
    case "consequence": return "consequence";
    default: return "recognition";
  }
}

function relationId(relation: {
  type: string;
  evidenceEventIds: readonly string[];
}): string {
  return `metamorphic:${typeOf(relation.type)}:${[...relation.evidenceEventIds].sort().join("+")}`;
}

export function buildAuthorMetamorphicRelationSet(
  graph: RealityGraph,
  sourceEventIds?: readonly string[],
): AuthorMetamorphicRelationSet {
  const scoped = new Set(
    sourceEventIds?.length
      ? unique(sourceEventIds)
      : graph.events.map((event) => event.id),
  );

  const discovered = searchMetamorphicRelations(graph)
    .filter((relation) => relation.evidenceEventIds.every((id) => scoped.has(id)))
    .map((relation) => {
      const evidenceEventIds = unique(relation.evidenceEventIds);
      const beforeEventIds = unique(relation.beforeEventIds).filter((id) => scoped.has(id));
      const afterEventIds = unique(relation.afterEventIds).filter((id) => scoped.has(id));
      const canonical: AuthorMetamorphicRelation = {
        id: relationId(relation),
        type: typeOf(clean(relation.type)),
        mechanism: relation.mechanism,
        evidenceEventIds,
        beforeEventIds,
        afterEventIds,
        before: clean(relation.before),
        after: clean(relation.after),
        relation: relation.relation
          ? {
              kind: clean(relation.relation.kind),
              fromEventId: clean(relation.relation.fromEventId),
              toEventId: clean(relation.relation.toEventId),
            }
          : undefined,
        realizationMove: moveOf(clean(relation.realizationMove)),
        creativeOpportunity: opportunityOf(clean(relation.creativeOpportunity)),
        feltEffect: clean(relation.feltEffect),
        viewerShift: clean(relation.viewerShift),
        languageAim: clean(relation.languageAim),
        confidence: metric(relation.confidence),
        score: metric(relation.score),
      };
      return canonical;
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const ids = new Set(graph.events.map((event) => event.id));
  const evidenceClosed = discovered.every((relation) =>
    relation.evidenceEventIds.every((id) => ids.has(id)),
  );
  const strongest = discovered[0];

  return {
    version: 1,
    sourceEventIds: [...scoped].filter((id) => ids.has(id)),
    relations: discovered,
    strongestRelationId: strongest?.id,
    relationCount: discovered.length,
    evidenceClosed,
  };
}

export function assertAuthorMetamorphicRelationSet(
  value: unknown,
): asserts value is AuthorMetamorphicRelationSet {
  const set = value as Partial<AuthorMetamorphicRelationSet> | undefined;
  if (
    !set ||
    set.version !== 1 ||
    !Array.isArray(set.sourceEventIds) ||
    !Array.isArray(set.relations) ||
    typeof set.relationCount !== "number" ||
    set.relationCount !== set.relations.length ||
    set.evidenceClosed !== true
  ) {
    throw new Error("AUTHOR METAMORPHIC PIPELINE SEALED: missing or invalid relation set");
  }
}
