/**
 * QRE FOUNDATIONAL REALITY AUTHORITY
 *
 * Reality is structured and persistent.
 * Experience is derived from reality.
 * Identity establishes the world.
 * Events change the world.
 * Memory preserves both.
 * Creativity never becomes reality merely because the Author imagined it.
 */

export type RealityAuthorityKind =
  | "entity"
  | "attribute"
  | "relation"
  | "event"
  | "state"
  | "place"
  | "time"
  | "observation"
  | "memory";

const IDENTITY_TERMS = /\b(?:dog|puppy|poodle|cat|kitten|pet|animal|bird|horse|rabbit|person|woman|man|child|baby|family|business|company|restaurant|house|home|property|car|vehicle|breed|type|kind|owner|partner|spouse)\b/i;
const COPULA = /\b(?:is|was|are|were|=|:)$?/i;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

export function looksLikeIdentityAssertion(
  text: string,
  subject?: string,
): boolean {
  const value = clean(text);
  if (!value) return false;
  const normalized = value.toLowerCase();
  const subjectText = clean(subject).toLowerCase();

  if (/^(?:breed|type|kind|species|owner|partner|spouse)\s*[:=]/i.test(value)) return true;
  if (!IDENTITY_TERMS.test(value)) return false;

  if (subjectText) {
    const escaped = subjectText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const subjectAssertion = new RegExp(`^${escaped}\\s+(?:is|was|are|were)\\s+`, "i");
    if (subjectAssertion.test(value)) return true;
    if (normalized === subjectText) return true;
  }

  return /^(?:dog|puppy|poodle|cat|kitten|pet|animal|bird|horse|rabbit|person|woman|man|child|baby|family|business|company|restaurant|house|home|property|car|vehicle|breed|type|kind|owner|partner|spouse)$/i.test(value)
    || /^(?:a|an)\s+(?:dog|puppy|poodle|cat|kitten|pet|animal|bird|horse|rabbit|person|woman|man|child|baby|family|business|company|restaurant|house|home|property|car|vehicle)$/i.test(value);
}

export function classifyRealityFragment(
  text: string,
  subject?: string,
): RealityAuthorityKind {
  return looksLikeIdentityAssertion(text, subject) ? "attribute" : "event";
}
