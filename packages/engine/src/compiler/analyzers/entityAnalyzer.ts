import type { ExperienceEntities } from "@qre/contracts";

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Reality extraction is deliberately conservative: capture concrete phrases
 * without pretending a generic noun is a named person/place/company.
 */
export function analyzeEntities(prompt: string): ExperienceEntities {
  const lower = prompt.toLowerCase();
  const people: string[] = [];
  const places: string[] = [];
  const organizations: string[] = [];
  const dates: string[] = [];
  const times: string[] = [];
  const events: string[] = [];
  const products: string[] = [];
  const urls: string[] = [];
  const phones: string[] = [];
  const emails: string[] = [];
  const media: string[] = [];
  const keywords: string[] = [];

  for (const match of prompt.matchAll(/(?:for|by|with|from)\s+([A-Z][A-Za-z0-9.'@-]*(?:\s[A-Z][A-Za-z0-9.'-]*)?)/g)) {
    people.push(match[1]);
  }

  for (const match of prompt.matchAll(/(?:at|in|near|inside)\s+([A-Z][A-Za-z\s]+)/g)) {
    places.push(match[1].trim());
  }

  const eventWords = ["wedding", "concert", "festival", "birthday", "anniversary", "party", "rave", "show", "treasure hunt", "hunt", "quest"];
  for (const word of eventWords) if (lower.includes(word)) events.push(word);

  const productWords = ["qr", "qr code", "tag", "keychain", "sticker", "card", "poster", "shirt", "painting", "album", "book", "collectible", "watch"];
  for (const word of productWords) if (lower.includes(word)) products.push(word);

  if (/photo|image|video|film|audio|music|voice|gallery/i.test(prompt)) media.push("media");
  dates.push(...(prompt.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g) ?? []));
  urls.push(...(prompt.match(/https?:\/\/[^\s]+/gi) ?? []));
  emails.push(...(prompt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []));
  phones.push(...(prompt.match(/\+?\d[\d\s()-]{7,}\d/g) ?? []));

  // Preserve meaningful multi-word concepts instead of throwing away the
  // entire prompt and retaining only the verb "create".
  const conceptPhrases = [
    "treasure hunt", "luxury watch", "wedding day", "missing dog",
    "dog is missing", "time capsule", "memory book", "story", "journey",
    "adventure", "mystery", "memorial", "recipe", "tutorial",
  ];
  keywords.push(...conceptPhrases.filter((phrase) => lower.includes(phrase)));
  keywords.push(
    ...lower
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 5 && !["create", "experience", "something", "wants"].includes(word)),
  );

  return {
    people: unique(people),
    places: unique(places),
    organizations: unique(organizations),
    dates: unique(dates),
    times: unique(times),
    events: unique(events),
    products: unique(products),
    urls: unique(urls),
    phones: unique(phones),
    emails: unique(emails),
    media: unique(media),
    keywords: unique(keywords),
  };
}
