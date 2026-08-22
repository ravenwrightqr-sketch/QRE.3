import type { AuthorMultimodalEvidence } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type EvidenceFusionResult = {
  trusted: AuthorMultimodalEvidence[];
  conflicts: AuthorMultimodalEvidence[];
  sourceIds: string[];
  signals: string[];
};

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

export function fuseAuthorEvidence(
  envelope: RealityEnvelope,
  evidence: readonly AuthorMultimodalEvidence[],
): EvidenceFusionResult {
  const source = tokens([
    ...envelope.suppliedTerms,
    ...envelope.suppliedPhrases,
    ...envelope.events.map((event) => event.label),
  ].join(" "));

  const trusted: AuthorMultimodalEvidence[] = [];
  const conflicts: AuthorMultimodalEvidence[] = [];

  for (const item of evidence) {
    const score = overlap(tokens(`${item.label} ${item.value ?? ""}`), source);
    const confidence = item.confidence;
    if (confidence >= 0.7 || score >= 0.4) trusted.push(item);
    else conflicts.push(item);
  }

  const signals = [...new Set(
    trusted
      .flatMap((item) => [item.label, item.value ?? ""])
      .map(clean)
      .filter(Boolean),
  )].slice(0, 64);

  return {
    trusted,
    conflicts,
    sourceIds: [...new Set(trusted.map((item) => item.sourceId))],
    signals,
  };
}
