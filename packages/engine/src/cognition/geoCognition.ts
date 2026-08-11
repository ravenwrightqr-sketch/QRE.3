import type { CognitiveEvidence, CognitiveExperienceState } from "@qre/contracts";

/**
 * GEO COGNITION
 *
 * Extracts geographic meaning already present in a prompt and turns it into
 * cognition-ready opportunity signals. It never geocodes a place or invents
 * coordinates. Physical pins remain authoritative when supplied by runtime
 * context; named places, dates, distances, routes, people, and destinations
 * remain semantic evidence until a real location signal exists.
 *
 * IMPORTANT: this layer is intentionally domain-neutral. It must not contain a
 * list of "known" cities, businesses, weddings, services, or other verticals.
 */

export type GeoCognition = {
  places: string[];
  dates: string[];
  times: string[];
  distances: string[];
  routes: string[];
  people: string[];
  destinations: string[];
  intentions: string[];
  evidence: CognitiveEvidence[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];
const lower = (value: string) => clean(value).toLowerCase();

function matches(text: string, pattern: RegExp): string[] {
  return unique((text.match(pattern) ?? []).map(clean));
}

function stripPrefix(value: string): string {
  return clean(value.replace(/^\b(?:at|in|near|from|to|toward|towards|on)\s+/i, ""));
}

/**
 * Recover arbitrary proper-noun place phrases without requiring a geography
 * vocabulary. For example, "at The Glasshouse in Austin" yields
 * "The Glasshouse" and "Austin" without knowing either name in advance.
 */
function contextualPlacePhrases(text: string): string[] {
  const phrases = matches(
    text,
    /\b(?:at|in|near|from|to|toward|towards|on)\s+([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,5})/g,
  ).map(stripPrefix);

  return unique(phrases.filter((value) => !/^(?:The|A|An)$/i.test(value)));
}

function contextualPersonPhrases(text: string): string[] {
  return unique(
    matches(
      text,
      /\b(?:my|our|their|his|her|for)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g,
    ).map((value) =>
      value.replace(/^\b(?:my|our|their|his|her|for)\s+/i, ""),
    ),
  );
}

export function deriveGeoCognition(prompt: string): GeoCognition {
  const text = clean(prompt);
  const lo = lower(text);

  const places = contextualPlacePhrases(text);

  const dates = unique([
    ...matches(text, /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b/gi),
    ...matches(text, /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g),
    ...matches(text, /\b(?:today|tonight|tomorrow|yesterday|friday|saturday|sunday|monday|tuesday|wednesday|thursday)\b/gi),
  ]);

  const times = matches(text, /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi);
  const distances = matches(text, /\b\d[\d,]*(?:\.\d+)?\s*(?:miles?|mi|kilometers?|km)\b/gi);

  const routeMatches = [
    ...matches(text, /\bfrom\s+.+?\s+to\s+.+?(?=[,.!?]|\s+and\s+|$)/gi),
    ...matches(text, /\b(?:travel(?:ed|ing)?|drove|flew|went|moved|journeyed)\s+(?:\d[\d,]*(?:\.\d+)?\s*)?(?:miles?|mi|kilometers?|km)?\s*from\s+.+?\s+to\s+.+?(?=[,.!?]|\s+and\s+|$)/gi),
  ];
  const routes = unique(routeMatches);

  const people = contextualPersonPhrases(text);

  const destinationPhrases = [
    ...matches(text, /\b(?:want|wants|wish|wishes|hope|hopes|plan|plans|planning|dream|dreams|would love)\s+(?:to\s+)?(?:travel|go|visit|return|see)\s+(?:to\s+)?([^,.!?]+?)(?=[,.!?]|\s+and\s+|$)/gi),
    ...matches(text, /\b(?:want to travel to|dream of visiting|places we want to travel to)\s+([^,.!?]+)/gi),
  ];
  const destinations = unique(
    destinationPhrases.map((value) =>
      value.replace(/^.*?\b(?:travel|go|visit|return|see|visiting|to)\s+/i, ""),
    ),
  );

  const intentions = unique([
    ...(distances.length ? ["travel_distance"] : []),
    ...(routes.length ? ["route_memory"] : []),
    ...(places.length ? ["place_memory"] : []),
    ...(destinations.length ? ["future_destination"] : []),
    ...(dates.length || times.length ? ["temporal_anchor"] : []),
    ...(people.length && places.length ? ["people_across_places"] : []),
    ...(places.length || distances.length || routes.length ? ["geographic_story"] : []),
  ]);

  const evidence: CognitiveEvidence[] = [
    ...places.map((value) => ({
      source: "location" as const,
      detail: `named place preserved from prompt: ${value}`,
      confidence: 0.97,
    })),
    ...dates.map((value) => ({
      source: "prompt" as const,
      detail: `date preserved as geographic-temporal evidence: ${value}`,
      confidence: 0.97,
    })),
    ...times.map((value) => ({
      source: "prompt" as const,
      detail: `time preserved as geographic-temporal evidence: ${value}`,
      confidence: 0.97,
    })),
    ...distances.map((value) => ({
      source: "location" as const,
      detail: `travel distance preserved from prompt: ${value}`,
      confidence: 0.95,
    })),
    ...routes.map((value) => ({
      source: "location" as const,
      detail: `route relationship preserved from prompt: ${value}`,
      confidence: 0.95,
    })),
    ...destinations.map((value) => ({
      source: "history" as const,
      detail: `future destination preserved from prompt: ${value}`,
      confidence: 0.94,
    })),
    ...people.map((value) => ({
      source: "prompt" as const,
      detail: `person/place relationship candidate preserved: ${value}`,
      confidence: 0.9,
    })),
  ];

  // A prompt that explicitly says "dropped pin" is a request for a location
  // anchor, not permission to fabricate coordinates.
  if (/\b(?:dropped|drop|pin|pinned|location pin)\b/i.test(lo)) {
    intentions.push("pin_requested");
    evidence.push({
      source: "location",
      detail: "prompt requests a location pin; physical coordinates must come from supplied runtime location data",
      confidence: 0.99,
    });
  }

  return {
    places,
    dates,
    times,
    distances,
    routes,
    people,
    destinations,
    intentions: unique(intentions),
    evidence: evidence.slice(0, 24),
  };
}

export function enrichCognitiveGeo(
  prompt: string,
  cognition: CognitiveExperienceState,
): CognitiveExperienceState {
  const geo = deriveGeoCognition(prompt);
  if (!geo.evidence.length) return cognition;

  const geographicOpportunities = unique([
    ...cognition.geographicOpportunities,
    ...geo.places.map((place) => `place:${place}`),
    ...geo.distances.map((distance) => `distance:${distance}`),
    ...geo.routes.map((route) => `route:${route}`),
    ...geo.destinations.map((destination) => `destination:${destination}`),
    ...geo.intentions.map((intent) => `geo:${intent}`),
  ]);

  const geographicModel = unique([
    ...cognition.plan.geographicModel,
    ...geo.places.map((place) => `place:${place}`),
    ...geo.dates.map((date) => `date:${date}`),
    ...geo.times.map((time) => `time:${time}`),
    ...geo.distances.map((distance) => `distance:${distance}`),
    ...geo.routes.map((route) => `route:${route}`),
    ...geo.destinations.map((destination) => `destination:${destination}`),
    ...geo.intentions.map((intent) => `intent:${intent}`),
  ]);

  return {
    ...cognition,
    geographicOpportunities,
    plan: {
      ...cognition.plan,
      geographicModel,
      futureEvolution: unique([
        ...cognition.plan.futureEvolution,
        ...(geo.destinations.length
          ? ["future destinations can become remembered goals"]
          : []),
        ...(geo.routes.length || geo.distances.length
          ? ["travel history can remain ordered as route evidence"]
          : []),
      ]),
    },
    assumptions: cognition.assumptions,
  };
}
