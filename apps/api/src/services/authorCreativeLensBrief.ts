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

const relationshipKinds = (envelope: RealityEnvelope): string[] =>
  unique(envelope.relations.map((relation) => relation.kind));

const directionFor = (
  label: string,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): string => {
  const relations = relationshipKinds(envelope);
  const anchor = character.contradictions[0]
    ?? character.emotionalPosture
    ?? character.statusPosture
    ?? "the supplied reality";
  const labels = new Set(label.split("+").map((value) => clean(value).toLowerCase()));

  if (labels.has("horror") && labels.has("romance")) {
    return relations.includes("contrasts") || relations.includes("recontextualizes")
      ? `Make existing danger and existing attachment illuminate each other: the intimacy becomes striking because the surrounding reality is dangerous. The viewer should feel the connection, not be told to call it love. Preserve every supplied event exactly.`
      : `Use intimacy and unease together: make an already-real detail feel privately significant and slightly wrong without inventing danger, intimacy, or an event.`;
  }

  if (labels.has("horror")) {
    return relations.includes("recontextualizes") || relations.includes("contrasts")
      ? `Make the familiar feel wrong by changing the viewer's reading of ${anchor}; preserve the underlying events exactly.`
      : `Make ordinary reality feel quietly wrong around ${anchor}; suggest uncertainty without inventing an event.`;
  }

  if (labels.has("romance")) {
    return `Make an existing detail carry private significance; let repetition, restraint, or consequence imply connection without inventing intimacy.`;
  }

  if (labels.has("heist")) {
    return `Frame an existing acquisition, disappearance, securing, or payoff as an operation; never invent accomplices, security, escape, or theft.`;
  }

  if (labels.has("game")) {
    return `Frame real progression as rounds, thresholds, upgrades, or win conditions only as figurative treatment; never invent a score, level, opponent, or game event.`;
  }

  if (labels.has("fierce")) {
    return `Amplify status, attitude, and self-possession already supported by the subject; do not add threats, aggression, or physical action.`;
  }

  return `${label} should amplify the creative framing already available in the supplied reality, changing perception rather than reality.`;
};

export function buildCreativeLensBrief(
  lens: AuthorLensProfile,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): CreativeLensBrief {
  return composeCreativeLensBrief([lens], character, envelope);
}

/**
 * Compose multiple treatments into one brief. Composition is deliberately
 * union-based: a secondary lens adds framing possibilities but never adds
 * permission to create new concrete reality.
 */
export function composeCreativeLensBrief(
  lenses: readonly AuthorLensProfile[],
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): CreativeLensBrief {
  const usable = lenses.filter((lens) => clean(lens.label) && clean(lens.label).toLowerCase() !== "none");
  const selected = usable.length ? usable : lenses.length ? [lenses[0]] : [];
  const labels = unique(selected.map((lens) => lens.label));
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

  const framingBias = unique(selected.flatMap((lens) => lens.framingBias)).slice(0, 18);
  const realizationPreferences = unique(selected.flatMap((lens) => lens.realizationPreferences)).slice(0, 18);
  const forbiddenRealityMoves = unique(selected.flatMap((lens) => lens.forbiddenRealityMoves)).slice(0, 24);
  const treatmentMoves = unique([
    ...realizationPreferences,
    ...framingBias,
  ]).slice(0, 20);
  const intensity = metric(
    selected.reduce((sum, lens) => sum + lens.intensity, 0) / Math.max(1, selected.length),
  );
  const support = metric(
    relationships.length * 0.07
      + signals.length * 0.035
      + Math.min(0.2, character.contradictions.length * 0.05)
      + Math.min(0.2, character.coreTraits.length * 0.03),
  );
  const label = labels.length ? labels.join(" + ") : "NONE";

  return {
    label,
    intensity,
    framingBias,
    realizationPreferences,
    forbiddenRealityMoves,
    supportedRelationshipKinds: relationships,
    supportedSignals: signals,
    treatmentMoves,
    realityInvariants,
    direction: `${directionFor(label, character, envelope)} Support=${support}.`,
  };
}
