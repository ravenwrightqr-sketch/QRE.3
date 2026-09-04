import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  MouthCandidateBeat,
  MouthInferenceBudget,
  MouthRealizationAuthority,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { assertAuthorMetamorphicRelationSet } from "./authorMetamorphicRelationSet.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

type MetamorphicSemantic = NonNullable<NonNullable<MouthCandidateBeat["semanticRealization"]>> & {
  metamorphicRelationSet?: AuthorMetamorphicRelationSet;
};

function inferenceBudgetFor(beat: MouthCandidateBeat): MouthInferenceBudget {
  const role = clean(beat.role).toLowerCase();
  const hasMeaning = Boolean(
    beat.semanticRealization?.realizationMove ??
    beat.semanticRealization?.creativeOpportunity ??
    beat.semanticRealization?.viewerShift ??
    beat.observerExperience?.realizationDirection,
  );
  if (!hasMeaning) return "direct";
  if (/establish|arrival|opening/.test(role)) return "compressed";
  if (/payoff|release/.test(role)) return "interpretive";
  return "strongly-interpretive";
}

function relationSetFor(beat: MouthCandidateBeat): AuthorMetamorphicRelationSet {
  const semantic = beat.semanticRealization as MetamorphicSemantic | undefined;
  const set = semantic?.metamorphicRelationSet;
  assertAuthorMetamorphicRelationSet(set);

  const beatEvents = new Set(beat.eventIds ?? []);
  const sealedEvents = new Set(set.sourceEventIds);

  // The sealed relation set is candidate/sequence scoped. A Mouth beat is
  // intentionally narrower. The valid containment invariant is therefore:
  //   beat event scope ⊆ sealed relation-set event scope
  // Never require the whole relation set to be repeated on every beat.
  if ([...beatEvents].some((id) => !sealedEvents.has(id))) {
    throw new Error("AUTHOR METAMORPHIC PIPELINE SEALED: Mouth beat escaped sealed relation-set scope");
  }

  return set;
}

function beatScopedRelations(
  relationSet: AuthorMetamorphicRelationSet,
  beat: MouthCandidateBeat,
): AuthorMetamorphicRelation[] {
  const beatEvents = new Set(beat.eventIds ?? []);
  return relationSet.relations.filter((relation) =>
    relation.evidenceEventIds.length > 0 &&
    relation.evidenceEventIds.every((id) => beatEvents.has(id)),
  );
}

/**
 * Single authority package connecting canonical cognition to Mouth.
 * The relation set is mandatory and immutable by policy: Mouth may realize it,
 * but it cannot select a different semantic interpretation.
 */
export function buildMouthRealizationAuthority(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
}): MouthRealizationAuthority {
  const { beat, envelope } = input;
  const metamorphicRelationSet = relationSetFor(beat);
  const beatRelations = beatScopedRelations(metamorphicRelationSet, beat);
  const eventIds = uniqueStrings(beat.eventIds ?? []);
  const localEvents = envelope.events.filter((event) => eventIds.includes(event.id));
  const localStructures = envelope.eventStructure.filter((structure) => eventIds.includes(structure.eventId));
  const relations = envelope.relations.filter((relation) => eventIds.includes(relation.from) && eventIds.includes(relation.to));

  const localEntities = uniqueStrings([
    ...localEvents.flatMap((event) => event.entities ?? []),
    ...localStructures.flatMap((structure) => [...structure.subjects, ...structure.objects]),
  ]);
  const localActions = uniqueStrings(localStructures.flatMap((structure) => structure.actions));
  const localObjects = uniqueStrings(localStructures.flatMap((structure) => structure.objects));
  const localStates = uniqueStrings(localStructures.flatMap((structure) => structure.states));

  const semantic = beat.semanticRealization;
  const observer = beat.observerExperience;
  const earnedInterpretations = uniqueStrings([
    semantic?.after ?? "",
    semantic?.viewerShift ?? "",
    semantic?.feltEffect ?? observer?.feltEffect ?? "",
    semantic?.creativeOpportunity ?? "",
    semantic?.realizationMove ?? "",
    observer?.realizationDirection ?? "",
    ...beatRelations.slice(0, 4).flatMap((relation) => [
      relation.after,
      relation.viewerShift,
      relation.feltEffect,
      relation.creativeOpportunity,
    ]),
  ]);
  const permittedRealizationModes = uniqueStrings([
    beat.creativeMove ?? "",
    beat.realizationMode ?? "",
    ...(beat.relationKinds ?? []),
    semantic?.realizationMove ?? "",
    semantic?.creativeOpportunity ?? "",
    ...beatRelations.slice(0, 6).map((relation) => relation.realizationMove),
  ]);

  return {
    reality: {
      eventIds,
      entities: localEntities,
      actions: localActions,
      objects: localObjects,
      states: localStates,
    },
    meaning: {
      mechanism: clean(semantic?.mechanism),
      before: clean(semantic?.before),
      after: clean(semantic?.after),
      relationKind: clean(semantic?.relation?.kind),
      realizationMove: clean(semantic?.realizationMove),
      creativeOpportunity: clean(semantic?.creativeOpportunity),
      feltEffect: clean(semantic?.feltEffect ?? observer?.feltEffect),
      viewerShift: clean(semantic?.viewerShift ?? observer?.viewerShift),
      realizationDirection: clean(observer?.realizationDirection),
      languageAim: clean(semantic?.languageAim),
    },
    metamorphicRelationSet,
    earnedInterpretations,
    permittedRealizationModes,
    inferenceBudget: inferenceBudgetFor(beat),
    creativeMoves: uniqueStrings(permittedRealizationModes),
    forbiddenMoves: uniqueStrings(beat.forbiddenMoves ?? []),
    evidenceEventIds: uniqueStrings([
      ...eventIds,
      ...beatRelations.flatMap((relation) => relation.evidenceEventIds),
      ...(semantic?.evidenceEventIds ?? []),
      ...relations.flatMap((relation) => [relation.from, relation.to]),
      ...(beat.viewerState?.evidenceEventIds ?? []),
    ]),
  };
}
