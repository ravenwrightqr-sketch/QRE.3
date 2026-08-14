import type { CognitiveExperiencePlan, LatentMovie, LatentMovieEvent, StoryBeat } from "@qre/contracts";
import { buildRealityModel } from "./realityModel.js";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const genericSubject = /^(?:the subject|situation|experience|interaction|can|new|old|it|this|that)$/i;
const INTERNAL = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|experience plan|story structure|interaction model|new memories can change what later visitors discover|dynamic behavior|future evolution)\b/i;

type PremiseValue = { value: string; observed: boolean; confidence: number };

function slotValues(plan: CognitiveExperiencePlan | undefined, role: string): PremiseValue[] {
  return (plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) =>
    slot.values.map((value) => ({
      value: clean(value),
      observed: slot.evidence.some((evidence) => evidence.source === "prompt" || evidence.source === "memory" || evidence.source === "event" || evidence.source === "history" || evidence.source === "location"),
      confidence: slot.confidence,
    })),
  ) ?? []).filter((item) => item.value);
}

function usable(value: string): boolean {
  return Boolean(value) && !INTERNAL.test(value);
}

function values(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return unique(slotValues(plan, role).map((item) => item.value)).filter(usable);
}

function bestSubject(plan?: CognitiveExperiencePlan): string {
  const reality = buildRealityModel(plan, plan?.premise);
  const entity = reality.entities.find((item) => item.id === reality.subjectId);
  const central = clean(entity?.name || plan?.centralSubject);
  const premise = values(plan, "subject")[0] ?? "";
  if (central && !genericSubject.test(central)) return central;
  if (premise && !genericSubject.test(premise)) return premise;
  const participants = values(plan, "participants");
  return participants.length ? participants.join(" and ") : central || premise || "the subject";
}

function eventFacts(plan?: CognitiveExperiencePlan): { text: string; confidence: number; observed: boolean; observationIndex?: number }[] {
  const reality = buildRealityModel(plan, plan?.premise);
  const observed = reality.observations
    .filter((observation) => observation.provenance !== "derived" && observation.provenance !== "creative")
    .sort((a, b) => a.order - b.order)
    .map((observation, index) => ({ text: observation.text, confidence: observation.confidence, observed: true, observationIndex: index }))
    .filter((item) => usable(item.text));

  if (observed.length) return observed;

  const fallback = [
    ...slotValues(plan, "event"),
    ...slotValues(plan, "artifact"),
    ...slotValues(plan, "outcome"),
  ].filter((item) => usable(item.value));

  return fallback.map((item, index) => ({ text: item.value, confidence: item.confidence, observed: item.observed, observationIndex: index }));
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
  const participants = unique(
    reality.entities
      .filter((entity) => entity.id !== reality.subjectId && (entity.provenance === "prompt" || entity.provenance === "memory" || entity.provenance === "event" || entity.provenance === "geo"))
      .map((entity) => entity.name),
  );
  const places = unique([
    ...reality.places,
    ...values(plan, "place"),
  ]);
  const facts = eventFacts(plan);

  const events: LatentMovieEvent[] = facts.map((item, index) => {
    const observation = item.observationIndex !== undefined ? reality.observations[item.observationIndex] : undefined;
    const place = observation?.placeId
      ? reality.entities.find((entity) => entity.id === observation.placeId)?.name
      : places[0];
    return {
      id: `latent-${index + 1}`,
      order: index,
      fact: item.text,
      actor: observation?.subjectIds
        ?.map((id) => reality.entities.find((entity) => entity.id === id)?.name)
        .find(Boolean) ?? subject,
      object: reality.entities
        .filter((entity) => entity.kind === "object" && entity.provenance !== "derived")
        .map((entity) => entity.name)[0],
      place,
      stateBefore: clean(observation?.before) || undefined,
      stateAfter: clean(observation?.after) || undefined,
      confidence: item.confidence,
    };
  });

  const transformation = values(plan, "transformation");
  const outcome = values(plan, "outcome");
  const continuation = unique([
    ...values(plan, "affordance"),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.dynamicBehavior ?? []),
  ]).find(usable);

  const details = unique([
    ...values(plan, "artifact"),
    ...values(plan, "medium"),
    ...values(plan, "temporal"),
    ...places,
    ...reality.entities
      .filter((entity) => entity.provenance !== "derived")
      .map((entity) => entity.name),
    ...beats.flatMap((beat) => beat.entities ?? []),
  ]).filter(usable);

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
