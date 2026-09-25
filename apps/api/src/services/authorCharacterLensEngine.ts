import type {
  AuthorCharacterProfile,
  AuthorLensKind,
  AuthorLensProfile,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const LENSES: Record<Exclude<AuthorLensKind, "custom">, AuthorLensProfile> = {
  comedy: {
    kind: "comedy",
    label: "comedy",
    framingBias: ["status contradiction", "understatement", "unexpected specificity", "reversal"],
    realizationPreferences: ["contrast", "status_inversion", "understatement", "double_meaning", "reversal"],
    forbiddenRealityMoves: ["invented punchline event", "literalized metaphor"],
    intensity: 0.72,
  },
  romance: {
    kind: "romance",
    label: "romance",
    framingBias: ["recurrence", "restraint", "private significance", "emotional consequence"],
    realizationPreferences: ["callback", "implication", "understatement", "recontextualization"],
    forbiddenRealityMoves: ["invented confession", "invented physical intimacy"],
    intensity: 0.62,
  },
  horror: {
    kind: "horror",
    label: "horror",
    framingBias: ["ordinary wrongness", "escalating uncertainty", "unresolved signal", "absence"],
    realizationPreferences: ["implication", "recontextualization", "reversal", "understatement", "callback"],
    forbiddenRealityMoves: ["invented violence", "invented supernatural event"],
    intensity: 0.82,
  },
  tenderness: {
    kind: "tenderness",
    label: "tenderness",
    framingBias: ["specific detail", "restraint", "care", "quiet consequence"],
    realizationPreferences: ["understatement", "callback", "implication", "recontextualization"],
    forbiddenRealityMoves: ["generic sentiment", "invented affection"],
    intensity: 0.48,
  },
  nostalgia: {
    kind: "nostalgia",
    label: "nostalgia",
    framingBias: ["recurrence", "memory echo", "changed meaning", "specific sensory detail"],
    realizationPreferences: ["callback", "recontextualization", "understatement", "compression"],
    forbiddenRealityMoves: ["invented past detail", "invented chronology"],
    intensity: 0.56,
  },
  chaos: {
    kind: "chaos",
    label: "chaos",
    framingBias: ["juxtaposition", "speed", "status reversal", "unexpected collision"],
    realizationPreferences: ["contrast", "reversal", "double_meaning", "compression", "implication"],
    forbiddenRealityMoves: ["invented event", "invented object interaction"],
    intensity: 0.9,
  },
  fierce: {
    kind: "fierce",
    label: "fierce",
    framingBias: ["status", "defiance", "attitude", "controlled escalation"],
    realizationPreferences: ["status_inversion", "contrast", "understatement", "reversal"],
    forbiddenRealityMoves: ["invented threat", "invented aggression"],
    intensity: 0.84,
  },
  absurd: {
    kind: "absurd",
    label: "absurd",
    framingBias: ["mismatch", "deadpan juxtaposition", "double meaning", "specificity"],
    realizationPreferences: ["double_meaning", "contrast", "understatement", "personification", "reversal"],
    forbiddenRealityMoves: ["literalized joke premise", "invented props"],
    intensity: 0.86,
  },
  dramatic: {
    kind: "dramatic",
    label: "dramatic",
    framingBias: ["stakes", "consequence", "reversal", "earned payoff"],
    realizationPreferences: ["recontextualization", "reversal", "contrast", "callback", "compression"],
    forbiddenRealityMoves: ["invented stakes", "invented crisis"],
    intensity: 0.74,
  },
  quiet: {
    kind: "quiet",
    label: "quiet",
    framingBias: ["restraint", "specificity", "implication", "absence"],
    realizationPreferences: ["understatement", "implication", "callback", "compression"],
    forbiddenRealityMoves: ["dramatic embellishment", "generic emotion"],
    intensity: 0.32,
  },
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function tokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );
}

function stateSignals(envelope: RealityEnvelope): string[] {
  return unique([
    ...(envelope.recurringSignals ?? []),
    ...(envelope.unresolvedTensions ?? []),
    ...(envelope.sensorySignals ?? []),
    ...(envelope.suppliedPhrases ?? []),
  ]).slice(0, 18);
}

function relationLanguage(envelope: RealityEnvelope): string[] {
  return unique(
    envelope.relations.map((relation) => relation.kind),
  );
}

export function classifyLens(value?: string): AuthorLensProfile {
  const raw = clean(value).toLowerCase();
  const exact = Object.keys(LENSES).find(
    (key) => raw === key || raw.includes(key),
  ) as Exclude<AuthorLensKind, "custom"> | undefined;

  if (exact) return { ...LENSES[exact], framingBias: [...LENSES[exact].framingBias], realizationPreferences: [...LENSES[exact].realizationPreferences], forbiddenRealityMoves: [...LENSES[exact].forbiddenRealityMoves] };

  return {
    kind: "custom",
    label: raw || "custom",
    framingBias: raw ? raw.split(/[,|]/).map(clean).filter(Boolean).slice(0, 6) : ["specificity", "contrast", "implication"],
    realizationPreferences: ["implication", "recontextualization", "compression", "contrast"],
    forbiddenRealityMoves: ["invented concrete reality", "generic filler"],
    intensity: 0.6,
  };
}

export function buildCharacterProfile(
  envelope: RealityEnvelope,
): AuthorCharacterProfile {
  const subject = envelope.subject;
  const labels = envelope.events.map((event) => event.label);
  const states = envelope.suppliedStates ?? [];
  const actions = envelope.suppliedActions ?? [];
  const tensions = envelope.unresolvedTensions ?? [];
  const objectRelationships = unique([
    ...(envelope.sensorySignals ?? []),
    ...labels.filter((label) => /\b(?:object|bow|ring|gift|dress|photo|receipt|meal|place|car|home|room)\b/i.test(label)),
  ]);

  const coreTraits = unique([
    ...states,
    ...labels.filter((label) => !actions.includes(label)),
  ]).slice(0, 8);

  const statusPosture =
    coreTraits.length >= 2
      ? `${coreTraits[0]} versus ${coreTraits[1]}`
      : coreTraits[0] || "neutral";

  const emotionalPosture =
    tensions[0] ||
    (states.length >= 2
      ? `${states[0]} alongside ${states[1]}`
      : states[0] || "unspecified");

  const privateInterpretations = unique([
    ...tensions,
    ...relationLanguage(envelope).map((kind) => `relationship:${kind}`),
    ...stateSignals(envelope).map((signal) => `signal:${signal}`),
  ]).slice(0, 12);

  const confidence = metric(
    Math.min(
      1,
      0.35 +
        Math.min(0.25, coreTraits.length * 0.04) +
        Math.min(0.2, tensions.length * 0.05) +
        Math.min(0.2, actions.length * 0.04),
    ),
  );

  return {
    subject,
    coreTraits,
    statusPosture,
    emotionalPosture,
    contradictions: tensions.slice(0, 8),
    objectRelationships: objectRelationships.slice(0, 8),
    privateInterpretations,
    confidence,
  };
}

export function scoreLensFit(
  lens: AuthorLensProfile,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): number {
  const all = tokens([
    ...lens.framingBias,
    ...character.coreTraits,
    ...character.contradictions,
    ...(envelope.suppliedPhrases ?? []),
  ].join(" "));

  const bias = tokens(lens.framingBias.join(" "));
  if (!bias.size || !all.size) return 0.5;

  let hits = 0;
  for (const token of bias) if (all.has(token)) hits += 1;
  return metric(0.35 + (hits / bias.size) * 0.55);
}
