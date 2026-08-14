import type { WorldModel } from "./worldModel.js";
import type { CreativeCandidate } from "./creativePolicy.js";
import type { CognitiveMindRuntimeState, UniversalMindContext } from "./universalMindContext.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const keyOf = (value: string) => clean(value).toLowerCase();

export function hydrateMindState(context: UniversalMindContext): CognitiveMindRuntimeState {
  const prior = context.state?.creativeLearning;
  return {
    compileCount: context.state?.compileCount ?? 0,
    eventHistory: [...(context.state?.eventHistory ?? [])],
    entityStates: { ...(context.state?.entityStates ?? {}) },
    relationships: { ...(context.state?.relationships ?? {}) },
    creativeLearning: {
      accepted: unique([...(prior?.accepted ?? []), ...(context.feedback?.accepted ?? [])]),
      rejected: unique([...(prior?.rejected ?? []), ...(context.feedback?.rejected ?? [])]),
      preferences: unique([...(prior?.preferences ?? []), ...(context.creativePreferences ?? [])]),
      successfulLenses: unique(prior?.successfulLenses ?? []),
      avoidedPatterns: unique(prior?.avoidedPatterns ?? []),
      usedPhrases: unique(prior?.usedPhrases ?? []),
      noveltyPressure: Math.max(0.15, Math.min(0.95, prior?.noveltyPressure ?? 0.55)),
    },
    lastLens: context.state?.lastLens,
    lastMomentCount: context.state?.lastMomentCount,
  };
}

export function evolveMindState(state: CognitiveMindRuntimeState, world: WorldModel, selected: CreativeCandidate[], context: UniversalMindContext): CognitiveMindRuntimeState {
  const accepted = context.feedback?.accepted ?? [];
  const rejected = context.feedback?.rejected ?? [];
  const priorLearning = state.creativeLearning!;
  const successfulLens = accepted.some((v) => /comedy|funny|humor|playful|absurd/i.test(v)) ? "comedy"
    : accepted.some((v) => /horror|scary|creepy|dark/i.test(v)) ? "horror"
      : accepted.some((v) => /romance|romantic|love|tender/i.test(v)) ? "romance"
        : accepted.some((v) => /mystery|mysterious|surreal/i.test(v)) ? "mysterious" : undefined;

  const next: CognitiveMindRuntimeState = {
    compileCount: (state.compileCount ?? 0) + 1,
    eventHistory: unique([...(state.eventHistory ?? []), ...world.events.map((e) => e.raw)]).slice(-100),
    entityStates: { ...(state.entityStates ?? {}) },
    relationships: { ...(state.relationships ?? {}) },
    creativeLearning: {
      accepted: unique([...priorLearning.accepted, ...accepted]).slice(-100),
      rejected: unique([...priorLearning.rejected, ...rejected]).slice(-100),
      preferences: unique([...priorLearning.preferences, ...(context.creativePreferences ?? [])]).slice(-100),
      successfulLenses: unique([...priorLearning.successfulLenses, ...(successfulLens ? [successfulLens] : [])]),
      avoidedPatterns: unique([...priorLearning.avoidedPatterns, ...rejected.filter((v) => v.length < 120)]).slice(-100),
      usedPhrases: unique([...priorLearning.usedPhrases, ...selected.flatMap((c) => c.creativeDetails)]).slice(-100),
      noveltyPressure: Math.max(0.2, Math.min(0.95, priorLearning.noveltyPressure + (rejected.length ? 0.08 : 0) - (accepted.length ? 0.03 : 0))),
    },
    lastLens: world.lens,
    lastMomentCount: selected.length,
  };

  for (const event of world.events) {
    for (const participant of event.participants) {
      const key = keyOf(participant);
      const prior = next.entityStates![key] ?? {};
      next.entityStates![key] = {
        appearances: (prior.appearances ?? 0) + 1,
        places: unique([...(prior.places ?? []), ...(event.place ? [event.place] : [])]),
        relationships: unique([...(prior.relationships ?? []), ...event.participants.filter((other) => keyOf(other) !== key)]),
        states: unique([...(prior.states ?? []), ...(event.state ? [event.state] : [])]),
      };
    }
    for (const participant of event.participants) if (event.place) {
      const key = `${keyOf(participant)}|experienced_at|${keyOf(event.place)}`;
      const prior = next.relationships![key];
      next.relationships![key] = { relation: "experienced_at", strength: Math.min(1, (prior?.strength ?? 0.2) + 0.15), eventCount: (prior?.eventCount ?? 0) + 1 };
    }
    for (let i = 0; i < event.participants.length; i += 1) for (let j = i + 1; j < event.participants.length; j += 1) {
      const left = event.participants[i]!;
      const right = event.participants[j]!;
      const key = `${keyOf(left)}|shared_event|${keyOf(right)}`;
      const prior = next.relationships![key];
      next.relationships![key] = { relation: "shared_event", strength: Math.min(1, (prior?.strength ?? 0.25) + 0.2), eventCount: (prior?.eventCount ?? 0) + 1 };
    }
  }
  return next;
}

export function learningInput(state: CognitiveMindRuntimeState) {
  return {
    preferences: state.creativeLearning?.preferences ?? [],
    accepted: state.creativeLearning?.accepted ?? [],
    rejected: state.creativeLearning?.rejected ?? [],
  };
}
