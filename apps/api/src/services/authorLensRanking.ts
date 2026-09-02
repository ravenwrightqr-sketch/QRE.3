import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { resolveLensPolicy, type LensPolicy } from "./authorLensPolicy.js";

export type LensOpportunity = {
  frame: string;
  reason: string;
  confidence: number;
};

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const tokens = (values: readonly string[]): Set<string> =>
  new Set(
    values
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );

const overlap = (world: Set<string>, values: readonly string[]): number => {
  const candidate = tokens(values);
  if (!candidate.size) return 0;
  let hits = 0;
  for (const token of candidate) if (world.has(token)) hits += 1;
  return hits / candidate.size;
};

const policyNames = [
  "game", "spy", "heist", "courtroom", "military", "horror", "noir",
  "rom-com", "royal", "documentary", "western", "cyberpunk", "absurd",
  "comedy", "romance", "sentimental", "mystery", "adventure",
] as const;

function worldTokens(envelope: RealityEnvelope): Set<string> {
  return tokens([
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ]);
}

function relationFit(envelope: RealityEnvelope, policy: LensPolicy): number {
  if (!envelope.relations.length) return 0;
  let total = 0;
  let count = 0;
  for (const relation of envelope.relations) {
    const weight = policy.relationWeights[relation.kind];
    if (weight == null) continue;
    total += weight;
    count += 1;
  }
  return count ? total / count : 0;
}

export function rankLensOpportunities(
  envelope: RealityEnvelope,
): LensOpportunity[] {
  const world = worldTokens(envelope);
  const structuralDensity = Math.min(
    1,
    envelope.relations.length / Math.max(1, envelope.events.length * 1.5),
  );
  const tensionSignal = Math.min(1, envelope.unresolvedTensions.length * 0.12);
  const recurrenceSignal = Math.min(1, envelope.recurringSignals.length * 0.12);

  const candidates = policyNames.map((name) => {
    const policy = resolveLensPolicy(name);
    const worldOrbitFit = overlap(world, policy.worldOrbit);
    const observerFit = overlap(world, policy.observerTarget);
    const recurrenceFit = policy.environmentalOperators.some((operator) =>
      /recur|echo|return/i.test(operator),
    ) ? recurrenceSignal : recurrenceSignal * 0.35;
    const tensionFit = policy.observerMode === "tension"
      ? tensionSignal
      : tensionSignal * 0.4;

    const confidence = metric(
      worldOrbitFit * 0.28 +
      observerFit * 0.12 +
      relationFit(envelope, policy) * 0.20 +
      structuralDensity * 0.12 +
      tensionFit * 0.12 +
      recurrenceFit * 0.08 +
      policy.intensity * 0.08,
    );

    return {
      frame: policy.name,
      reason: `${policy.name} privileges ${policy.worldOrbit.slice(0, 4).join(", ")} already available in the supplied world; it changes perception, sequencing, and realization pressure without creating concrete reality.`,
      confidence,
    };
  });

  const native = tokens([
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
  ]);
  const nativeConfidence = metric(
    Math.min(1, envelope.events.length / 5) * 0.35 +
    Math.min(1, envelope.relations.length / Math.max(1, envelope.events.length)) * 0.35 +
    Math.min(1, native.size / 20) * 0.30,
  );

  candidates.push({
    frame: "NONE",
    reason: "Preserve the native supplied reality when it already carries the strongest observer opportunity.",
    confidence: nativeConfidence,
  });

  return candidates
    .sort((left, right) => right.confidence - left.confidence || left.frame.localeCompare(right.frame))
    .slice(0, 8);
}
