import type { CognitiveExperiencePlan, LatentMovie, LatentMovieEvent, StoryBeat } from "@qre/contracts";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const genericSubject = /^(?:the subject|situation|experience|interaction|can|new|old|it|this|that)$/i;

function slotValues(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function usable(value: string): boolean {
  if (!value) return false;
  return !/\b(?:cognitive|compiler|premise|directive|semantic|realization|experience plan|story structure|interaction model|new memories can change what later visitors discover)\b/i.test(value);
}

function bestSubject(plan?: CognitiveExperiencePlan): string {
  const central = clean(plan?.centralSubject);
  const premise = slotValues(plan, "subject")[0] ?? "";
  if (central && !genericSubject.test(central)) return central;
  if (premise && !genericSubject.test(premise)) return premise;
  const participants = slotValues(plan, "participants");
  return participants.length ? participants.join(" and ") : central || premise || "the subject";
}

function eventFacts(plan?: CognitiveExperiencePlan): string[] {
  const premiseFacts = slotValues(plan, "event").filter(usable);
  const outcomeFacts = slotValues(plan, "outcome").filter(usable);
  const directives = plan?.realization?.directives ?? [];
  const directiveFacts = directives
    .map((directive) => clean(directive.action || directive.stateAfter || directive.intent))
    .filter(usable);

  // Observed premise evidence is authoritative. Directives are a semantic
  // fallback, not a second source that can overwrite the user's reality.
  return unique([
    ...premiseFacts,
    ...outcomeFacts,
    ...(premiseFacts.length ? [] : directiveFacts),
  ]);
}

function lensValues(plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
  ]);
}

export function buildLatentMovie(plan?: CognitiveExperiencePlan, beats: StoryBeat[] = []): LatentMovie {
  const subject = bestSubject(plan);
  const participants = slotValues(plan, "participants").filter((value) => value.toLowerCase() !== subject.toLowerCase());
  const places = slotValues(plan, "place");
  const facts = eventFacts(plan);
  const directives = plan?.realization?.directives ?? [];

  const events: LatentMovieEvent[] = facts.map((fact, index) => {
    const directive = directives[index];
    return {
      id: `latent-${index + 1}`,
      order: index,
      fact,
      actor: clean(directive?.subject) || subject,
      stateBefore: clean(directive?.stateBefore) || undefined,
      stateAfter: clean(directive?.stateAfter) || undefined,
      confidence: directive?.confidence ?? 0.9,
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
    ...slotValues(plan, "place"),
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
