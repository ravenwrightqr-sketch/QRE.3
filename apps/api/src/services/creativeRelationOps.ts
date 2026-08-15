import type { AuthorBrainTruth, AuthorScene } from "@qre/contracts";

/**
 * UNIVERSAL CREATIVE RELATION OPERATIONS
 *
 * This is not a phrase bank and not a Coco hack.
 * It turns explicit source relationships into compact candidate expressions.
 * The same operations must generalize across characters, businesses,
 * memories, products, places, events, and organizations.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const RELATION_PATTERNS: Array<{ regex: RegExp; op: (a: string, b: string) => string[] }> = [
  {
    regex: /^(.+?)\s+(?:hates|dislikes|can't stand|avoids)\s+(.+)$/i,
    op: (subject, object) => [`${object} again.`, `${object}: no.`].map(clean),
  },
  {
    regex: /^(.+?)\s+(?:loves|likes|prefers|adores?)\s+(.+)$/i,
    op: (subject, object) => [`${object}: absolutely.`].map(clean),
  },
  {
    regex: /^(.+?)\s+(?:is|was)\s+(.+)$/i,
    op: (subject, state) => [`${state}.`].map(clean),
  },
];

function factCandidates(fact: string): string[] {
  const normalized = clean(fact);
  for (const pattern of RELATION_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) return pattern.op(clean(match[1]), clean(match[2]));
  }
  return [];
}

function conflictCandidates(facts: readonly string[]): string[] {
  const positive = facts.find((fact) => /\b(?:loves|likes|prefers|adores?)\b/i.test(fact));
  const negative = facts.find((fact) => /\b(?:hates|dislikes|can't stand|avoids)\b/i.test(fact));
  if (!positive || !negative) return [];

  const positiveMatch = positive.match(/^.+?\s+(?:loves|likes|prefers|adores?)\s+(.+)$/i);
  const negativeMatch = negative.match(/^.+?\s+(?:hates|dislikes|can't stand|avoids)\s+(.+)$/i);
  if (!positiveMatch || !negativeMatch) return [];

  const left = clean(negativeMatch[1]);
  const right = clean(positiveMatch[1]);
  return [`${left}.`, `${right}.`, `${left} or ${right}?`].map(clean);
}

export function deriveCreativeRelationCandidates(input: AuthorBrainTruth): AuthorScene[] {
  const facts = [
    ...(input.facts ?? []),
    ...(input.sourceMoments ?? []),
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
  ].map(clean).filter(Boolean);

  const candidates = facts.flatMap(factCandidates);
  const conflict = conflictCandidates(facts);

  return [...new Set([...conflict, ...candidates])]
    .filter(Boolean)
    .slice(0, 8)
    .map((text) => ({ text, kind: "line" as const }));
}
