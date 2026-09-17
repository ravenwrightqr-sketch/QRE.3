import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  LatentMovieCandidate,
  LatentSemanticCreativeOpportunity,
  RealityGraph,
} from "@qre/contracts";
import {
  deriveSequenceBackedCreativeInterpretations,
  type CreativeInterpretation,
} from "./authorCreativeInterpretation.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function relationType(
  interpretation: CreativeInterpretation,
): AuthorMetamorphicRelation["type"] {
  if (interpretation.evidenceEventIds.length === 1) return "relation_observation";
  switch (interpretation.mechanism) {
    case "contrast": return "contrast_reversal";
    case "consequence": return "consequence_reframe";
    case "state_change": return "state_to_status";
    case "recurrence": return "callback_recontextualization";
    case "convergence": return "convergence";
    case "expectation_shift": return "expectation_break";
    default: return "recontextualization";
  }
}

function creativeOpportunityFor(
  interpretation: CreativeInterpretation,
): LatentSemanticCreativeOpportunity {
  if (interpretation.creativeOpportunity) return interpretation.creativeOpportunity;
  switch (interpretation.mechanism) {
    case "expectation_shift": return "reframe";
    case "contrast": return "juxtaposition";
    case "state_change": return "status_flip";
    case "recurrence": return "callback";
    case "consequence": return "aftermath";
    case "convergence": return "accumulation";
    case "continuation": return "open_end";
    default: return "compression";
  }
}

function mapInterpretation(
  interpretation: CreativeInterpretation,
  index: number,
): AuthorMetamorphicRelation {
  const confidence = Math.max(0, Math.min(1, interpretation.confidence));
  return {
    id: `creative-interpretation-${index + 1}`,
    type: relationType(interpretation),
    mechanism: interpretation.mechanism,
    evidenceEventIds: unique(interpretation.evidenceEventIds),
    beforeEventIds: unique(interpretation.beforeEventIds),
    afterEventIds: unique(interpretation.afterEventIds),
    before: clean(interpretation.before),
    after: clean(interpretation.after),
    relation: interpretation.relation
      ? {
          kind: clean(interpretation.relation.kind),
          fromEventId: clean(interpretation.relation.fromEventId),
          toEventId: clean(interpretation.relation.toEventId),
        }
      : undefined,
    realizationMove: interpretation.realizationMove,
    creativeOpportunity: creativeOpportunityFor(interpretation),
    feltEffect: clean(interpretation.feltEffect),
    viewerShift: clean(interpretation.viewerShift),
    languageAim: clean(interpretation.languageAim),
    confidence,
    // CreativeInterpretation remains the single semantic ranking authority.
    score: confidence,
  };
}

export function buildAuthorMetamorphicRelationSet(input: {
  graph: RealityGraph;
  movie: LatentMovieCandidate;
}): AuthorMetamorphicRelationSet {
  const sourceEventIds = unique(
    input.movie.trajectory.flatMap((step) => step.eventIds ?? []),
  );
  const sourceScope = new Set(sourceEventIds);
  const relations = deriveSequenceBackedCreativeInterpretations(
    input.graph,
    input.movie,
  )
    .filter(
      (interpretation) =>
        interpretation.evidenceEventIds.length > 0 &&
        interpretation.evidenceEventIds.every((id) => sourceScope.has(id)),
    )
    .map(mapInterpretation)
    .filter((relation) => relation.evidenceEventIds.length > 0)
    .sort((left, right) => right.score - left.score || right.confidence - left.confidence);

  return {
    version: 1,
    sourceEventIds,
    relations,
    strongestRelationId: relations[0]?.id,
    relationCount: relations.length,
    evidenceClosed: relations.every((relation) =>
      relation.evidenceEventIds.every((id) => sourceScope.has(id)),
    ),
  };
}

export function assertAuthorMetamorphicRelationSet(
  value: AuthorMetamorphicRelationSet | undefined,
): asserts value is AuthorMetamorphicRelationSet {
  if (!value || value.version !== 1 || !value.evidenceClosed) {
    throw new Error("AUTHOR METAMORPHIC PIPELINE SEALED: missing evidence-closed relation set");
  }
  const scope = new Set(value.sourceEventIds);
  if (
    value.relationCount !== value.relations.length ||
    value.relations.some((relation) =>
      !relation.evidenceEventIds.length ||
      relation.evidenceEventIds.some((id) => !scope.has(id)),
    )
  ) {
    throw new Error("AUTHOR METAMORPHIC PIPELINE SEALED: relation escaped source-event scope");
  }
}
