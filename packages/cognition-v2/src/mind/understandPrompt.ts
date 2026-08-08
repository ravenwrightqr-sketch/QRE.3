import type {
  CognitiveIntent,
  CognitiveUnderstanding
} from "../types.js";
import type { CognitiveWorldModel } from "../worldModel.js";
import { buildCognitiveExperiencePlan } from "../experiencePlan.js";

const intentSignals: Record<CognitiveIntent, string[]> = {
  remember: ["memory", "remember", "memories", "past", "history", "legacy", "childhood", "nostalgia", "tribute", "preserve"],
  celebrate: ["birthday", "wedding", "anniversary", "celebrate", "celebration", "party", "milestone", "ceremony"],
  connect: ["family", "friend", "friends", "relationship", "together", "share", "connection", "connect", "love"],
  discover: ["discover", "explore", "secret", "hidden", "unknown", "quest", "adventure", "journey", "reveal", "uncover"],
  teach: ["learn", "teach", "guide", "education", "explain", "tutorial", "lesson", "training"],
  sell: ["buy", "sell", "shop", "product", "customer", "brand", "business", "store", "purchase", "promotion"],
  serve: ["service", "appointment", "booking", "repair", "grooming", "cleaning", "maintenance", "inspection"],
  reward: ["reward", "loyalty", "exclusive", "unlock", "vip", "member", "bonus", "prize", "perk"],
  protect: ["protect", "safety", "emergency", "secure", "security", "warning", "alert"],
  create: ["create", "make", "build", "design", "write", "story", "experience"]
};

const emotionSignals: Record<string, string[]> = {
  nostalgia: ["memory", "past", "childhood", "legacy", "remember", "history", "old"],
  wonder: ["magic", "amazing", "universe", "dream", "discover", "secret", "mystery", "unknown"],
  love: ["love", "wedding", "family", "relationship", "together"],
  joy: ["party", "birthday", "celebrate", "fun", "happy"],
  trust: ["brand", "business", "customer", "safe", "professional"],
  excitement: ["vip", "exclusive", "event", "concert", "festival", "launch"],
  fear: ["danger", "lost", "emergency", "dark", "warning", "threat"]
};

const worldSignals: Record<string, string[]> = {
  memory: ["memory", "remember", "past", "history", "legacy", "childhood", "nostalgia"],
  wedding: ["wedding", "bride", "groom", "marriage", "ceremony", "vows", "anniversary"],
  relationship: ["love", "relationship", "couple", "partner", "family", "together"],
  commerce: ["business", "brand", "customer", "product", "store", "shop", "dispensary"],
  discovery: ["discover", "explore", "secret", "hidden", "mystery", "adventure"],
  community: ["community", "group", "members", "people", "festival", "party", "event"]
};

function matches(text: string, signals: string[]): boolean {
  return signals.some(signal => text.includes(signal));
}

function collect<T extends string>(text: string, rules: Record<T, string[]>): T[] {
  return (Object.entries(rules) as [T, string[]][])
    .filter(([, signals]) => matches(text, signals))
    .map(([key]) => key);
}

function extractPeople(prompt: string): string[] {
  return [...(prompt.match(/\b(?:with|by|from|for)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g) ?? [])]
    .map(value => value.replace(/^(with|by|from|for)\s+/i, "").trim());
}

function extractPlaces(prompt: string): string[] {
  return [...(prompt.match(/\b(?:in|at|near|inside)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g) ?? [])]
    .map(value => value.replace(/^(in|at|near|inside)\s+/i, "").trim());
}

function extractDates(prompt: string): string[] {
  return prompt.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\b/gi) ?? [];
}

function extractTimes(prompt: string): string[] {
  return prompt.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi) ?? [];
}

function extractObjects(prompt: string): string[] {
  const text = prompt.toLowerCase();
  const vocabulary = [
    "qr", "tag", "photo", "photograph", "video", "album", "ring", "house", "car",
    "flower", "gift", "product", "key", "artifact", "surfboard", "dog", "cat",
    "vehicle", "artwork", "jewelry", "clothing", "restaurant", "hotel", "rave", "club"
  ];
  return vocabulary.filter(word => text.includes(word));
}

