import type { AuthorCharacterProfile, AuthorLensProfile } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

/**
 * The lens is treatment, never reality.
 *
 * This brief is the explicit handoff between cognitive lens selection and
 * language realization. It tells downstream realization HOW the supplied
 * reality may land, while carrying the same prohibition against fabricating
 * concrete events, entities, actions, places, objects, chronology, or sensory
 * facts.
 */
export type CreativeLensBrief = {
  label: string;
  intensity: number;
  framingBias: string[];
  realizationPreferences: string[];
  forbiddenRealityMoves: string[];
  supportedRelationshipKinds: string[];
  supportedSignals: string[];
  treatmentMoves: string[];
  realityInvariants: string[];
  direction: string;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] => [
  ...new Set(values.map(clean).filter(Boolean)),
];

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const relationshipKinds = (
  envelope: RealityEnvelope,
): string[] => unique(envelope.relations.map((relation) => relation.kind));

const directionFor = (
  lens: AuthorLensProfile,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): string => {
  const relations = relationshipKinds(envelope);
  const anchor = character.contradictions[0]
    ?? character.emotionalPosture
    ?? character.statusPosture
    ?? "the supplied reality";

  if (lens.label === "horror") {
    return relations.includes("recontextualizes") || relations.includes("contrasts")
      ? `Make the familiar feel wrong by changing the viewer's reading of ${anchor}; preserve the underlying events exactly.`
      : `Make ordinary reality feel quietly wrong around ${anchor}; suggest uncertainty without inventing an event.`;
  }

  if (lens.label === "romance") {
    return `Make an existing detail carry private significance; let repetition, restraint, or consequence imply connection without inventing intimacy.`;
  }

  if (lens.label === "heist") {
    return `Frame an existing acquisition, disappearance, securing, or payoff as an operation; never invent accomplices, security, escape, or theft.`;
  }

  if (lens.label === "game") {
    return `Frame real progression as rounds, thresholds, upgrades, or win conditions only as figurative treatment; never invent a score, level, opponent, or game event.`;
  }

  if (lens.label === "fierce") {
    return `Amplify status, attitude, and self-possession already supported by the subject; do not add threats, aggression, or physical action.`;
  }

  return `${lens.label} should amplify ${lens.framingBias.slice(0, 3).join(", ")} already available in the supplied reality, changing perception rather than reality.`;
};

export function buildCreativeLensBrief(
  lens: AuthorLensProfile,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): CreativeLensBrief {
  const relationships = relationshipKinds(envelope);
  const signals = unique([
    ...(envelope.recurringSignals ?? []),
    ...(envelope.unresolvedTensions ?? []),
    ...(envelope.sensorySignals ?? []),
  ]).slice(0, 24);

  const realityInvariants = [
    "supplied events remain the only concrete events",
    "supplied entities remain the only concrete entities",
    "supplied actions remain the only concrete actions",
    "supplied objects and places remain unchanged",
    "supplied chronology remains unchanged",
    "sensory detail requires supplied or explicitly authorized provenance",
    "figurative framing may alter interpretation without creating a new occurrence",
  ];

  const treatmentMoves = unique([
    ...lens.realizationPreferences,
    ...lens.framingBias,
  ]).slice(0, 14);

  const support = metric(
    relationships.length * 0.07
      + signals.length * 0.035
      + Math.min(0.2, character.contradictions.length * 0.05)
      + Math.min(0.2, character.coreTraits.length * 0.03),
  );

  return {
    label: clean(lens.label) || "NONE",
    intensity: metric(lens.intensity),
    framingBias: unique(lens.framingBias),
    realizationPreferences: unique(lens.realizationPreferences),
    forbiddenRealityMoves: unique(lens.forbiddenRealityMoves),
    supportedRelationshipKinds: relationships,
    supportedSignals: signals,
    treatmentMoves,
    realityInvariants,
    direction: `${directionFor(lens, character, envelope)} Support=${support}.`,
  };
}
