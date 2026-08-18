/**
 * QRE ENTERPRISE MOUTH ACCEPTANCE MATRIX · DOMAIN-NEUTRAL REGRESSION FIXTURES
 *
 * These fixtures deliberately test structural authoring behavior rather than
 * one industry's vocabulary. They are data-only so the same deterministic
 * validators can be exercised without Ollama.
 */

export type EnterpriseMouthFixture = {
  id: string;
  domain: string;
  prompt: string;
  subject: string;
  facts: string[];
  moments: string[];
  lens: string;
  requiredInvariants: string[];
};

export const ENTERPRISE_MOUTH_ACCEPTANCE_MATRIX: readonly EnterpriseMouthFixture[] = [
  {
    id: "service-contradiction",
    domain: "service",
    prompt: "Dog grooming service receipt",
    subject: "Coco",
    facts: [
      "poodle",
      "nervous",
      "fierce",
      "came in nervous",
      "got a bath",
      "stole a blue bow",
      "left looking fabulous",
    ],
    moments: [
      "came in nervous",
      "got a bath",
      "stole a blue bow",
      "left looking fabulous",
    ],
    lens: "funny, affectionate, slightly fierce",
    requiredInvariants: [
      "nervous-to-fierce relation must remain grounded",
      "blue-bow detail must remain concrete",
      "supplied ending must remain the endpoint",
      "no grooming equipment may be inferred as fact",
    ],
  },
  {
    id: "wedding-callback",
    domain: "wedding",
    prompt: "Wedding memory",
    subject: "Maya",
    facts: [
      "rain",
      "red umbrella",
      "late",
      "laughing",
      "shared a red umbrella",
      "arrived late",
      "danced anyway",
    ],
    moments: [
      "arrived late",
      "shared a red umbrella",
      "danced anyway",
    ],
    lens: "romantic, intimate, playful",
    requiredInvariants: [
      "late arrival can recontextualize the umbrella",
      "umbrella can become a callback anchor",
      "danced anyway must remain the supplied endpoint",
      "do not invent vows, rings, guests, music, or venue details",
    ],
  },
  {
    id: "restaurant-status",
    domain: "restaurant",
    prompt: "Dinner service memory",
    subject: "Jordan",
    facts: [
      "quiet",
      "spicy noodles",
      "extra napkins",
      "finished everything",
      "asked for extra napkins",
      "finished everything",
    ],
    moments: [
      "asked for extra napkins",
      "ate spicy noodles",
      "finished everything",
    ],
    lens: "comic, dry, character-specific",
    requiredInvariants: [
      "napkins must remain grounded",
      "spicy noodles must remain grounded",
      "completion must feel earned rather than merely announced",
      "do not invent staff reactions or restaurant atmosphere",
    ],
  },
  {
    id: "real-estate-reframe",
    domain: "real-estate",
    prompt: "Property showing memory",
    subject: "The blue house",
    facts: [
      "small kitchen",
      "large backyard",
      "buyer hesitated",
      "buyer smiled",
      "asked about the backyard",
      "stayed longer than planned",
    ],
    moments: [
      "buyer hesitated",
      "asked about the backyard",
      "stayed longer than planned",
    ],
    lens: "observational, warm, understated",
    requiredInvariants: [
      "hesitation must be allowed to change meaning",
      "backyard must remain the supplied object of attention",
      "stayed longer than planned is the endpoint",
      "do not invent a purchase or emotional conclusion",
    ],
  },
  {
    id: "horror-memory",
    domain: "memory",
    prompt: "A strange hallway memory",
    subject: "The hallway",
    facts: [
      "lights were on",
      "door was open",
      "room was empty",
      "key was still warm",
      "door was open",
      "key was still warm",
    ],
    moments: [
      "door was open",
      "room was empty",
      "key was still warm",
    ],
    lens: "quiet horror, restrained",
    requiredInvariants: [
      "ordinary supplied details must remain ordinary",
      "the warm key must carry the unresolved implication",
      "no person may be invented",
      "no sound, shadow, movement, or explanation may be invented",
    ],
  },
  {
    id: "romantic-callback",
    domain: "memory",
    prompt: "A first-date memory",
    subject: "Sam",
    facts: [
      "both ordered tea",
      "forgot the sugar",
      "shared one cup",
      "same joke twice",
      "shared one cup",
      "laughed at the same joke twice",
    ],
    moments: [
      "forgot the sugar",
      "shared one cup",
      "same joke twice",
    ],
    lens: "romantic, restrained, specific",
    requiredInvariants: [
      "shared cup must become a meaningful callback",
      "same joke twice must change the earlier reading",
      "do not invent a kiss, declaration, or relationship status",
    ],
  },
] as const;

export const ENTERPRISE_MOUTH_STRUCTURAL_INVARIANTS: readonly string[] = [
  "Reality is immutable.",
  "The mouth cannot expand the approved beat count.",
  "Every realization slot has a finite source-event set.",
  "Multi-signal beats must execute graph-supported relationships.",
  "Analytic language is not realization.",
  "Keyword assembly is not realization.",
  "Concrete actions and objects require source support.",
  "The final line must remain tied to supplied endpoint evidence.",
  "A quality pass requires semantic execution, not merely valid JSON.",
  "Development mode may reduce model calls but may not weaken truth gates.",
] as const;
