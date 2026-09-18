import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  LatentSemanticCreativeOpportunity,
  MouthCandidateBeat,
  MouthInferenceBudget,
  MouthRealizationAuthority,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[] = []): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const uniqueCanonical = (values: readonly unknown[] = []): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = clean(value);
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(text);
  }

  return result;
};

const STATE_STATUS_TAGS = new Set([
  "approval",
  "completion",
  "repair",
  "transformation",
  "uncertainty",
]);

const STATE_STATUS_ACTION = /\b(?:approv(?:e|ed|es|ing)|accept(?:ed|s|ing)?|confirm(?:ed|s|ing)?|finish(?:ed|es|ing)?|complete(?:d|s|ing)?|fix(?:ed|es|ing)?|repair(?:ed|s|ing)?|restore(?:d|s|ing)?|renew(?:ed|s|ing)?|change(?:d|s|ing)?)\b/i;

const DEFAULT_FORBIDDEN_MOVES = [
  "Do not invent concrete physical facts, actions, body behavior, sensory details, environment, dialogue, entities, objects, chronology, or events.",
  "Do not substitute supplied concrete objects with different concrete objects.",
  "Do not downgrade supplied concrete specificity into generic object language.",
  "Do not treat lens, genre, status, attitude, or implication as new source evidence.",
];

function beatEventIds(beat: MouthCandidateBeat): string[] {
  return unique(beat.eventIds ?? []);
}

function localStructures(
  envelope: RealityEnvelope,
  eventIds: readonly string[],
) {
  const scope = new Set(eventIds);
  return envelope.eventStructure.filter((structure) =>
    scope.has(structure.eventId),
  );
}

function localRelations(
  envelope: RealityEnvelope,
  eventIds: readonly string[],
) {
  const scope = new Set(eventIds);
  return envelope.relations.filter(
    (relation) => scope.has(relation.from) && scope.has(relation.to),
  );
}

function scopedSuppliedValues(
  values: readonly string[],
  events: readonly { label: string }[],
): string[] {
  return uniqueCanonical(
    values.filter((value) => {
      const text = clean(value);
      if (!text) return false;

      return events.some((event) =>
        clean(event.label).toLowerCase().includes(text.toLowerCase()),
      );
    }),
  );
}

function structureStateTags(
  structures: ReturnType<typeof localStructures>,
): string[] {
  return uniqueCanonical(
    structures.flatMap((structure) =>
      (structure.semanticTags ?? []).filter((tag) =>
        STATE_STATUS_TAGS.has(clean(tag).toLowerCase()),
      ),
    ),
  );
}

function stateKeys(values: readonly string[]): Set<string> {
  return new Set(values.map((value) => clean(value).toLowerCase()).filter(Boolean));
}

function stateLikeAction(
  action: string,
  structure: ReturnType<typeof localStructures>[number],
): boolean {
  const text = clean(action);
  if (!text) return false;

  const states = stateKeys([
    ...(structure.states ?? []),
    ...(structure.semanticTags ?? []).filter((tag) =>
      STATE_STATUS_TAGS.has(clean(tag).toLowerCase()),
    ),
  ]);

  return (
    states.has(text.toLowerCase()) ||
    (STATE_STATUS_ACTION.test(text) &&
      (states.has("approval") ||
        states.has("completion") ||
        states.has("repair") ||
        states.has("transformation")))
  );
}

