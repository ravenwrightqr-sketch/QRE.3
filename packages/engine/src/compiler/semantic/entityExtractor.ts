/**
 * =====================================================
 * QRE ENTITY EXTRACTOR
 * =====================================================
 *
 * Extracts prompt-grounded entities for downstream cognition and
 * realization. This layer observes; it does not decide meaning.
 *
 * Prompt
 *   ↓
 * Entity Extraction
 *   ↓
 * Understanding / Cognition
 *   ↓
 * Experience Genome / Story / Runtime
 *
 * NO DATABASE
 * NO PRISMA
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */

import type { ExperienceEntities } from "@qre/contracts";

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const placeSignals = [
  "at ",
  "inside ",
  "near ",
  "from ",
  "located in ",
  "visited ",
] as const;

const eventSignals = [
  "concert",
  "show",
  "festival",
  "party",
  "rave",
  "sesh",
  "birthday",
  "anniversary",
  "wedding",
  "celebration",
] as const;

const productSignals = [
  "qr",
  "qr code",
  "keychain",
  "tag",
  "sticker",
  "card",
  "poster",
  "shirt",
  "painting",
  "album",
  "book",
  "collectible",
] as const;

const keywordSignals = [
  "memory",
  "memories",
  "story",
  "photos",
  "photo",
  "video",
  "favorite",
  "collection",
  "reward",
  "loyalty",
  "unlock",
  "secret",
  "exclusive",
  "experience",
] as const;

const mediaSignals = [
  "photo",
  "photos",
  "image",
  "images",
  "video",
  "videos",
  "audio",
  "song",
  "music",
  "recording",
] as const;

function extractAfterSignal(prompt: string, signal: string): string | null {
  const lower = prompt.toLowerCase();
  const index = lower.indexOf(signal);

  if (index === -1) return null;

  const result = prompt
    .slice(index + signal.length)
    .split(/[.,!?;\n]/)[0]
    .trim();

  if (result.length < 2 || result.split(/\s+/).length > 6) {
    return null;
  }

  return result;
}

/**
 * Detect likely person names in common prompt constructions.
 *
 * This is deliberately conservative. Entity extraction supplies evidence;
 * it must not invent people from arbitrary capitalized words.
 */
function extractPeople(prompt: string): string[] {
  const people: string[] = [];

  const patterns = [
    /\bfor\s+([A-Z][A-Za-z0-9@.'-]+(?:\s+[A-Z][A-Za-z0-9.'-]+)?)(?=\s+(?:at|in|on|with|for)\b|[,.!?]|$)/g,
    /\bby\s+([A-Z][A-Za-z0-9@.'-]+(?:\s+[A-Z][A-Za-z0-9.'-]+)?)(?=\s+(?:at|in|on|with|for)\b|[,.!?]|$)/g,
    /\bartist\s+([A-Z][A-Za-z0-9.'-]+)/gi,
    /\bcreator\s+([A-Z][A-Za-z0-9.'-]+)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of prompt.matchAll(pattern)) {
      if (match[1]) people.push(match[1]);
    }
  }

  return unique(people);
}

function extractUrls(prompt: string): string[] {
  return prompt.match(/https?:\/\/[^\s]+/gi) ?? [];
}

function extractEmails(prompt: string): string[] {
  return (
    prompt.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []
  );
}

function extractPhones(prompt: string): string[] {
  return prompt.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
}

function extractDates(prompt: string): string[] {
  return (
    prompt.match(
      /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g,
    ) ?? []
  );
}

function extractTimes(prompt: string): string[] {
  return (
    prompt.match(
      /\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[AaPp][Mm])?|\b(?:1[0-2]|0?[1-9])\s?[AaPp][Mm]\b/g,
    ) ?? []
  );
}

export function extractEntities(prompt: string): ExperienceEntities {
  const lower = prompt.toLowerCase();
  const places: string[] = [];
  const events: string[] = [];
  const products: string[] = [];
  const keywords: string[] = [];
  const media: string[] = [];

  for (const signal of placeSignals) {
    const place = extractAfterSignal(prompt, signal);
    if (place) places.push(place);
  }

  for (const event of eventSignals) {
    if (new RegExp(`\\b${event.replace(/\s+/g, "\\s+")}\\b`, "i").test(lower)) {
      events.push(event);
    }
  }

  for (const product of productSignals) {
    if (new RegExp(`\\b${product.replace(/\s+/g, "\\s+")}\\b`, "i").test(lower)) {
      products.push(product);
    }
  }

  for (const keyword of keywordSignals) {
    if (new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "i").test(lower)) {
      keywords.push(keyword);
    }
  }

  for (const mediaType of mediaSignals) {
    if (new RegExp(`\\b${mediaType.replace(/\s+/g, "\\s+")}\\b`, "i").test(lower)) {
      media.push(mediaType);
    }
  }

  return {
    people: extractPeople(prompt),
    places: unique(places),
    organizations: [],
    dates: unique(extractDates(prompt)),
    times: unique(extractTimes(prompt)),
    events: unique(events),
    products: unique(products),
    urls: unique(extractUrls(prompt)),
    emails: unique(extractEmails(prompt)),
    phones: unique(extractPhones(prompt)),
    keywords: unique(keywords),
    media: unique(media),
  };
}
