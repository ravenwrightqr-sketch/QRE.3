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
  const graphEventIds = new Set(
    graph.events.map((event) => event.id),
  );

  const scopedIds = sourceEventIds?.length
    ? unique(sourceEventIds).filter((id) => graphEventIds.has(id))
    : graph.events.map((event) => event.id);

  const scoped = new Set(scopedIds);

  const discovered = searchMetamorphicRelations(graph)
    .filter((relation) =>
      relation.evidenceEventIds.every(
        (id) => scoped.has(clean(id)),
      ),
    )
    .map((relation) => {
      const evidenceEventIds = unique(
        relation.evidenceEventIds,
      ).filter((id) => scoped.has(id));

      const beforeEventIds = unique(
        relation.beforeEventIds,
      ).filter((id) => scoped.has(id));

      const afterEventIds = unique(
        relation.afterEventIds,
      ).filter((id) => scoped.has(id));

      const relationFrom = clean(
        relation.relation?.fromEventId,
      );
      const relationTo = clean(
        relation.relation?.toEventId,
      );

      const canonical: AuthorMetamorphicRelation = {
        id: relationId(relation),
        type: typeOf(clean(relation.type)),
        mechanism: relation.mechanism,
        evidenceEventIds,
        beforeEventIds,
        afterEventIds,
        before: clean(relation.before),
        after: clean(relation.after),
        relation:
          relation.relation &&
          scoped.has(relationFrom) &&
          scoped.has(relationTo)
            ? {
                kind: clean(relation.relation.kind),
                fromEventId: relationFrom,
                toEventId: relationTo,
              }
            : undefined,
        realizationMove: moveOf(
          clean(relation.realizationMove),
        ),
        creativeOpportunity: opportunityOf(
          clean(relation.creativeOpportunity),
        ),
        feltEffect: clean(relation.feltEffect),
        viewerShift: clean(relation.viewerShift),
        languageAim: clean(relation.languageAim),
        confidence: metric(relation.confidence),
        score: metric(relation.score),
      };

      return canonical;
    })
    .filter((relation) => {
      const relationIds = [
        ...relation.evidenceEventIds,
        ...relation.beforeEventIds,
        ...relation.afterEventIds,
        ...(relation.relation
          ? [
              relation.relation.fromEventId,
              relation.relation.toEventId,
            ]
          : []),
      ];

      return relationIds.every((id) => scoped.has(id));
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.id.localeCompare(b.id),
    );

  const uniqueRelations = [
    ...new Map(
      discovered.map((relation) => [
        relation.id,
        relation,
      ]),
    ).values(),
  ];

  const evidenceClosed = uniqueRelations.every(
    (relation) =>
      relation.evidenceEventIds.length > 0 &&
      relation.evidenceEventIds.every((id) =>
        scoped.has(id),
      ) &&
      relation.beforeEventIds.every((id) =>
        scoped.has(id),
      ) &&
      relation.afterEventIds.every((id) =>
        scoped.has(id),
      ) &&
      (!relation.relation ||
        (scoped.has(relation.relation.fromEventId) &&
          scoped.has(relation.relation.toEventId))),
  );

  const strongest = uniqueRelations[0];

  return {
    version: 1,
    sourceEventIds: scopedIds,
    relations: uniqueRelations,
    strongestRelationId: strongest?.id,
    relationCount: uniqueRelations.length,
    evidenceClosed,
  };
}

export function assertAuthorMetamorphicRelationSet(
  value: unknown,
): asserts value is AuthorMetamorphicRelationSet {
  const set =
    value as Partial<AuthorMetamorphicRelationSet> | undefined;

  const isNonEmptyString = (item: unknown): item is string =>
    typeof item === "string" && clean(item).length > 0;

  const isValidRelation = (
    relation: unknown,
  ): relation is AuthorMetamorphicRelation => {
    if (!relation || typeof relation !== "object") {
      return false;
    }

    const candidate = relation as Partial<AuthorMetamorphicRelation>;

    if (
      !isNonEmptyString(candidate.id) ||
      !isNonEmptyString(candidate.type) ||
      !isNonEmptyString(candidate.mechanism) ||
      !Array.isArray(candidate.evidenceEventIds) ||
      candidate.evidenceEventIds.length === 0 ||
      !candidate.evidenceEventIds.every(isNonEmptyString) ||
      !Array.isArray(candidate.beforeEventIds) ||
      !candidate.beforeEventIds.every(isNonEmptyString) ||
      !Array.isArray(candidate.afterEventIds) ||
      !candidate.afterEventIds.every(isNonEmptyString) ||
      !isNonEmptyString(candidate.realizationMove) ||
      !isNonEmptyString(candidate.creativeOpportunity) ||
      typeof candidate.confidence !== "number" ||
      typeof candidate.score !== "number"
    ) {
      return false;
    }

    return (
      Number.isFinite(candidate.confidence) &&
      Number.isFinite(candidate.score)
    );
  };

  if (
    !set ||
    set.version !== 1 ||
    !Array.isArray(set.sourceEventIds) ||
    !set.sourceEventIds.every(isNonEmptyString) ||
    new Set(set.sourceEventIds).size !== set.sourceEventIds.length ||
    !Array.isArray(set.relations) ||
    !set.relations.every(isValidRelation) ||
    typeof set.relationCount !== "number" ||
    set.relationCount !== set.relations.length ||
    !Number.isInteger(set.relationCount) ||
    set.relationCount < 0 ||
    set.evidenceClosed !== true
  ) {
    throw new Error(
      "AUTHOR METAMORPHIC PIPELINE SEALED: missing or invalid relation set",
    );
  }

  const sourceIds = new Set(set.sourceEventIds);

  for (const relation of set.relations) {
    const relationEvidenceIds = [
      ...relation.evidenceEventIds,
      ...relation.beforeEventIds,
      ...relation.afterEventIds,
      ...(relation.relation
        ? [
            relation.relation.fromEventId,
            relation.relation.toEventId,
          ]
        : []),
    ];

    if (
      !relationEvidenceIds.every((id) =>
        sourceIds.has(clean(id)),
      )
    ) {
      throw new Error(
        "AUTHOR METAMORPHIC PIPELINE SEALED: relation escaped source scope",
      );
    }
  }

  const relationIds = new Set(
    set.relations.map((relation) => clean(relation.id)),
  );

  if (
    set.strongestRelationId !== undefined &&
    !relationIds.has(clean(set.strongestRelationId))
  ) {
    throw new Error(
      "AUTHOR METAMORPHIC PIPELINE SEALED: strongest relation is not present",
    );
  }

  if (set.relations.length > 0 && !set.strongestRelationId) {
    throw new Error(
      "AUTHOR METAMORPHIC PIPELINE SEALED: strongest relation is missing",
    );
  }
}
