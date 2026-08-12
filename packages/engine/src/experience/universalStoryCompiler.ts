    if (cognitive) return cognitive;
  }
  return list[0];
}

/**
 * The universal compiler creates a factual beat shell.
 * It does not write presentation prose here.
 *
 * Presentation belongs exclusively to premiseRealizer.ts:
 * cognition → trajectory → beat shell → premise realization → runtime.
 */
function beatSeed(kind: StoryBeatKind, observation: ExperienceObservation, plan?: CognitiveExperiencePlan): string {
  const subjectValue = observation.subject;
  const concrete = unique([
    ...(plan?.premise?.slots
      .filter((slot) => ["event", "artifact", "medium", "place", "temporal", "outcome", "transformation", "affordance"].includes(slot.role))
      .flatMap((slot) => slot.values)
      .filter((value): value is string => typeof value === "string") ?? []),
    ...observation.entities.events,
    ...observation.entities.products,
    ...observation.entities.places,
    ...observation.entities.media,
    ...observation.entities.keywords.slice(0, 6),
  ]);
  const anchor = concrete.find((value) => lower(value) !== lower(subjectValue)) ?? "";
  return anchor ? `${kind}: ${subjectValue}; ${anchor}` : `${kind}: ${subjectValue}`;
}

function beatPurpose(kind: StoryBeatKind, plan?: CognitiveExperiencePlan): string {
  const directive = plan?.realization?.directives.find((item) => item.kind === kind);