function resolveMemory(text: string) {
  return {
    past: matches(text, ["past", "history", "childhood", "memory", "remember", "old", "nostalgia"]),
    present: matches(text, ["today", "now", "current", "moment", "live"]),
    future: matches(text, ["future", "goal", "dream", "wish", "plan", "vision"]),
    legacy: matches(text, ["legacy", "tribute", "ancestor", "inherit", "generations"])
  };
}

function resolveAudience(text: string): CognitiveUnderstanding["audience"] {
  const types: string[] = [];

  if (matches(text, ["family", "wedding", "parent", "child", "anniversary"])) types.push("family");
  if (matches(text, ["customer", "business", "brand", "store", "restaurant", "dispensary"])) types.push("customer");
  if (matches(text, ["couple", "partner", "relationship", "wedding"])) types.push("couple");
  if (matches(text, ["community", "group", "members", "people", "festival"])) types.push("community");
  if (!types.length) types.push("individual");

  const social: "solo" | "shared" | "community" =
    types.includes("community") ? "community" : types.length > 1 ? "shared" : "solo";

  return { types, social };
}

function buildCognitiveWorld(
  prompt: string,
  intent: CognitiveIntent[],
  people: string[],
  places: string[],
  objects: string[],
  dates: string[],
  times: string[],
  emotions: string[],
  memory: CognitiveUnderstanding["memory"],
  audience: CognitiveUnderstanding["audience"],
  domains: string[]
): CognitiveWorldModel {
  const entities = [
    ...people.map(text => ({ text, kind: "person" })),
    ...places.map(text => ({ text, kind: "place" })),
    ...objects.map(text => ({ text, kind: "object" }))
  ];

  const events = [
    ...dates.map(date => ({ text: date, kind: "temporal-marker", date, significance: ["temporal"] })),
    ...intent.filter(value => ["celebrate", "discover", "create", "remember", "connect"].includes(value))
      .map(kind => ({ text: prompt, kind, participants: people, significance: emotions }))
  ];

  const relationships = [
    ...people.flatMap(person => places.map(place => ({ subject: person, relation: "associated_with", object: place, confidence: 0.5 }))),
    ...audience.types.map(type => ({ subject: "audience", relation: "includes", object: type, confidence: 0.8 }))
  ];

  return {
    entities,
    events,
    relationships,
    places: places.map(text => ({ text, kind: "mentioned" })),
    emotions,
    desires: [],
    objects,
    themes: [...domains, ...intent],
    temporal: { past: memory.past, present: memory.present, future: memory.future, markers: [...dates, ...times] },
    narrative: {
      hasBeginning: memory.past || domains.includes("memory") || dates.length > 0,
      hasTransformation: intent.includes("create") || intent.includes("discover"),
      hasRelationship: intent.includes("connect") || audience.types.includes("couple"),
      hasMemory: memory.past || intent.includes("remember"),
      hasConflict: emotions.includes("fear"),
      hasMilestone: intent.includes("celebrate"),
      hasDiscovery: intent.includes("discover")
    },
    domains,
    primaryDomain: domains[0] ?? "general"
  };
}

export function understandPrompt(prompt: string): CognitiveUnderstanding {
  const expression = prompt.trim();
  if (!expression) throw new Error("Cannot understand an empty prompt.");

  const text = expression.toLowerCase();
  const intent = collect(text, intentSignals);
  const emotions = collect(text, emotionSignals);
  const domains = collect(text, worldSignals);
  const memory = resolveMemory(text);
  const audience = resolveAudience(text);
  const people = extractPeople(expression);
  const places = extractPlaces(expression);
  const objects = extractObjects(expression);
  const dates = extractDates(expression);
  const times = extractTimes(expression);
  const cognitiveWorld = buildCognitiveWorld(expression, intent, people, places, objects, dates, times, emotions, memory, audience, domains);

  const understanding: CognitiveUnderstanding = {
    prompt: expression,
    intent,
    people,
    places,
    objects,
    events: [],
    dates,
    times,
    emotions,
    memory,
    audience,
    world: { domains, primary: domains[0] ?? "general" },
    cognitiveWorld
  };

  understanding.experiencePlan = buildCognitiveExperiencePlan(understanding);
  return understanding;
}
