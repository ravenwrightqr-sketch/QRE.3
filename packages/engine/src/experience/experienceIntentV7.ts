import type { ExperienceEntities } from "@qre/contracts";

export type ExperienceIntentV7 = {
  domain: string;
  purpose: "service_receipt" | "memory" | "journey" | "event" | "business" | "personal" | "collection" | "story";
  subject: string;
  subjectKind: string;
  audience: string[];
  tone: string[];
  memoryEnabled: boolean;
  continuationEnabled: boolean;
  mediaExpected: boolean;
  signals: string[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

const DOMAIN_RULES: Array<[string, RegExp]> = [
  ["dog_grooming", /\b(dog|pet|groom|groomer|bath|bow|dryer|pomeranian|puppy)\b/i],
  ["housekeeping", /\b(housekeep|cleaning|cleaned|kitchen|bathrooms?|maid|tidy|spotless)\b/i],
  ["real_estate", /\b(real estate|property|listing|open house|buyer|seller|home tour|house for sale)\b/i],
  ["wedding", /\b(wedding|bride|groom|vows|ceremony|honeymoon|guestbook)\b/i],
  ["travel", /\b(travel|trip|journey|vacation|visited|beach|rave|festival|tour)\b/i],
  ["artist", /\b(artist|musician|album|song|painting|artwork|performance|fans?)\b/i],
  ["restaurant", /\b(restaurant|cafe|coffee|menu|dish|dinner|lunch|chef|server)\b/i],
  ["personal", /\b(myself|my life|manifest|manifestation|goal|goals|dream|future|affirmation)\b/i],
];

const PURPOSE_RULES: Array<[ExperienceIntentV7["purpose"], RegExp]> = [
  ["service_receipt", /\b(after|when|once)\b[\s\S]{0,80}\b(service|appointment|job|visit|grooming|cleaning)\b/i],
  ["memory", /\b(memory|memories|remember|keepsake|legacy|preserve|forever|archive)\b/i],
  ["journey", /\b(travel|trip|journey|adventure|route|passport)\b/i],
  ["event", /\b(event|wedding|party|concert|festival|rave|ceremony|birthday)\b/i],
  ["collection", /\b(collection|collect|gallery|archive|series|adventures)\b/i],
  ["business", /\b(business|customers?|clients?|brand|promotion|marketing|loyalty|reward)\b/i],
  ["personal", /\b(manifest|goal|dream|future|affirmation|myself)\b/i],
  ["story", /\b(story|movie|film|cinematic|narrative)\b/i],
];

function findSubject(prompt: string, entities: ExperienceEntities): string {
  const text = clean(prompt);
  const proper = text.match(/\b([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})\b/);
  if (proper && !/^(I|Make|Create|Build|After|Everyone|The|This)$/.test(proper[1])) return proper[1];
  const explicit = text.match(/\b(?:for|about|of|called|named)\s+([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z][A-Za-z0-9'’-]*){0,2})/i)?.[1];
  if (explicit && !/^(everyone|customers?|clients?|people|users?)$/i.test(explicit)) return clean(explicit);
  return entities.products?.[0] ?? entities.events?.[0] ?? entities.places?.[0] ?? "the experience";
}

export function inferExperienceIntentV7(prompt: string, entities: ExperienceEntities): ExperienceIntentV7 {
  const text = clean(prompt);
  const lo = lower(text);
  const domain = DOMAIN_RULES.find(([, rule]) => rule.test(text))?.[0] ?? "general";
  const purpose = PURPOSE_RULES.find(([, rule]) => rule.test(text))?.[0] ?? "story";
  const subject = findSubject(text, entities);

  const audience = unique([
    ...((entities.people ?? []).length ? ["people"] : []),
    /\b(customer|client|owner|guest|viewer|fan|audience|visitor|participant)\b/i.test(text) ? "audience" : "owner",
  ]);

  const tone = unique([
    /\bfunny|humor|comedy|silly|ridiculous|playful|wild|chaotic|lawyer|battle\b/i.test(text) ? "funny" : "cinematic",
    /\bwarm|love|romantic|family|gentle|sweet\b/i.test(text) ? "warm" : "",
    /\bdark|horror|scary|creepy\b/i.test(text) ? "dark" : "",
    /\bmyster|secret|hidden|clue\b/i.test(text) ? "mysterious" : "",
  ]);

  return {
    domain,
    purpose,
    subject,
    subjectKind: domain === "dog_grooming" ? "pet" : domain === "real_estate" ? "property" : domain === "wedding" ? "event" : "entity",
    audience: audience.length ? audience : ["viewer"],
    tone: tone.length ? tone : ["cinematic"],
    memoryEnabled: /\b(memory|memories|remember|every visit|again|return|adventures|history|forever|keep)\b/i.test(text) || ["dog_grooming", "wedding", "travel", "personal"].includes(domain),
    continuationEnabled: /\b(again|next|return|every|each|over time|keep|adventures|series|growing|forever)\b/i.test(text),
    mediaExpected: /\b(photo|picture|image|video|gallery|film|qr|nfc)\b/i.test(text),
    signals: unique([
      domain,
      purpose,
      subject,
      ...((entities.keywords ?? []).slice(0, 20)),
    ]),
  };
}
