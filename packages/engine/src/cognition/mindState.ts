import type { CognitiveMindState, CognitiveCreativeLearning } from "@qre/contracts";
import type { WorldModel } from "./worldModel.js";
import type { CreativeCandidate } from "./creativePolicy.js";
import type { UniversalMindContext } from "./universalMindContext.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const keyOf = (value: string) => clean(value).toLowerCase();
const fingerprint = (value: string) => {
  const words = clean(value).toLowerCase().split(/\W+/).filter((word) => word.length >= 4);
  return words.slice(0, 9).join(" ");
};

export function hydrateMindState(context: UniversalMindContext): CognitiveMindState {
  const prior = context.state?.creativeLearning;
  const analytics = context.analytics;
  const creativeLearning: CognitiveCreativeLearning = {
    accepted: unique([...(prior?.accepted ?? []), ...(context.feedback?.accepted ?? []), ...(analytics?.accepted ?? [])]),
    rejected: unique([...(prior?.rejected ?? []), ...(context.feedback?.rejected ?? []), ...(analytics?.rejected ?? [])]),
    preferences: unique([...(prior?.preferences ?? []), ...(context.creativePreferences ?? []), ...(analytics?.preferences ?? [])]),
    successfulLenses: [...(prior?.successfulLenses ?? [])],
    avoidedPatterns: [...(prior?.avoidedPatterns ?? [])],
    usedPhrases: [...(prior?.usedPhrases ?? [])],
    noveltyPressure: Math.max(0.15, Math.min(0.98, prior?.noveltyPressure ?? (0.5 + (analytics?.friction ?? 0) * 0.2))),
  };
  return {
    compileCount: context.state?.compileCount ?? 0,
    entityStates: [...(context.state?.entityStates ?? [])],
    relationships: [...(context.state?.relationships ?? [])],
    eventHistory: [...(context.state?.eventHistory ?? [])],
    creativeLearning,
    lastLens: context.state?.lastLens,
    lastMomentCount: context.state?.lastMomentCount,
  };
}

export function learningInput(state: CognitiveMindState, context?: UniversalMindContext) {
  const analytics = context?.analytics;
  return {
    preferences: unique([...state.creativeLearning.preferences, ...(analytics?.preferences ?? [])]),
    accepted: unique([...state.creativeLearning.accepted, ...(analytics?.accepted ?? [])]),
    rejected: unique([...state.creativeLearning.rejected, ...(analytics?.rejected ?? [])]),
    usedPhrases: state.creativeLearning.usedPhrases,
    noveltyPressure: Math.max(state.creativeLearning.noveltyPressure, analytics?.friction ?? 0),
  };
}

export function evolveMindState(state: CognitiveMindState, world: WorldModel, selected: CreativeCandidate[], context: UniversalMindContext): CognitiveMindState {
  const accepted = context.feedback?.accepted ?? [];
  const rejected = context.feedback?.rejected ?? [];
  const analytics = context.analytics;
  const lensAccepted = accepted.some((v) => /comedy|funny|humor|playful|absurd/i.test(v)) ? "comedy"
    : accepted.some((v) => /horror|scary|creepy|dark/i.test(v)) ? "horror"
      : accepted.some((v) => /romance|romantic|love|tender/i.test(v)) ? "romance"
        : accepted.some((v) => /mystery|mysterious|surreal/i.test(v)) ? "mysterious" : undefined;

  const entityMap = new Map(state.entityStates.map((entity) => [keyOf(entity.entity), { ...entity, places: [...entity.places], relationships: [...entity.relationships], states: [...entity.states] }]));
  const relationshipMap = new Map(state.relationships.map((relationship) => [`${keyOf(relationship.from)}|${relationship.relation}|${keyOf(relationship.to)}`, { ...relationship }]));

  for (const event of world.events) {
    for (const participant of event.participants) {
      const key = keyOf(participant);
      const prior = entityMap.get(key) ?? { entity: participant, appearances: 0, places: [], relationships: [], states: [] };
      entityMap.set(key, {
        entity: prior.entity,
        appearances: prior.appearances + 1,
        lastEventId: event.id,
        places: unique([...prior.places, ...(event.place ? [event.place] : [])]),
        relationships: unique([...prior.relationships, ...event.participants.filter((other) => keyOf(other) !== key)]),
        states: unique([...prior.states, ...(event.state ? [event.state] : [])]),
      });
    }
    for (const participant of event.participants) if (event.place) {
      const key = `${keyOf(participant)}|experienced_at|${keyOf(event.place)}`;
      const prior = relationshipMap.get(key);
      relationshipMap.set(key, { from: participant, to: event.place, relation: "experienced_at", strength: Math.min(1, (prior?.strength ?? 0.2) + 0.15), eventCount: (prior?.eventCount ?? 0) + 1 });
    }
    for (let i = 0; i < event.participants.length; i += 1) for (let j = i + 1; j < event.participants.length; j += 1) {
      const from = event.participants[i]!;
      const to = event.participants[j]!;
      const key = `${keyOf(from)}|shared_event|${keyOf(to)}`;
      const prior = relationshipMap.get(key);
      relationshipMap.set(key, { from, to, relation: "shared_event", strength: Math.min(1, (prior?.strength ?? 0.25) + 0.2), eventCount: (prior?.eventCount ?? 0) + 1 });
    }
  }

  const selectedFingerprints = selected.map((candidate) => fingerprint(candidate.text)).filter(Boolean);
  const selectedMoves = selected.flatMap((candidate) => candidate.creativeDetails);
  const behaviorPressure = analytics ? (analytics.friction * 0.12) - (analytics.engagement * 0.05) : 0;

  return {
    compileCount: state.compileCount + 1,
    entityStates: [...entityMap.values()],
    relationships: [...relationshipMap.values()],
    eventHistory: unique([...state.eventHistory, ...world.events.map((event) => event.raw)]).slice(-100),
    creativeLearning: {
      accepted: unique([...state.creativeLearning.accepted, ...accepted, ...(analytics?.accepted ?? [])]).slice(-100),
      rejected: unique([...state.creativeLearning.rejected, ...rejected, ...(analytics?.rejected ?? [])]).slice(-100),
      preferences: unique([...state.creativeLearning.preferences, ...(context.creativePreferences ?? []), ...(analytics?.preferences ?? [])]).slice(-100),
      successfulLenses: unique([...state.creativeLearning.successfulLenses, ...(lensAccepted ? [lensAccepted] : [])]),
      avoidedPatterns: unique([...state.creativeLearning.avoidedPatterns, ...rejected, ...(analytics?.rejected ?? []), ...selectedMoves.filter((move) => /template|generic|cliche/i.test(move))]).slice(-100),
      usedPhrases: unique([...state.creativeLearning.usedPhrases, ...selectedFingerprints, ...selectedMoves]).slice(-150),
      noveltyPressure: Math.max(0.2, Math.min(0.98, state.creativeLearning.noveltyPressure + (rejected.length ? 0.08 : 0) - (accepted.length ? 0.03 : 0) + behaviorPressure)),
    },
    lastLens: world.lens,
    lastMomentCount: selected.length,
  };
}
