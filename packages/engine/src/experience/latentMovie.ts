import type { CognitiveExperiencePlan, LatentMovie, LatentMovieEvent, StoryBeat } from "@qre/contracts";
import { buildRealityModel } from "./realityModel.js";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const genericSubject = /^(?:the subject|situation|experience|interaction|can|new|old|it|this|that)$/i;

function slotValues(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function usable(value: string): boolean {
  if (!value) return false;
  return !/\b(?:cognitive|compiler|premise|directive|semantic|realization|experience plan|story structure|interaction model|new memories can change what later visitors discover)\b/i.test(value);
}

function bestSubject(plan?: CognitiveExperiencePlan): string {
  const reality = buildRealityModel(plan, plan?.premise);
  const entity = reality.entities.find((item) => item.id === reality.subjectId);
  const central = clean(entity?.name || plan?.centralSubject);
  const premise = slotValues(plan, "subject")[0] ?? "";
  if (central && !genericSubject.test(central)) return central;
  if (premise && !genericSubject.test(premise)) return premise;
  const participants = slotValues(plan, "participants");
  return participants.length ? participants.join(" and ") : central || premise || "the subject";
}

function eventFacts(plan?: CognitiveExperiencePlan): string[] {
  const reality = buildRealityModel(plan, plan?.premise);
  const observed = reality.observations
    .sort((a, b) => a.order - b.order)
    .map((observation) => observation.text)
    .filter(usable);
  const outcomeFacts = slotValues(plan, "outcome").filter(usable);
  const directives = plan?.realization?.directives ?? [];
  const directiveFacts = directives
    .map((directive) => clean(directive.action || directive.stateAfter || directive.intent))
    .filter(usable);

  // Reality observations are authoritative. Derived directives only fill a
  // genuine information gap; they never overwrite prompt evidence.
  return unique([
    ...observed,
    ...outcomeFacts,
    ...(observed.length ? [] : directiveFacts),
  ]);
}

function lensValues(plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
  ]);
}

export function buildLatentMovie(plan?: CognitiveExperiencePlan, beats: StoryBeat[] = []): LatentMovie {
  const reality = buildRealityModel(plan, plan?.premise);
  const subject = bestSubject(plan);
  const participants = unique([
    ...reality.entities.filter((entity) => entity.id !== reality.subjectId && entity.kind === "person").map((entity) => entity.name),
    ...slotValues(plan, "participants"),
  ]);
  const places = unique([...reality.places, ...slotValues(plan, "place")]);
  const facts = eventFacts(plan);
  const directives = plan?.realization?.directives ?? [];

  const events: LatentMovieEvent[] = facts.map((fact, index) => {
    const observation = reality.observations[index];
    const directive = directives[index];
    return {
      id: `latent-${index + 1}`,
      order: index,
      fact,
      actor: clean(directive?.subject) || subject,
      object: reality.entities.find((entity) => entity.kind === "object")?.name,
      place: observation?.placeId
        ? reality.entities.find((entity) => entity.id === observation.placeId)?.name
        : places[0],
      stateBefore: clean(observation?.before || directive?.stateBefore) || undefined,
      stateAfter: clean(observation?.after || directive?.stateAfter) || undefined,
      confidence: observation?.confidence ?? directive?.confidence ?? 0.9,
    };
  });

  const transformation = slotValues(plan, "transformation").filter(usable);
  const outcome = slotValues(plan, "outcome").filter(usable);
  const continuation = unique([
    ...slotValues(plan, "affordance"),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.dynamicBehavior ?? []),
  ]).find(usable);

  const details = unique([
    ...slotValues(plan, "artifact"),
    ...slotValues(plan, "medium"),
    ...slotValues(plan, "temporal"),
    ...places,
    ...reality.entities.map((entity) => entity.name),
    ...beats.flatMap((beat) => beat.entities),
  ]);

  return {
    subject,
    participants,
    places,
    before: transformation[0],
    after: transformation.at(-1) ?? outcome.at(-1),
    events,
    details,
    emotionalDirection: lensValues(plan),
    styleLenses: unique([...(plan?.creativePossibilities ?? []), ...(plan?.emotionalIntent ?? [])]),
    memoryPotential: unique([...(plan?.memoryModel ?? []), ...(plan?.futureEvolution ?? [])]),
    continuation,
  };
}
