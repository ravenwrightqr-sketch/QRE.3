import type {
  AuthorCharacterProfile,
  AuthorLensKind,
  AuthorLensProfile,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { rankLensOpportunities as rankCanonicalLensOpportunities, resolveLensPolicy } from "./authorLensPolicy.js";

/**
 * COMPATIBILITY ADAPTER ONLY.
 *
 * authorLensPolicy.ts is the sole lens authority. This module exists only
 * because older Author consumers still use the narrower AuthorLensProfile API.
 * There is no lens registry, alias table, ranking policy, or lens behavior here.
 */

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function tokens(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function profileFromPolicy(lens?: string): AuthorLensProfile {
  const policy = resolveLensPolicy(lens);
  const kind =
    policy.name === "comedy" ||
    policy.name === "romance" ||
    policy.name === "horror" ||
    policy.name === "tenderness" ||
    policy.name === "nostalgia"
      ? (policy.name as AuthorLensKind)
      : ("custom" as AuthorLensKind);

  return {
    kind,
    label: policy.name,
    framingBias: unique([
      ...policy.worldOrbit,
      ...policy.observerTarget,
      ...policy.terms.slice(0, 8),
    ]),
    realizationPreferences: unique(policy.realizationMoves) as AuthorLensProfile["realizationPreferences"],
    forbiddenRealityMoves: unique(policy.forbiddenRealityMoves),
    intensity: policy.intensity,
  };
}

export function classifyLens(value?: string): AuthorLensProfile {
  return profileFromPolicy(value);
}

export function rankLensOpportunities(
  envelope: RealityEnvelope,
): Array<{ frame: string; reason: string; confidence: number }> {
  return rankCanonicalLensOpportunities(envelope);
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
  const statusPosture = coreTraits.length >= 2
    ? `${coreTraits[0]} versus ${coreTraits[1]}`
    : coreTraits[0] || "neutral";
  const emotionalPosture = tensions[0] ||
    (states.length >= 2 ? `${states[0]} alongside ${states[1]}` : states[0] || "unspecified");
  const privateInterpretations = unique([
    ...tensions,
    ...envelope.relations.map((relation) => `relationship:${relation.kind}`),
    ...(envelope.recurringSignals ?? []).map((signal) => `signal:${signal}`),
  ]).slice(0, 18);
  const confidence = metric(Math.min(
    1,
    0.35 +
      Math.min(0.25, coreTraits.length * 0.04) +
      Math.min(0.2, tensions.length * 0.05) +
      Math.min(0.2, actions.length * 0.04),
  ));

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
    ...(envelope.recurringSignals ?? []),
    ...(envelope.sensorySignals ?? []),
  ].join(" "));
  const bias = tokens(lens.framingBias.join(" "));
  if (!bias.size || !all.size) return 0;
  let hits = 0;
  for (const token of bias) if (all.has(token)) hits += 1;
  return metric(hits / bias.size);
}
