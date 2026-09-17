import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  MouthCandidateBeat,
  MouthInferenceBudget,
  MouthRealizationAuthority,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { assertAuthorMetamorphicRelationSet } from "./authorMetamorphicRelationSet.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function inferenceBudgetFor(beat: MouthCandidateBeat): MouthInferenceBudget {
  const role = clean(beat.role).toLowerCase();
  const semantic = beat.semanticRealization;
  const hasMeaning = Boolean(
    semantic?.realizationMove ||
      semantic?.creativeOpportunity ||
      semantic?.viewerShift ||
      semantic?.feltEffect,
  );
  if (!hasMeaning) return "direct";
  if (/establish|arrival|opening/.test(role)) return "compressed";
  if (/payoff|release/.test(role)) return "interpretive";
  return "strongly-interpretive";
}

function beatScopedRelations(
  set: AuthorMetamorphicRelationSet,
  beat: MouthCandidateBeat,
): AuthorMetamorphicRelation[] {
  const beatEvents = new Set(beat.eventIds ?? []);
  return set.relations.filter(
    (relation) =>
      relation.evidenceEventIds.length > 0 &&
      relation.evidenceEventIds.every((id) => beatEvents.has(id)),
  );
}

export function buildMouthRealizationAuthority(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  metamorphicRelationSet: AuthorMetamorphicRelationSet;
}): MouthRealizationAuthority {
  const { beat, envelope, metamorphicRelationSet } = input;
  assertAuthorMetamorphicRelationSet(metamorphicRelationSet);

  const eventIds = unique(beat.eventIds ?? []);
  const beatScope = new Set(eventIds);
  const sealedScope = new Set(metamorphicRelationSet.sourceEventIds);
  if (eventIds.some((id) => !sealedScope.has(id))) {
    throw new Error("AUTHOR METAMORPHIC PIPELINE SEALED: Mouth beat escaped sealed relation-set scope");
  }

  const localEvents = envelope.events.filter((event) => beatScope.has(event.id));
  const localStructures = envelope.eventStructure.filter((row) => beatScope.has(row.eventId));
  const localRelations = envelope.relations.filter(
    (relation) => beatScope.has(relation.from) && beatScope.has(relation.to),
  );
  const semanticRelations = beatScopedRelations(metamorphicRelationSet, beat);
  const semantic = beat.semanticRealization;

  const entities = unique([
    ...localEvents.flatMap((event) => event.entities ?? []),
    ...localStructures.flatMap((row) => [...row.subjects, ...row.objects]),
  ]);
  const actions = unique(localStructures.flatMap((row) => row.actions));
  const objects = unique(localStructures.flatMap((row) => row.objects));
  const states = unique(localStructures.flatMap((row) => row.states));

  const earnedInterpretations = unique([
    semantic?.after ?? "",
    semantic?.viewerShift ?? "",
    semantic?.feltEffect ?? "",
    semantic?.creativeOpportunity ?? "",
    semantic?.realizationMove ?? "",
    ...semanticRelations.slice(0, 4).flatMap((relation) => [
      relation.after,
      relation.viewerShift,
      relation.feltEffect,
      relation.creativeOpportunity ?? "",
    ]),
  ]);

  const permittedRealizationModes = unique([
    beat.creativeMove ?? "",
    beat.realizationMode ?? "",
    ...(beat.relationKinds ?? []),
    semantic?.realizationMove ?? "",
    semantic?.creativeOpportunity ?? "",
    ...semanticRelations.slice(0, 6).flatMap((relation) => [
      relation.realizationMove,
      relation.creativeOpportunity ?? "",
    ]),
  ]);

  return {
    reality: { eventIds, entities, actions, objects, states },
    meaning: {
      mechanism: clean(semantic?.mechanism),
      before: clean(semantic?.before),
      after: clean(semantic?.after),
      relationKind: clean(semantic?.relation?.kind),
      realizationMove: clean(semantic?.realizationMove),
      creativeOpportunity: clean(semantic?.creativeOpportunity),
      feltEffect: clean(semantic?.feltEffect),
      viewerShift: clean(semantic?.viewerShift),
      realizationDirection: clean(semantic?.viewerShift),
      languageAim: clean(semantic?.languageAim),
    },
    metamorphicRelationSet,
    earnedInterpretations,
    permittedRealizationModes,
    inferenceBudget: inferenceBudgetFor(beat),
    creativeMoves: permittedRealizationModes,
    forbiddenMoves: unique(beat.forbiddenMoves ?? []),
    evidenceEventIds: unique([
      ...eventIds,
      ...semanticRelations.flatMap((relation) => relation.evidenceEventIds),
      ...(semantic?.evidenceEventIds ?? []),
      ...localRelations.flatMap((relation) => [relation.from, relation.to]),
      ...(beat.viewerState?.evidenceEventIds ?? []),
    ]),
  };
}
