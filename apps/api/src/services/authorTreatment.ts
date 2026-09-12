import type { AuthorMetamorphicRelationSet, AuthorTreatment, AuthorTreatmentId } from "@qre/contracts";

const DESCRIPTORS: Record<AuthorTreatmentId, { primary: string; secondary: string; rule: string; signals: string[] }> = {
  "horror-romance": {
    primary: "horror",
    secondary: "romance",
    rule: "make danger, vulnerability, intimacy, or normalization change the emotional reading of a real relationship",
    signals: ["contrast", "normalization", "danger", "vulnerability", "relationship", "recontextualization"],
  },
  "heist-comedy": {
    primary: "heist",
    secondary: "comedy",
    rule: "make a real objective, dependency, workaround, or consequence feel like a clever operation",
    signals: ["dependency", "consequence", "convergence", "workaround", "objective", "asymmetry"],
  },
  "game-fierce": {
    primary: "game",
    secondary: "fierce",
    rule: "make a real priority, competition, repeated behavior, or escalating constraint feel like a live contest",
    signals: ["priority", "recurrence", "competition", "escalation", "state_change", "scarcity"],
  },
  "noir-tenderness": {
    primary: "noir",
    secondary: "tenderness",
    rule: "let ambiguity, withheld meaning, memory, and relationship detail carry the emotional weight",
    signals: ["ambiguity", "memory", "relationship", "recontextualization", "identity", "withheld"],
  },
  "documentary-chaos": {
    primary: "documentary",
    secondary: "chaos",
    rule: "make a dense real system reveal its hidden order through contradiction, accumulation, anomaly, or consequence",
    signals: ["anomaly", "accumulation", "contradiction", "precision", "consequence", "system"],
  },
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function relationText(relations: AuthorMetamorphicRelationSet): string[] {
  return relations.relations.flatMap((relation) => [
    relation.type,
    relation.mechanism,
    relation.realizationMove,
    relation.creativeOpportunity,
    relation.feltEffect,
    relation.viewerShift,
    relation.languageAim,
  ]);
}

function scoreTreatment(id: AuthorTreatmentId, relations: AuthorMetamorphicRelationSet, returning: boolean): number {
  const descriptor = DESCRIPTORS[id];
  const text = relationText(relations).join(" ").toLowerCase();
  const matches = descriptor.signals.reduce((score, signal) => score + (text.includes(signal.replace("_", " ")) ? 1 : 0), 0);
  const strongest = relations.relations[0]?.score ?? 0;
  const recurrenceBonus = returning && id === "game-fierce" ? 0.08 : 0;
  const reentryBonus = returning && id === "noir-tenderness" ? 0.05 : 0;
  return clamp(0.22 + matches / Math.max(1, descriptor.signals.length) * 0.55 + strongest * 0.15 + recurrenceBonus + reentryBonus);
}

export function chooseFallbackTreatment(input: {
  relations: AuthorMetamorphicRelationSet;
  returning?: boolean;
  preferred?: AuthorTreatmentId;
}): AuthorTreatment {
  const ranked = Object.keys(DESCRIPTORS)
    .map((key) => key as AuthorTreatmentId)
    .map((id) => ({ id, score: scoreTreatment(id, input.relations, Boolean(input.returning)) }))
    .sort((a, b) => b.score - a.score);
  const selected = input.preferred && DESCRIPTORS[input.preferred]
    ? ranked.find((item) => item.id === input.preferred) ?? ranked[0]
    : ranked[0];
  const descriptor = DESCRIPTORS[selected.id];
  return {
    id: selected.id,
    primary: descriptor.primary,
    secondary: descriptor.secondary,
    rule: descriptor.rule,
    reason: `Selected from grounded relationship signals: ${descriptor.signals.join(", ")}.`,
    score: selected.score,
  };
}

export function treatmentDescriptor(id: AuthorTreatmentId): string {
  return DESCRIPTORS[id].rule;
}

export function isAuthorTreatmentId(value: unknown): value is AuthorTreatmentId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(DESCRIPTORS, value);
}