function realityFor(input: {
  envelope: RealityEnvelope;
  events: readonly { label: string }[];
  structures: ReturnType<typeof localStructures>;
  eventIds: readonly string[];
}): MouthRealizationAuthority["reality"] {
  const { envelope, events, structures, eventIds } = input;
  const states = uniqueCanonical([
    ...structures.flatMap((structure) => structure.states ?? []),
    ...scopedSuppliedValues(envelope.suppliedStates, events),
    ...structureStateTags(structures),
  ]);
  const stateLookup = stateKeys(states);
  const subjects = uniqueCanonical(
    structures.flatMap((structure) => structure.subjects ?? []),
  );
  const actions = uniqueCanonical(
    structures.flatMap((structure) =>
      (structure.actions ?? []).filter(
        (action) => !stateLikeAction(action, structure),
      ),
    ),
  );
  const actionLookup = stateKeys(actions);
  const subjectLookup = stateKeys(subjects);
  const objects = uniqueCanonical(
    structures.flatMap((structure) =>
      (structure.objects ?? []).filter((object) => {
        const key = clean(object).toLowerCase();
        return (
          key &&
          !subjectLookup.has(key) &&
          !actionLookup.has(key) &&
          !stateLookup.has(key)
        );
      }),
    ),
  );

  return {
    eventIds: unique(eventIds),
    entities: subjects,
    actions,
    objects,
    states,
  };
}

function scopedSemantic(beat: MouthCandidateBeat) {
  const semantic = beat.semanticRealization;
  if (!semantic) return undefined;

  const scope = new Set(beatEventIds(beat));
  const evidenceEventIds = unique(semantic.evidenceEventIds).filter((id) =>
    scope.has(id),
  );

  if (!evidenceEventIds.length) return undefined;

  const beforeEventIds = unique(semantic.beforeEventIds).filter((id) =>
    scope.has(id),
  );
  const afterEventIds = unique(semantic.afterEventIds).filter((id) =>
    scope.has(id),
  );
  const relation =
    semantic.relation &&
    scope.has(semantic.relation.fromEventId) &&
    scope.has(semantic.relation.toEventId)
      ? semantic.relation
      : undefined;

  return {
    ...semantic,
    evidenceEventIds,
    beforeEventIds,
    afterEventIds,
    relation,
  };
}

function inferenceBudgetFor(beat: MouthCandidateBeat): MouthInferenceBudget {
  const role = clean(beat.role).toLowerCase();
  const semantic = scopedSemantic(beat);
  const hasMeaning = Boolean(
    semantic?.realizationMove ||
      semantic?.creativeOpportunity ||
      semantic?.feltEffect ||
      semantic?.viewerShift ||
      beat.observerExperience?.realizationDirection,
  );

  if (!hasMeaning) return "direct";
  if (/establish|opening|arrival/.test(role)) return "compressed";
  if (/payoff|release|landing/.test(role)) return "interpretive";
  return "strongly-interpretive";
}

function relationType(kind: string): AuthorMetamorphicRelation["type"] {
  switch (kind) {
    case "changes":
      return "state_polarity_turn";
    case "contrasts":
      return "contrast_reversal";
    case "recontextualizes":
      return "recontextualization";
    case "repeats":
      return "callback_recontextualization";
    case "causes":
      return "consequence_reframe";
    case "converges":
      return "convergence";
    default:
      return `relation_${kind || "unknown"}`;
  }
}

function semanticRelationFor(
  beat: MouthCandidateBeat,
): AuthorMetamorphicRelation | undefined {
  const semantic = scopedSemantic(beat);
  if (!semantic) return undefined;

  const kind = clean(semantic.relation?.kind || semantic.mechanism);
  const evidenceEventIds = unique(semantic.evidenceEventIds);

  return {
    id: `mouth-authority:${beat.order}:semantic`,
    type: relationType(kind),
    mechanism: semantic.mechanism,
    evidenceEventIds,
    beforeEventIds: unique(semantic.beforeEventIds),
    afterEventIds: unique(semantic.afterEventIds),
    before: clean(semantic.before),
    after: clean(semantic.after),
    relation: semantic.relation,
    realizationMove: semantic.realizationMove,
    creativeOpportunity:
      semantic.creativeOpportunity ?? ("recognition" as LatentSemanticCreativeOpportunity),
    feltEffect: clean(semantic.feltEffect),
    viewerShift: clean(semantic.viewerShift),
    languageAim: clean(semantic.languageAim),
    confidence: semantic.confidence,
    score: semantic.confidence,
  };
}

