export type RealityFactType =
  | "identity"
  | "event"
  | "state"
  | "trait"
  | "preference"
  | "relationship"
  | "place"
  | "object"
  | "outcome"
  | "recurrence";

export type TypedRealityFact = {
  text: string;
  type: RealityFactType;
  confidence: number;
  explicit: boolean;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const has = (text: string, pattern: RegExp): boolean => pattern.test(text);

const IDENTITY = /\b(?:is|named|name is|called|a poodle|a dog|a cat|a lawyer|a mechanic|a groomer|a restaurant|a hotel|a wedding|a house)\b/i;
const EVENT = /\b(?:arrived|came|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|broke|held|talked|connected|met|married|celebrated|finished|started|worked|showed|served|paid|saw|came in)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|connected|proud|scared|fierce|sweet|wild|open|closed|private|together|alone|friendly)\b/i;
const TRAIT = /\b(?:fierce|friendly|bold|sweet|calm|wild|quiet|loud|proud|playful|curious|loyal|stubborn|gentle|shy|social|serious|funny)\b/i;
const PREFERENCE = /\b(?:loves?|likes?|hates?|prefers?|enjoys?|favorite|favourite|into|fond of)\b/i;
const RELATIONSHIP = /\b(?:connected|together|married|partner|friend|friends|boyfriend|girlfriend|husband|wife|sister|brother|mother|father|son|daughter|client|customer|owner|manager|employee|colleague)\b/i;
const RECURRENCE = /\b(?:again|returned|return|back|second|third|once more|still|temporary|until|finally|repeated|repeat|every day|daily|each day)\b/i;
const OUTCOME = /\b(?:fabulous|radiant|successful|fixed|resolved|approved|finished|ready|complete|clean|calm|gone|departed|left)\b/i;
const PLACE = /\b(?:bar|restaurant|hotel|house|home|office|shop|store|park|street|room|kitchen|bathroom|court|school|hospital|lobby|beach|neighborhood)\b/i;
const OBJECT = /\b(?:bow|car|agreement|contract|towels?|table|chair|phone|bag|dress|ring|food|bacon|ball|toy|tag|key|keys|document)\b/i;

export function typeRealityFact(value: string, subject = ""): TypedRealityFact {
  const text = clean(value);
  const lowered = text.toLowerCase();
  if (!text) return { text, type: "event", confidence: 0, explicit: false };

  if (lowered === subject.toLowerCase() || IDENTITY.test(text)) {
    return { text, type: "identity", confidence: 0.96, explicit: true };
  }
  if (RECURRENCE.test(text) && !EVENT.test(text)) {
    return { text, type: "recurrence", confidence: 0.93, explicit: true };
  }
  if (PREFERENCE.test(text)) {
    return { text, type: "preference", confidence: 0.95, explicit: true };
  }
  if (RELATIONSHIP.test(text)) {
    return { text, type: "relationship", confidence: 0.92, explicit: true };
  }
  if (TRAIT.test(text) && !EVENT.test(text)) {
    return { text, type: "trait", confidence: 0.9, explicit: true };
  }
  if (PLACE.test(text) && !EVENT.test(text) && !STATE.test(text)) {
    return { text, type: "place", confidence: 0.84, explicit: true };
  }
  if (OBJECT.test(text) && !EVENT.test(text) && !STATE.test(text)) {
    return { text, type: "object", confidence: 0.82, explicit: true };
  }
  if (OUTCOME.test(text)) {
    return { text, type: "outcome", confidence: 0.9, explicit: true };
  }
  if (STATE.test(text)) {
    return { text, type: "state", confidence: 0.9, explicit: true };
  }
  if (EVENT.test(text)) {
    return { text, type: "event", confidence: 0.9, explicit: true };
  }
  return { text, type: "event", confidence: 0.55, explicit: true };
}

export function typeRealityFacts(values: string[], subject = ""): TypedRealityFact[] {
  return values.map((value) => typeRealityFact(value, subject));
}

export function factTypePressure(type: RealityFactType): string {
  switch (type) {
    case "event": return "Use for chronology and trajectory movement.";
    case "state": return "Use as a before/after state, never as a new event.";
    case "trait": return "Use to build personality consistency, not a fabricated biography.";
    case "preference": return "Use as motivation, leverage, callback, or comic texture grounded in the supplied preference.";
    case "relationship": return "Use only when the relationship is explicitly supplied.";
    case "identity": return "Use only as explicit identity; never upgrade it into additional relationships.";
    case "place": return "Treat as supplied world context; never expand the location.";
    case "object": return "Treat as supplied object; never add another prop because it seems plausible.";
    case "outcome": return "Use as earned state/result; do not invent what caused it.";
    case "recurrence": return "Use for echo/callback and persistent meaning.";
  }
}

export function classifyPersonality(values: string[]): { traits: string[]; preferences: string[]; socialSignals: string[] } {
  const typed = typeRealityFacts(values);
  return {
    traits: typed.filter((fact) => fact.type === "trait").map((fact) => fact.text),
    preferences: typed.filter((fact) => fact.type === "preference").map((fact) => fact.text),
    socialSignals: typed.filter((fact) => fact.type === "relationship").map((fact) => fact.text),
  };
}
