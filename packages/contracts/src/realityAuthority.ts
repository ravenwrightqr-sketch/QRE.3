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

const IDENTITY_VALUE = /^(?:dog|puppy|poodle|cat|kitten|pet|animal|bird|horse|rabbit|person|woman|man|child|baby|family|business|company|restaurant|house|home|property|car|vehicle|breed|type|kind|owner|partner|spouse)$/i;
const IDENTITY_PHRASE = /^(?:a|an)\s+(?:dog|puppy|poodle|cat|kitten|pet|animal|bird|horse|rabbit|person|woman|man|child|baby|family|business|company|restaurant|house|home|property|car|vehicle)$/i;
const SUBJECT_ASSERTION = /^(?<subject>.+?)\s+(?:is|was|are|were)\s+(?<value>.+)$/i;

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
  if (IDENTITY_VALUE.test(value) || IDENTITY_PHRASE.test(value)) return true;

  const assertion = value.match(SUBJECT_ASSERTION);
  if (!assertion) return false;
  const assertedSubject = clean(assertion.groups?.subject).toLowerCase();
  const assertedValue = clean(assertion.groups?.value);

  if (subjectText && assertedSubject === subjectText) return true;
  if (IDENTITY_VALUE.test(assertedValue) || IDENTITY_PHRASE.test(assertedValue)) return true;

  return normalized === subjectText;
}

export function classifyRealityFragment(
  text: string,
  subject?: string,
): RealityAuthorityKind {
  return looksLikeIdentityAssertion(text, subject) ? "attribute" : "event";
}