function relationSetFor(beat: MouthCandidateBeat): AuthorMetamorphicRelationSet {
  const relation = semanticRelationFor(beat);
  const relations = relation ? [relation] : [];
  const sourceEventIds = unique([
    ...beatEventIds(beat),
    ...relations.flatMap((item) => item.evidenceEventIds),
  ]);

  return {
    version: 1,
    sourceEventIds,
    relations,
    strongestRelationId: relation?.id,
    relationCount: relations.length,
    evidenceClosed: relations.every((item) =>
      item.evidenceEventIds.every((id) => sourceEventIds.includes(id)),
    ),
  };
}

export function buildMouthRealizationAuthority(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  treatment?: {
    label?: string;
    intensity?: number;
    framingBias?: readonly string[];
    realizationPreferences?: readonly string[];
    forbiddenRealityMoves?: readonly string[];
  };
}): MouthRealizationAuthority {
  const { beat, envelope } = input;
  const eventIds = beatEventIds(beat);
  const events = envelope.events.filter((event) => eventIds.includes(event.id));
  const structures = localStructures(envelope, eventIds);
  const relations = localRelations(envelope, eventIds);
  const semantic = scopedSemantic(beat);
  const observer = semantic ? beat.observerExperience : undefined;

  const permittedRealizationModes = unique([
    beat.creativeMove,
    beat.realizationMode,
    ...(beat.relationKinds ?? []),
    ...relations.map((relation) => relation.kind),
    semantic?.mechanism,
    semantic?.realizationMove,
    semantic?.creativeOpportunity,
  ]);

  const earnedInterpretations = semantic
    ? unique([
        semantic.after,
        semantic.viewerShift,
        semantic.feltEffect,
        observer?.feltEffect,
        semantic.languageAim,
        semantic.realizationMove,
        semantic.creativeOpportunity,
      ])
    : [];

  return {
    reality: realityFor({ envelope, events, structures, eventIds }),
    meaning: {
      mechanism: clean(semantic?.mechanism),
      before: clean(semantic?.before),
      after: clean(semantic?.after),
      relationKind: clean(semantic?.relation?.kind || relations[0]?.kind),
      realizationMove: clean(semantic?.realizationMove),
      creativeOpportunity: clean(semantic?.creativeOpportunity),
      feltEffect: clean(semantic?.feltEffect ?? observer?.feltEffect),
      viewerShift: clean(semantic?.viewerShift ?? observer?.viewerShift),
      realizationDirection: clean(observer?.realizationDirection),
      languageAim: clean(semantic?.languageAim),
    },
    metamorphicRelationSet: relationSetFor(beat),
    earnedInterpretations,
    permittedRealizationModes,
    inferenceBudget: inferenceBudgetFor(beat),
    creativeMoves: permittedRealizationModes,
    treatment: input.treatment
      ? {
          label: clean(input.treatment.label) || "NONE",
          intensity: Number(input.treatment.intensity ?? 0),
          framingBias: unique(input.treatment.framingBias ?? []),
          realizationPreferences: unique(
            input.treatment.realizationPreferences ?? [],
          ),
          forbiddenRealityMoves: unique(
            input.treatment.forbiddenRealityMoves ?? [],
          ),
        }
      : undefined,
    forbiddenMoves: unique([
      ...(beat.forbiddenMoves ?? []),
      ...(input.treatment?.forbiddenRealityMoves ?? []),
      ...DEFAULT_FORBIDDEN_MOVES,
    ]),
    evidenceEventIds: unique([
      ...eventIds,
      ...(semantic?.evidenceEventIds ?? []),
      ...relations.flatMap((relation) => [relation.from, relation.to]),
      ...(beat.viewerState?.evidenceEventIds ?? []),
    ]),
  };
}
