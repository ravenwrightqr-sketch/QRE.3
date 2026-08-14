import type { UniversalMindContext } from "./universalMindContext.js";
import { buildWorldModel } from "./worldModel.js";

export type MemoryResolution = {
  matches: string[];
  place?: string;
  participants: string[];
  relatedTerms: string[];
  questions: string[];
};

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "") : "";
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const STOP_NAMES = /^(The|Then|At|And|My|Our|This|First|Later|Everyone|Grandma)$/i;
const TEMPORAL_TAIL = /\s+(?:at\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this\s+(?:morning|afternoon|evening)|last\s+night|two\s+weeks?\s+ago|three\s+years?\s+later|until\s+closing|at\s+(?:sunrise|sunset)|for\s+\w+\s+(?:minutes|hours|days|weeks|years))\b.*$/i;
const MEMORY_PLACE_RE = /\b(?:at|in|inside|near|on|onto|under|underneath|behind|beside|between|across|through|within|from|to|toward|towards)\s+(?:(?:the|a|an|my|our|your|his|her|their|this|that)\s+)?([A-Za-z0-9][A-Za-z0-9'’&.-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’&.-]*){0,8})/i;

function strings(context: UniversalMindContext): string[] {
  return unique([
    ...(context.memorySummary ?? []),
    ...(context.memories ?? []).map((value) => typeof value === "string" ? value : JSON.stringify(value) ?? ""),
  ]);
}

function normalizePlace(value: string): string {
  return clean(value)
    .replace(/^(?:the|a|an|my|our|your|his|her|their|this|that)\s+/i, "")
    .replace(TEMPORAL_TAIL, "")
    .replace(/\s+(?:where|when|because|while|after|before)\b.*$/i, "")
    .trim();
}

function memoryPlaceEvidence(entry: string): string[] {
  const worldPlaces = buildWorldModel(entry).places;
  if (worldPlaces.length) return worldPlaces;
  const match = entry.match(MEMORY_PLACE_RE);
  if (!match?.[1]) return [];
  const fallback = normalizePlace(match[1]);
  return fallback ? [fallback] : [];
}

function memoryEpisodes(entries: string[]) {
  return entries.map((entry, index) => ({
    entry,
    index,
    places: memoryPlaceEvidence(entry),
    world: buildWorldModel(entry),
  }));
}

function explicitPlaceFromPrompt(prompt: string): string | undefined {
  const world = buildWorldModel(prompt);
  if (world.places.length === 1) return world.places[0];
  const match = prompt.match(MEMORY_PLACE_RE);
  return match?.[1] ? normalizePlace(match[1]) : undefined;
}

export function resolveMemory(prompt: string, context: UniversalMindContext): MemoryResolution {
  const memory = strings(context);
  if (!memory.length) return { matches: [], participants: [], relatedTerms: [], questions: [] };

  const promptWords = new Set(prompt.toLowerCase().split(/\W+/).filter((word) => word.length >= 4));
  const returning = /\b(?:back|again|returned|returning|same place|there|here)\b/i.test(prompt);

  const scored = memory.map((entry, index) => {
    const words = entry.toLowerCase().split(/\W+/).filter((word) => word.length >= 4);
    const overlap = words.reduce((score, word) => score + (promptWords.has(word) ? 1 : 0), 0);
    return { entry, score: overlap, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const relevant = returning ? scored : scored.filter((item) => item.score > 0).slice(0, 6);
  const episodes = memoryEpisodes(relevant.slice(0, 12).map((item) => item.entry));
  const placeBearingEpisodes = episodes.filter((episode) => episode.places.length > 0);
  const distinctPlaces = unique(placeBearingEpisodes.flatMap((episode) => episode.places));
  const explicitPlace = explicitPlaceFromPrompt(prompt);
  const topEntries = episodes.map((episode) => episode.entry);
  const participants = unique(topEntries.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0]))).filter((name) => !STOP_NAMES.test(name));
  const relatedTerms = unique(topEntries.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40);

  if (explicitPlace) return { matches: topEntries, place: explicitPlace, participants, relatedTerms, questions: [] };

  if (returning) {
    if (placeBearingEpisodes.length >= 2) return { matches: topEntries, participants, relatedTerms, questions: ["Which place did you go back to?"] };
    if (placeBearingEpisodes.length === 1) return { matches: topEntries, place: placeBearingEpisodes[0]!.places[0], participants, relatedTerms, questions: [] };
    return { matches: topEntries, participants, relatedTerms, questions: ["Where did you go back to?"] };
  }

  if (distinctPlaces.length === 1) return { matches: topEntries, place: distinctPlaces[0], participants, relatedTerms, questions: [] };
  return { matches: topEntries, participants, relatedTerms, questions: [] };
}
