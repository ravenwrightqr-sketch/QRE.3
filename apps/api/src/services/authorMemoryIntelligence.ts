import type { AuthorMemoryDelta } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function tokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(left.size, right.size);
}

export function detectCrossMemoryCallbacks(
  previous: RealityEnvelope,
  current: RealityEnvelope,
): string[] {
  const previousLabels = previous.events.map((event) => event.label);
  const currentLabels = current.events.map((event) => event.label);
  const callbacks: string[] = [];

  for (const currentLabel of currentLabels) {
    const currentTokens = tokens(currentLabel);
    let best = 0;
    let matched = "";
    for (const previousLabel of previousLabels) {
      const score = overlap(currentTokens, tokens(previousLabel));
      if (score > best) {
        best = score;
        matched = previousLabel;
      }
    }
    if (best >= 0.5 && matched) callbacks.push(`${matched} → ${currentLabel}`);
  }

  return [...new Set(callbacks)].slice(0, 16);
}

export function buildMemoryDelta(input: {
  memoryId: string;
  previous?: RealityEnvelope;
  current: RealityEnvelope;
  characterChanges?: readonly string[];
  preferredLenses?: AuthorMemoryDelta["preferredLenses"];
}): AuthorMemoryDelta {
  const currentSignals = [
    ...input.current.suppliedPhrases,
    ...input.current.recurringSignals,
    ...input.current.sensorySignals,
  ].map(clean).filter(Boolean);

  const previousLabels = new Set(
    (input.previous?.events ?? []).map((event) => clean(event.label)),
  );

  const addedEvidence = currentSignals.filter((signal) => !previousLabels.has(signal));
  const recurringSignals = [...new Set(
    input.current.recurringSignals.filter((signal) =>
      (input.previous?.recurringSignals ?? []).includes(signal),
    ),
  )];

  const callbacks = input.previous
    ? detectCrossMemoryCallbacks(input.previous, input.current)
    : [];

  const confidence = Number(
    Math.min(
      1,
      0.45 +
        Math.min(0.2, recurringSignals.length * 0.05) +
        Math.min(0.2, callbacks.length * 0.04) +
        Math.min(0.15, addedEvidence.length * 0.02),
    ).toFixed(3),
  );

  return {
    memoryId: input.memoryId,
    addedEvidence: [...new Set(addedEvidence)].slice(0, 32),
    recurringSignals,
    callbacks,
    characterChanges: [...new Set((input.characterChanges ?? []).map(clean).filter(Boolean))].slice(0, 16),
    preferredLenses: [...new Set(input.preferredLenses ?? [])],
    confidence,
  };
}
