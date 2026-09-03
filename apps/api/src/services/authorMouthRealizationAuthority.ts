import type {
  MouthCandidateBeat,
  MouthInferenceBudget,
  MouthRealizationAuthority,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const uniqueStrings = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

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

/**
 * Build the single authority package that connects canonical cognition to
 * Mouth. This is intentionally derived from existing beat/envelope contracts;
 * it is not a second cognition system.
 */
export function buildMouthRealizationAuthority(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
}): MouthRealizationAuthority {
  const { beat, envelope } = input;
  const eventIds = uniqueStrings(beat.eventIds ?? []);

  const localEvents = envelope.events.filter((event) =>
    eventIds.includes(event.id),
  );

  const localStructures = envelope.eventStructure.filter((structure) =>
    eventIds.includes(structure.eventId),
  );

  const relations = envelope.relations.filter(
    (relation) =>
      eventIds.includes(relation.from) &&
      eventIds.includes(relation.to),
  );

  const localEntities = uniqueStrings([
    ...localEvents.flatMap((event) => event.entities ?? []),
    ...localStructures.flatMap((structure) => [
      ...structure.subjects,
      ...structure.objects,
    ]),
  ]);

  const localActions = uniqueStrings(
    localStructures.flatMap((structure) => structure.actions),
  );

  const localObjects = uniqueStrings(
    localStructures.flatMap((structure) => structure.objects),
  );

  const localStates = uniqueStrings(
    localStructures.flatMap((structure) => structure.states),
  );

  const semantic = beat.semanticRealization;
  const observer = beat.observerExperience;

  const earnedInterpretations = uniqueStrings([
    semantic?.after ?? "",
    semantic?.viewerShift ?? "",
    semantic?.feltEffect ?? observer?.feltEffect ?? "",
    semantic?.creativeOpportunity ?? "",
    semantic?.realizationMove ?? "",
    observer?.realizationDirection ?? "",
  ]);

  const permittedRealizationModes = uniqueStrings([
    beat.creativeMove ?? "",
    beat.realizationMode ?? "",
    ...(beat.relationKinds ?? []),
    semantic?.realizationMove ?? "",
    semantic?.creativeOpportunity ?? "",
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
      feltEffect: clean(
        semantic?.feltEffect ?? observer?.feltEffect,
      ),
      viewerShift: clean(
        semantic?.viewerShift ?? observer?.viewerShift,
      ),
      realizationDirection: clean(
        observer?.realizationDirection,
      ),
      languageAim: clean(semantic?.languageAim),
    },
    earnedInterpretations,
    permittedRealizationModes,
    inferenceBudget: inferenceBudgetFor(beat),
    creativeMoves: uniqueStrings([
      ...permittedRealizationModes,
    ]),
    forbiddenMoves: uniqueStrings([
      ...(beat.forbiddenMoves ?? []),
    ]),
    evidenceEventIds: uniqueStrings([
      ...eventIds,
      ...(semantic?.evidenceEventIds ?? []),
      ...relations.flatMap((relation) => [
        relation.from,
        relation.to,
      ]),
      ...(beat.viewerState?.evidenceEventIds ?? []),
    ]),
  };
}
